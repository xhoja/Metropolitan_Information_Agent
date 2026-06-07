from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Form, Body
from pydantic import BaseModel
from typing import Optional, List
import json
from db import supabase
from routers.auth import require_role
from datetime import datetime as dt
import uuid

router = APIRouter()

class CourseCreate(BaseModel):
    code: str
    title: str
    credits: int
    department: Optional[str] = None
    description: Optional[str] = None

class GradeComponentCreate(BaseModel):
    name: str
    weight: float

class GradeInput(BaseModel):
    student_id: str
    course_id: str
    value: float
    component_id: str

def get_current_semester() -> str:
    month = dt.utcnow().month
    year = dt.utcnow().year
    return f"Spring {year}" if month <= 6 else f"Autumn {year}"

class AttendanceBulkItem(BaseModel):
    student_id: str
    hours_present: float

class AttendanceBulkInput(BaseModel):
    course_id: str
    week_number: int
    date: str
    session_start: str  # "HH:MM"
    session_end: str    # "HH:MM"
    records: list[AttendanceBulkItem]

def _session_duration(start: str, end: str) -> float:
    try:
        s = dt.strptime(start[:5], "%H:%M")
        e = dt.strptime(end[:5], "%H:%M")
        return max(0.0, (e - s).seconds / 3600)
    except (ValueError, TypeError):
        return 0.0

class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    course_id: str
    type: str

