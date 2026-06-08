import datetime
from typing import Annotated
from fastapi import APIRouter, HTTPException, Header
from db import supabase
from routers.auth import require_role
from pydantic import BaseModel
from typing import Optional
from schemas.finance import (
    MajorFeeCreate, MajorFeeUpdate,
    StudentFeeCreate, InstallmentCreate, InstallmentUpdate, TransactionCreate,
)

class ScholarshipInput(BaseModel):
    amount: float
    reason: Optional[str] = None

student_router = APIRouter()
admin_router = APIRouter()

BEARER_PREFIX = "Bearer "


def _get_student_id(token: str) -> str:
    payload = require_role(token, "student")
    res = supabase.table("students").select("id").eq("user_id", payload["sub"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Student not found")
    return res.data[0]["id"]


def _require_admin(token: str):
    return require_role(token, "admin")


def _installment_dates(academic_year: str, count: int) -> list:
    """Due dates for master's schedule: Nov → June."""
    try:
        start_year = int(academic_year.split("-")[0])
    except (ValueError, IndexError):
        start_year = datetime.date.today().year
    end_year = start_year + 1

    if count == 2:
        return [
            datetime.date(start_year, 11, 1).isoformat(),
            datetime.date(end_year, 3, 1).isoformat(),
        ]
    elif count == 4:
        return [
            datetime.date(start_year, 11, 1).isoformat(),
            datetime.date(end_year, 1, 1).isoformat(),
            datetime.date(end_year, 3, 1).isoformat(),
            datetime.date(end_year, 5, 1).isoformat(),
        ]
    else:
        # generic: spread evenly Nov–May
        base_months = [11, 1, 3, 5, 7, 9]
        dates = []
        for i in range(count):
            m = base_months[i % len(base_months)]
            y = start_year if m >= 11 else end_year
            dates.append(datetime.date(y, m, 1).isoformat())
        return dates


def _compute_status(agreed: float, paid: float) -> str:
    if paid >= agreed:
        return "settled"
    if paid > 0:
        return "partial"
    return "pending"


# ── Student ────────────────────────────────────────────────────────────────────

@student_router.get("")
def get_my_finance(authorization: Annotated[str, Header()]):
    token = authorization.replace(BEARER_PREFIX, "")
    student_id = _get_student_id(token)
    fees = supabase.table("student_fees").select("*").eq("student_id", student_id).execute().data
    if not fees:
        return {"fee": None, "installments": [], "transactions": []}
    fee = fees[0]
    installments = (
        supabase.table("installments")
        .select("*")
        .eq("student_fee_id", fee["id"])
        .order("due_date")
        .execute()
        .data
    )
    transactions = (
        supabase.table("fee_transactions")
        .select("*")
        .eq("student_fee_id", fee["id"])
        .order("issue_date")
        .execute()
        .data
    )
    return {"fee": fee, "installments": installments, "transactions": transactions}


# ── Admin: major fees ──────────────────────────────────────────────────────────

@admin_router.get("/major-fees")
def list_major_fees(authorization: str = Header(...)):
    _require_admin(authorization.replace(BEARER_PREFIX, ""))
    return supabase.table("major_fees").select("*").order("major").execute().data


@admin_router.post("/major-fees")
def create_major_fee(data: MajorFeeCreate, authorization: str = Header(...)):
    _require_admin(authorization.replace(BEARER_PREFIX, ""))
    res = supabase.table("major_fees").insert({
        "major": data.major,
        "annual_fee": data.annual_fee,
        "academic_year": data.academic_year,
        "installment_count": data.installment_count,
    }).execute()
    major_fee = res.data[0]

    due_dates = _installment_dates(data.academic_year, data.installment_count)
    amount_per = round(data.annual_fee / data.installment_count, 2)

    students = (
        supabase.table("students")
        .select("id, major")
        .eq("major", data.major)
        .execute()
        .data
    )
    assigned = 0
    for s in students:
        existing = (
            supabase.table("student_fees")
            .select("id")
            .eq("student_id", s["id"])
            .eq("academic_year", data.academic_year)
            .execute()
            .data
        )
        if not existing:
            sf = supabase.table("student_fees").insert({
                "student_id": s["id"],
                "major": data.major,
                "academic_year": data.academic_year,
                "agreed_amount": data.annual_fee,
                "paid_amount": 0,
                "status": "pending",
            }).execute().data[0]
            for i, due in enumerate(due_dates):
                ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th"]
                supabase.table("installments").insert({
                    "student_fee_id": sf["id"],
                    "description": f"{ordinals[i]} Installment",
                    "amount": amount_per,
                    "due_date": due,
                    "paid": False,
                }).execute()
            assigned += 1

    return {**major_fee, "auto_assigned": assigned}


@admin_router.put("/major-fees/{fee_id}")
def update_major_fee(fee_id: str, data: MajorFeeUpdate, authorization: str = Header(...)):
    _require_admin(authorization.replace(BEARER_PREFIX, ""))
    fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="Nothing to update")
    # fetch current record before update (need major + old fee for student sync)
    current = supabase.table("major_fees").select("*").eq("id", fee_id).execute().data
    supabase.table("major_fees").update(fields).eq("id", fee_id).execute()

    # if annual_fee changed, update student_fees that have no payments yet
    if current and data.annual_fee is not None:
        mf = current[0]
        year = data.academic_year or mf["academic_year"]
        unpaid_fees = (
            supabase.table("student_fees")
            .select("id")
            .eq("major", mf["major"])
            .eq("academic_year", year)
            .eq("paid_amount", 0)
            .execute()
            .data
        )
        for sf in unpaid_fees:
            supabase.table("student_fees").update({
                "agreed_amount": data.annual_fee,
            }).eq("id", sf["id"]).execute()

    return {"message": "Updated"}


@admin_router.delete("/major-fees/{fee_id}")
def delete_major_fee(fee_id: str, authorization: str = Header(...)):
    _require_admin(authorization.replace(BEARER_PREFIX, ""))
    supabase.table("major_fees").delete().eq("id", fee_id).execute()
    return {"message": "Deleted"}


# ── Admin: student fees ────────────────────────────────────────────────────────

@admin_router.get("/students")
def list_student_fees(authorization: str = Header(...)):
    _require_admin(authorization.replace(BEARER_PREFIX, ""))
    students = supabase.table("students").select("id, major, users(name, email)").execute().data
    result = []
    for s in students:
        fee_rec = supabase.table("student_fees").select("*").eq("student_id", s["id"]).execute().data
        result.append({
            "student_id": s["id"],
            "name": (s.get("users") or {}).get("name", ""),
            "email": (s.get("users") or {}).get("email", ""),
            "major": s.get("major", ""),
            "fee": fee_rec[0] if fee_rec else None,
        })
    return result


@admin_router.post("/student-fees")
def assign_student_fee(data: StudentFeeCreate, authorization: str = Header(...)):
    _require_admin(authorization.replace(BEARER_PREFIX, ""))
    existing = (
        supabase.table("student_fees")
        .select("id")
        .eq("student_id", data.student_id)
        .eq("academic_year", data.academic_year)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="Fee already assigned for this year")
    student = supabase.table("students").select("major").eq("id", data.student_id).execute().data
    major = student[0]["major"] if student else ""
    res = supabase.table("student_fees").insert({
        "student_id": data.student_id,
        "major": major,
        "academic_year": data.academic_year,
        "agreed_amount": data.agreed_amount,
        "paid_amount": 0,
        "status": "pending",
    }).execute()
    return res.data[0]


@admin_router.get("/student-fees/{student_fee_id}")
def get_student_fee_detail(student_fee_id: str, authorization: str = Header(...)):
    _require_admin(authorization.replace(BEARER_PREFIX, ""))
    fee = (
        supabase.table("student_fees")
        .select("*, students(major, users(name, email))")
        .eq("id", student_fee_id)
        .execute()
        .data
    )
    if not fee:
        raise HTTPException(status_code=404, detail="Fee record not found")
    installments = (
        supabase.table("installments")
        .select("*")
        .eq("student_fee_id", student_fee_id)
        .order("due_date")
        .execute()
        .data
    )
    transactions = (
        supabase.table("fee_transactions")
        .select("*")
        .eq("student_fee_id", student_fee_id)
        .order("issue_date")
        .execute()
        .data
    )
    return {"fee": fee[0], "installments": installments, "transactions": transactions}


@admin_router.put("/student-fees/{student_fee_id}")
def update_student_fee(student_fee_id: str, data: StudentFeeCreate, authorization: str = Header(...)):
    """Update the base agreed_amount on a student fee and recalculate unpaid installments."""
    _require_admin(authorization.replace(BEARER_PREFIX, ""))
    sf = supabase.table("student_fees").select("*").eq("id", student_fee_id).execute().data
    if not sf:
        raise HTTPException(status_code=404, detail="Fee record not found")
    sf = sf[0]
    new_amount = round(float(data.agreed_amount), 2)
    if new_amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    scholarship = float(sf.get("scholarship_amount") or 0)
    net = round(new_amount - scholarship, 2)
    if net <= 0:
        raise HTTPException(status_code=400, detail="Net fee after scholarship must be positive")
    supabase.table("student_fees").update({
        "agreed_amount": net,
    }).eq("id", student_fee_id).execute()
    # recalculate unpaid installments proportionally
    paid_total = float(sf["paid_amount"])
    installments = supabase.table("installments").select("*").eq("student_fee_id", student_fee_id).order("due_date").execute().data
    unpaid = [i for i in installments if not i["paid"]]
    if unpaid:
        remaining = max(0.0, net - paid_total)
        per = round(remaining / len(unpaid), 2)
        for inst in unpaid:
            supabase.table("installments").update({"amount": per}).eq("id", inst["id"]).execute()
    return {"agreed_amount": net, "scholarship_amount": scholarship}


@admin_router.post("/student-fees/{student_fee_id}/generate-installments")
def generate_installments(student_fee_id: str, authorization: str = Header(...)):
    _require_admin(authorization.replace(BEARER_PREFIX, ""))
    sf = supabase.table("student_fees").select("*").eq("id", student_fee_id).execute().data
    if not sf:
        raise HTTPException(status_code=404, detail="Fee record not found")
    sf = sf[0]
    existing = supabase.table("installments").select("id").eq("student_fee_id", student_fee_id).execute().data
    if existing:
        raise HTTPException(status_code=400, detail="Installments already exist")
    mf = supabase.table("major_fees").select("*").eq("major", sf["major"]).eq("academic_year", sf["academic_year"]).execute().data
    count = mf[0]["installment_count"] if mf else 2
    due_dates = _installment_dates(sf["academic_year"], count)
    amount_per = round(float(sf["agreed_amount"]) / count, 2)
    ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th"]
    created = []
    for i, due in enumerate(due_dates):
        row = supabase.table("installments").insert({
            "student_fee_id": student_fee_id,
            "description": f"{ordinals[i]} Installment",
            "amount": amount_per,
            "due_date": due,
            "paid": False,
        }).execute().data[0]
        created.append(row)
    return created


@admin_router.post("/student-fees/{student_fee_id}/installments")
def add_installment(student_fee_id: str, data: InstallmentCreate, authorization: str = Header(...)):
    _require_admin(authorization.replace(BEARER_PREFIX, ""))
    res = supabase.table("installments").insert({
        "student_fee_id": student_fee_id,
        "description": data.description,
        "amount": data.amount,
        "due_date": data.due_date,
        "paid": False,
    }).execute()
    return res.data[0]


@admin_router.put("/installments/{installment_id}")
def update_installment(installment_id: str, data: InstallmentUpdate, authorization: str = Header(...)):
    _require_admin(authorization.replace(BEARER_PREFIX, ""))
    supabase.table("installments").update({"paid": data.paid}).eq("id", installment_id).execute()
    return {"message": "Updated"}


@admin_router.delete("/installments/{installment_id}")
def delete_installment(installment_id: str, authorization: str = Header(...)):
    _require_admin(authorization.replace(BEARER_PREFIX, ""))
    supabase.table("installments").delete().eq("id", installment_id).execute()
    return {"message": "Deleted"}


@admin_router.post("/student-fees/{student_fee_id}/scholarship")
def apply_scholarship(student_fee_id: str, data: ScholarshipInput, authorization: str = Header(...)):
    _require_admin(authorization.replace(BEARER_PREFIX, ""))
    sf = supabase.table("student_fees").select("*").eq("id", student_fee_id).execute().data
    if not sf:
        raise HTTPException(status_code=404, detail="Fee record not found")
    sf = sf[0]
    original_fee = float(sf["agreed_amount"]) + float(sf.get("scholarship_amount") or 0)
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Scholarship must be greater than 0.")
    if data.amount >= original_fee:
        raise HTTPException(status_code=400, detail=f"Scholarship ({data.amount}) cannot equal or exceed total fee ({original_fee}).")
    new_agreed = round(original_fee - data.amount, 2)
    supabase.table("student_fees").update({
        "scholarship_amount": data.amount,
        "scholarship_reason": data.reason,
        "agreed_amount": new_agreed,
    }).eq("id", student_fee_id).execute()
    # recalculate unpaid installments
    paid_total = float(sf["paid_amount"])
    installments = supabase.table("installments").select("*").eq("student_fee_id", student_fee_id).order("due_date").execute().data
    unpaid = [i for i in installments if not i["paid"]]
    if unpaid:
        remaining = max(0.0, new_agreed - paid_total)
        per = round(remaining / len(unpaid), 2)
        for inst in unpaid:
            supabase.table("installments").update({"amount": per}).eq("id", inst["id"]).execute()
    return {"agreed_amount": new_agreed, "scholarship_amount": data.amount}


@admin_router.delete("/student-fees/{student_fee_id}/scholarship")
def remove_scholarship(student_fee_id: str, authorization: str = Header(...)):
    _require_admin(authorization.replace(BEARER_PREFIX, ""))
    sf = supabase.table("student_fees").select("*").eq("id", student_fee_id).execute().data
    if not sf:
        raise HTTPException(status_code=404, detail="Fee record not found")
    sf = sf[0]
    original_fee = round(float(sf["agreed_amount"]) + float(sf.get("scholarship_amount") or 0), 2)
    paid_total = float(sf["paid_amount"])
    supabase.table("student_fees").update({
        "scholarship_amount": 0,
        "scholarship_reason": None,
        "agreed_amount": original_fee,
    }).eq("id", student_fee_id).execute()
    installments = supabase.table("installments").select("*").eq("student_fee_id", student_fee_id).order("due_date").execute().data
    unpaid = [i for i in installments if not i["paid"]]
    if unpaid:
        remaining = max(0.0, original_fee - paid_total)
        per = round(remaining / len(unpaid), 2)
        for inst in unpaid:
            supabase.table("installments").update({"amount": per}).eq("id", inst["id"]).execute()
    return {"agreed_amount": original_fee, "scholarship_amount": 0}


@admin_router.post("/student-fees/{student_fee_id}/transactions")
def add_transaction(student_fee_id: str, data: TransactionCreate, authorization: str = Header(...)):
    _require_admin(authorization.replace(BEARER_PREFIX, ""))
    fee = (
        supabase.table("student_fees")
        .select("agreed_amount, paid_amount")
        .eq("id", student_fee_id)
        .execute()
        .data
    )
    if not fee:
        raise HTTPException(status_code=404, detail="Fee record not found")
    new_paid = float(fee[0]["paid_amount"]) + float(data.amount)
    agreed = float(fee[0]["agreed_amount"])
    res = supabase.table("fee_transactions").insert({
        "student_fee_id": student_fee_id,
        "issue_date": data.issue_date or datetime.date.today().isoformat(),
        "doc_type": data.doc_type,
        "doc_no": data.doc_no,
        "explanation": data.explanation,
        "amount": data.amount,
    }).execute()
    supabase.table("student_fees").update({
        "paid_amount": new_paid,
        "status": _compute_status(agreed, new_paid),
    }).eq("id", student_fee_id).execute()

    # auto-mark installments paid in chronological order up to paid_amount
    installments = (
        supabase.table("installments")
        .select("*")
        .eq("student_fee_id", student_fee_id)
        .order("due_date")
        .execute()
        .data
    )
    cumulative = 0.0
    for inst in installments:
        cumulative += float(inst["amount"])
        should_be_paid = cumulative <= new_paid + 0.001
        if inst["paid"] != should_be_paid:
            supabase.table("installments").update({"paid": should_be_paid}).eq("id", inst["id"]).execute()

    return res.data[0]


@admin_router.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: str, authorization: str = Header(...)):
    _require_admin(authorization.replace(BEARER_PREFIX, ""))
    tx = supabase.table("fee_transactions").select("*").eq("id", transaction_id).execute().data
    if tx:
        fee = (
            supabase.table("student_fees")
            .select("agreed_amount, paid_amount")
            .eq("id", tx[0]["student_fee_id"])
            .execute()
            .data
        )
        if fee:
            new_paid = max(0.0, float(fee[0]["paid_amount"]) - float(tx[0]["amount"]))
            supabase.table("student_fees").update({
                "paid_amount": new_paid,
                "status": _compute_status(float(fee[0]["agreed_amount"]), new_paid),
            }).eq("id", tx[0]["student_fee_id"]).execute()
            installments = (
                supabase.table("installments")
                .select("*")
                .eq("student_fee_id", tx[0]["student_fee_id"])
                .order("due_date")
                .execute()
                .data
            )
            cumulative = 0.0
            for inst in installments:
                cumulative += float(inst["amount"])
                should_be_paid = cumulative <= new_paid + 0.001
                if inst["paid"] != should_be_paid:
                    supabase.table("installments").update({"paid": should_be_paid}).eq("id", inst["id"]).execute()
    supabase.table("fee_transactions").delete().eq("id", transaction_id).execute()
    return {"message": "Deleted"}