def get_professor_id(token: str):
    payload = require_role(token, "professor")
    res = supabase.table("professors").select("id").eq("user_id", payload["sub"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Professor not found")
    return res.data[0]["id"]

@router.get("/courses")
def get_courses(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    prof_id = get_professor_id(token)
    res = supabase.table("courses").select("*").eq("professor_id", prof_id).execute()
    return res.data


@router.get("/courses/{course_id}/components")
def get_grade_components(course_id: str, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    get_professor_id(token)
    res = supabase.table("grade_components").select("*").eq("course_id", course_id).order("created_at").execute()
    return res.data

@router.post("/courses/{course_id}/components")
def add_grade_component(course_id: str, data: GradeComponentCreate, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    get_professor_id(token)
    if data.weight <= 0 or data.weight > 100:
        raise HTTPException(status_code=400, detail="Weight must be between 0 and 100.")
    existing = supabase.table("grade_components").select("weight").eq("course_id", course_id).execute()
    total = sum(c["weight"] for c in existing.data) + data.weight
    if total > 100:
        raise HTTPException(status_code=400, detail=f"Total weight would exceed 100% ({total:.1f}%).")
    res = supabase.table("grade_components").insert({
        "course_id": course_id,
        "name": data.name,
        "weight": data.weight,
    }).execute()
    return res.data[0]

@router.delete("/courses/{course_id}/components/{component_id}")
def delete_grade_component(course_id: str, component_id: str, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    get_professor_id(token)
    supabase.table("grade_components").delete().eq("id", component_id).eq("course_id", course_id).execute()
    return {"ok": True}

@router.post("/grades")
def add_grade(data: GradeInput, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    get_professor_id(token)
    if not (0 <= data.value <= 100):
        raise HTTPException(status_code=400, detail="Points must be between 0 and 100.")
    comp = supabase.table("grade_components").select("name, weight, course_id").eq("id", data.component_id).execute()
    if not comp.data:
        raise HTTPException(status_code=404, detail="Grade component not found.")
    component = comp.data[0]
    if component["course_id"] != data.course_id:
        raise HTTPException(status_code=400, detail="Component does not belong to the selected course.")
    res = supabase.table("grades").insert({
        "student_id": data.student_id,
        "course_id": data.course_id,
        "value": data.value,
        "semester": get_current_semester(),
        "grade_type": component["name"],
        "weight": component["weight"],
    }).execute()
    return res.data[0]

class GradeUpdate(BaseModel):
    value: float
    component_id: str

@router.put("/grades/{grade_id}")
def update_grade(grade_id: str, data: GradeUpdate, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    get_professor_id(token)
    if not (0 <= data.value <= 100):
        raise HTTPException(status_code=400, detail="Points must be between 0 and 100.")
    existing = supabase.table("grades").select("id").eq("id", grade_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Grade not found.")
    comp = supabase.table("grade_components").select("name, weight").eq("id", data.component_id).execute()
    if not comp.data:
        raise HTTPException(status_code=404, detail="Grade component not found.")
    component = comp.data[0]
    res = supabase.table("grades").update({
        "value": data.value,
        "grade_type": component["name"],
        "weight": component["weight"],
    }).eq("id", grade_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Grade not found.")
    return res.data[0]

@router.delete("/grades/{grade_id}")
def delete_grade(grade_id: str, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    get_professor_id(token)
    existing = supabase.table("grades").select("id").eq("id", grade_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Grade not found.")
    supabase.table("grades").delete().eq("id", grade_id).execute()
    return {"ok": True}

@router.get("/grades/{course_id}")
def get_grades(course_id: str, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    get_professor_id(token)
    res = supabase.table("grades").select("id, student_id, value, semester, grade_type, weight, students(users(name, email))").eq("course_id", course_id).execute()
    result = []
    for g in res.data:
        try:
            student = g.get("students") or {}
            user = student.get("users") or {}
            result.append({
                "id": g["id"],
                "student_id": g["student_id"],
                "student_name": user.get("name", "—"),
                "student_email": user.get("email", "—"),
                "value": g["value"],
                "semester": g["semester"],
                "grade_type": g["grade_type"],
                "weight": g["weight"],
            })
        except (KeyError, TypeError):
            result.append(g)
    return result

@router.get("/attendance/{course_id}")
def get_attendance(course_id: str, authorization: str = Header(...)):
    res = supabase.table("attendance").select(
        "id, student_id, date, status, session_start, session_end, hours_present, week_number, students(users(name, email))"
    ).eq("course_id", course_id).order("week_number", desc=False).execute()
    result = []
    for r in res.data:
        try:
            student = r.get("students") or {}
            user = student.get("users") or {}
            result.append({
                "id": r["id"],
                "student_id": r["student_id"],
                "student_name": user.get("name", "—"),
                "student_email": user.get("email", "—"),
                "date": r["date"],
                "status": r["status"],
                "session_start": (r.get("session_start") or "")[:5],
                "session_end": (r.get("session_end") or "")[:5],
                "hours_present": r.get("hours_present") or 0,
                "week_number": r.get("week_number"),
            })
        except (KeyError, TypeError):
            result.append(r)
    return result

@router.post("/attendance/bulk")
def mark_attendance_bulk(data: AttendanceBulkInput, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    get_professor_id(token)
    existing = supabase.table("attendance").select("id").eq("course_id", data.course_id).eq("week_number", data.week_number).limit(1).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail=f"Week {data.week_number} already recorded. Clear it first.")
    duration = _session_duration(data.session_start, data.session_end)
    rows = []
    for r in data.records:
        hp = max(0.0, min(float(r.hours_present), duration))
        status = "present" if hp >= duration else ("absent" if hp == 0 else "late")
        rows.append({
            "student_id": r.student_id,
            "course_id": data.course_id,
            "week_number": data.week_number,
            "date": data.date,
            "session_start": data.session_start,
            "session_end": data.session_end,
            "hours_present": hp,
            "status": status,
        })
    res = supabase.table("attendance").insert(rows).execute()
    return res.data

@router.delete("/attendance/{course_id}/week/{week_number}")
def delete_attendance_week(course_id: str, week_number: int, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    get_professor_id(token)
    supabase.table("attendance").delete().eq("course_id", course_id).eq("week_number", week_number).execute()
    return {"detail": f"Week {week_number} attendance cleared."}

@router.post("/assignments")
async def create_assignment(
    title: str = Form(...),
    course_id: str = Form(...),
    type: str = Form(...),
    description: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
    authorization: str = Header(...),
):
    file_urls = []
    file_names = []
    for file in files:
        if file and file.filename:
            file_bytes = await file.read()
            stored_name = f"{uuid.uuid4()}_{file.filename}"
            supabase.storage.from_("materials").upload(stored_name, file_bytes, {"content-type": file.content_type})
            file_urls.append(supabase.storage.from_("materials").get_public_url(stored_name))
            file_names.append(file.filename)
    res = supabase.table("assignments").insert({
        "title": title,
        "description": description,
        "due_date": due_date,
        "course_id": course_id,
        "type": type,
        "file_url": json.dumps(file_urls) if file_urls else None,
        "file_name": json.dumps(file_names) if file_names else None,
    }).execute()
    return res.data[0]

@router.get("/assignments/{course_id}")
def get_assignments(course_id: str, authorization: str = Header(...)):
    res = supabase.table("assignments").select("*").eq("course_id", course_id).execute()
    return res.data

@router.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: str, authorization: str = Header(...)):
    supabase.table("assignments").delete().eq("id", assignment_id).execute()
    return {"ok": True}

@router.get("/assignments/{assignment_id}/submissions")
def get_assignment_submissions(assignment_id: str, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    get_professor_id(token)
    assignment = supabase.table("assignments").select("course_id, title, type").eq("id", assignment_id).execute().data
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    course_id = assignment[0]["course_id"]
    components = supabase.table("grade_components").select("id, name, weight").eq("course_id", course_id).order("created_at").execute().data
    enrollments = supabase.table("enrollments").select("students(id, users(name, email))").eq("course_id", course_id).execute().data
    submissions = supabase.table("submissions").select("id, student_id, submitted_at, file_url, grade").eq("assignment_id", assignment_id).execute().data
    submitted_map = {s["student_id"]: s for s in submissions}
    result = []
    for e in enrollments:
        student = (e.get("students") or {})
        student_id = student.get("id")
        user = student.get("users") or {}
        sub = submitted_map.get(student_id)
        result.append({
            "student_id": student_id,
            "name": user.get("name", "Unknown"),
            "email": user.get("email", ""),
            "submitted": sub is not None,
            "submission_id": sub["id"] if sub else None,
            "submitted_at": sub["submitted_at"] if sub else None,
            "file_url": sub["file_url"] if sub else None,
            "grade": sub["grade"] if sub else None,
        })
    # Cross-reference grades table so grade shows even if recorded via Grades tab
    assignment_type = (assignment[0].get("type") or "").lower()
    matched_comp = next((c for c in components if assignment_type in c["name"].lower() or c["name"].lower() in assignment_type), None)
    if matched_comp:
        grades_res = supabase.table("grades").select("student_id, value").eq("course_id", course_id).eq("grade_type", matched_comp["name"]).execute().data
        grade_map = {g["student_id"]: g["value"] for g in grades_res}
        for r in result:
            if r["grade"] is None:
                r["grade"] = grade_map.get(r["student_id"])

    result.sort(key=lambda x: (not x["submitted"], x["name"]))
    return {
        "assignment_title": assignment[0]["title"],
        "assignment_type": assignment[0].get("type", ""),
        "course_id": course_id,
        "components": components,
        "submissions": result,
    }

class GradeSubmissionBody(BaseModel):
    grade: float
    component_id: Optional[str] = None

@router.put("/submissions/{submission_id}/grade")
def grade_submission(submission_id: str, data: GradeSubmissionBody, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    get_professor_id(token)
    if not (0 <= data.grade <= 100):
        raise HTTPException(status_code=400, detail="Points must be between 0 and 100.")
    sub = supabase.table("submissions").select("student_id, assignment_id").eq("id", submission_id).execute().data
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")
    supabase.table("submissions").update({"grade": data.grade}).eq("id", submission_id).execute()
    student_id = sub[0]["student_id"]
    assignment_id = sub[0]["assignment_id"]
    assignment = supabase.table("assignments").select("course_id, type").eq("id", assignment_id).execute().data
    if not assignment:
        return {"ok": True}
    course_id = assignment[0]["course_id"]
    from datetime import date
    m = date.today().month
    y = date.today().year
    semester = f"Spring {y}" if m <= 6 else f"Autumn {y}"
    # Use explicit component_id if provided, otherwise try to match by type
    matched = None
    if data.component_id:
        comp = supabase.table("grade_components").select("id, name, weight").eq("id", data.component_id).execute().data
        if comp:
            matched = comp[0]
    else:
        assignment_type = (assignment[0].get("type") or "").lower()
        components = supabase.table("grade_components").select("id, name, weight").eq("course_id", course_id).execute().data
        matched = next((c for c in components if assignment_type in c["name"].lower() or c["name"].lower() in assignment_type), None)
    if matched:
        existing = supabase.table("grades").select("id").eq("student_id", student_id).eq("course_id", course_id).eq("grade_type", matched["name"]).execute().data
        if existing:
            supabase.table("grades").update({"value": data.grade}).eq("id", existing[0]["id"]).execute()
        else:
            supabase.table("grades").insert({"student_id": student_id, "course_id": course_id, "value": data.grade, "semester": semester, "grade_type": matched["name"], "weight": matched["weight"]}).execute()
    return {"ok": True}

@router.get("/courses/{course_id}/students")
def get_course_students(course_id: str, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    get_professor_id(token)
    enrollments = supabase.table("enrollments").select("id, created_at, students(id, user_id, users(id, name, email))").eq("course_id", course_id).execute().data
    result = []
    for e in enrollments:
        try:
            result.append({
                "id": e["students"]["users"]["id"],
                "student_id": e["students"]["id"],
                "name": e["students"]["users"]["name"],
                "email": e["students"]["users"]["email"],
                "enrolled_at": e.get("created_at")
            })
        except (KeyError, TypeError):
            continue
    return result

@router.get("/courses/{course_id}/materials")
def get_materials(course_id: str, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    get_professor_id(token)
    res = supabase.table("materials").select("id, title, file_url, file_name").eq("course_id", course_id).execute()
    return res.data

@router.post("/courses/{course_id}/materials")
async def upload_material(
    course_id: str,
    title: str = Form(...),
    files: List[UploadFile] = File(...),
    authorization: str = Header(...)
):
    token = authorization.replace("Bearer ", "")
    get_professor_id(token)
    inserted = []
    for i, file in enumerate(files):
        if not file.filename:
            continue
        file_bytes = await file.read()
        stored_name = f"{uuid.uuid4()}_{file.filename}"
        supabase.storage.from_("materials").upload(stored_name, file_bytes, {"content-type": file.content_type})
        file_url = supabase.storage.from_("materials").get_public_url(stored_name)
        file_title = title if len(files) == 1 else (f"{title} ({i + 1})" if title else file.filename)
        res = supabase.table("materials").insert({
            "course_id": course_id,
            "title": file_title,
            "file_url": file_url,
            "file_name": file.filename
        }).execute()
        inserted.append(res.data[0])
    return inserted