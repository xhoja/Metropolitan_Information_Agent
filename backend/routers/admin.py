from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from models import UserCreate, UserUpdate
from db import supabase
from routers.auth import hash_password, require_role
import datetime

router = APIRouter()

class EnrollmentCreate(BaseModel):
    student_id: str
    course_id: str
    semester: str

class CourseCreate(BaseModel):
    code: str
    title: str
    credits: int
    department: Optional[str] = None
    description: Optional[str] = None
    professor_id: Optional[str] = None

def require_admin(token: str):
    return require_role(token, "admin")

@router.post("/users")
def create_user(data: UserCreate, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    require_admin(token)
    existing = supabase.table("users").select("id").eq("email", data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already exists")
    hashed = hash_password(data.password)
    user_res = supabase.table("users").insert({
        "name": data.name,
        "email": data.email,
        "password_hash": hashed,
        "role": data.role
    }).execute()
    user = user_res.data[0]
    if data.role == "student":
        student_res = supabase.table("students").insert({
            "user_id": user["id"],
            "major": data.major,
            "enrolled_year": datetime.datetime.now().year
        }).execute()
        # Auto-assign major fee if one exists for this major + current academic year
        if data.major and student_res.data:
            student_id = student_res.data[0]["id"]
            now = datetime.datetime.now()
            acad_year = f"{now.year - 1}-{now.year}" if now.month < 9 else f"{now.year}-{now.year + 1}"
            mf_rows = supabase.table("major_fees").select("*").eq("major", data.major).eq("academic_year", acad_year).execute().data
            if mf_rows:
                mf = mf_rows[0]
                sf = supabase.table("student_fees").insert({
                    "student_id": student_id,
                    "major": data.major,
                    "academic_year": acad_year,
                    "agreed_amount": mf["annual_fee"],
                    "paid_amount": 0,
                    "status": "pending",
                }).execute().data[0]
                count = mf["installment_count"] or 2
                # installment due dates: Nov→Mar (2) or Nov,Jan,Mar,May (4)
                start = int(acad_year.split("-")[0])
                end = start + 1
                if count == 2:
                    due_dates = [
                        datetime.date(start, 11, 1).isoformat(),
                        datetime.date(end, 3, 1).isoformat(),
                    ]
                elif count == 4:
                    due_dates = [
                        datetime.date(start, 11, 1).isoformat(),
                        datetime.date(end, 1, 1).isoformat(),
                        datetime.date(end, 3, 1).isoformat(),
                        datetime.date(end, 5, 1).isoformat(),
                    ]
                else:
                    base = [11, 1, 3, 5, 7, 9]
                    due_dates = [
                        datetime.date(start if base[i % len(base)] >= 11 else end, base[i % len(base)], 1).isoformat()
                        for i in range(count)
                    ]
                ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th"]
                amount_per = round(float(mf["annual_fee"]) / count, 2)
                for i, due in enumerate(due_dates):
                    supabase.table("installments").insert({
                        "student_fee_id": sf["id"],
                        "description": f"{ordinals[i]} Installment",
                        "amount": amount_per,
                        "due_date": due,
                        "paid": False,
                    }).execute()
    elif data.role == "professor":
        supabase.table("professors").insert({
            "user_id": user["id"],
            "department": data.department,
            "title": data.title
        }).execute()
    return {"message": "User created", "id": user["id"]}

@router.get("/users")
def get_all_users(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    require_admin(token)
    users = supabase.table("users").select("id, name, email, role, created_at").execute().data
    students = {r["user_id"]: r for r in supabase.table("students").select("user_id, major").execute().data}
    professors = {r["user_id"]: r for r in supabase.table("professors").select("user_id, department, title").execute().data}
    for u in users:
        if u["role"] == "student" and u["id"] in students:
            u["major"] = students[u["id"]].get("major", "")
        elif u["role"] == "professor" and u["id"] in professors:
            u["department"] = professors[u["id"]].get("department", "")
            u["title"] = professors[u["id"]].get("title", "")
    return users

@router.get("/professors")
def get_professors(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    require_admin(token)
    rows = supabase.table("professors").select("id, user_id, users(name, email)").execute().data
    return [{"id": r["id"], "name": r["users"]["name"], "email": r["users"]["email"]} for r in rows if r.get("users")]

@router.put("/users/{user_id}")
def update_user(user_id: str, data: UserUpdate, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    require_admin(token)
    update_fields = {}
    if data.name is not None:
        update_fields["name"] = data.name
    if data.email is not None:
        update_fields["email"] = data.email
    if data.role is not None:
        update_fields["role"] = data.role
    if data.password:
        update_fields["password_hash"] = hash_password(data.password)
    if update_fields:
        supabase.table("users").update(update_fields).eq("id", user_id).execute()
    if data.major is not None and data.major != "":
        supabase.table("students").update({"major": data.major}).eq("user_id", user_id).execute()
    if data.department is not None and data.department != "":
        supabase.table("professors").update({"department": data.department}).eq("user_id", user_id).execute()
    if data.title is not None and data.title != "":
        supabase.table("professors").update({"title": data.title}).eq("user_id", user_id).execute()
    return {"message": "User updated"}

@router.delete("/users/{user_id}")
def delete_user(user_id: str, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    require_admin(token)
    supabase.table("users").delete().eq("id", user_id).execute()
    return {"message": "User deleted"}

@router.get("/students")
def get_all_students(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    require_admin(token)
    rows = supabase.table("students").select("id, user_id, users(name, email)").execute().data
    result = []
    for s in rows:
        result.append({
            "id": s["id"],
            "name": s["users"]["name"] if s.get("users") else "",
            "email": s["users"]["email"] if s.get("users") else "",
        })
    return result

@router.get("/courses")
def get_all_courses(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    require_admin(token)
    courses = supabase.table("courses").select("id, code, title, department, credits, professor_id, professors(user_id, users(name))").execute().data
    result = []
    for c in courses:
        enrollment_count = len(supabase.table("enrollments").select("id").eq("course_id", c["id"]).execute().data)
        professor_name = ""
        try:
            professor_name = c["professors"]["users"]["name"]
        except (KeyError, TypeError):
            professor_name = ""
        result.append({
            "id": c["id"],
            "code": c["code"],
            "title": c["title"],
            "department": c["department"],
            "credits": c["credits"],
            "professor_name": professor_name,
            "enrollment_count": enrollment_count
        })
    return result

@router.post("/courses")
def create_course(data: CourseCreate, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    require_admin(token)
    res = supabase.table("courses").insert({
        "code": data.code,
        "title": data.title,
        "credits": data.credits,
        "department": data.department,
        "description": data.description,
        "professor_id": data.professor_id,
    }).execute()
    return res.data[0]

@router.post("/enrollments")
def create_enrollment(data: EnrollmentCreate, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    require_admin(token)
    existing = supabase.table("enrollments").select("id").eq("student_id", data.student_id).eq("course_id", data.course_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Student already enrolled in this course")
    res = supabase.table("enrollments").insert({
        "student_id": data.student_id,
        "course_id": data.course_id,
        "semester": data.semester
    }).execute()
    return res.data[0]

@router.get("/enrollments")
def get_all_enrollments(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    require_admin(token)
    enrollments = supabase.table("enrollments").select("id, created_at, students(user_id, users(name)), courses(title, code)").execute().data
    result = []
    for e in enrollments:
        try:
            student_name = e["students"]["users"]["name"]
        except (KeyError, TypeError):
            student_name = ""
        try:
            course_title = e["courses"]["title"]
            course_code = e["courses"]["code"]
        except (KeyError, TypeError):
            course_title = ""
            course_code = ""
        result.append({
            "id": e["id"],
            "student_name": student_name,
            "course_title": course_title,
            "course_code": course_code,
            "created_at": e.get("created_at")
        })
    return result

@router.delete("/enrollments/{enrollment_id}")
def delete_enrollment(enrollment_id: str, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    require_admin(token)
    supabase.table("enrollments").delete().eq("id", enrollment_id).execute()
    return {"message": "Enrollment deleted"}

@router.get("/attendance")
def get_all_attendance(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    require_admin(token)
    records = supabase.table("attendance").select(
        "id, student_id, course_id, date, status, week_number, hours_present, students(users(name, email)), courses(title, code)"
    ).execute().data
    result = []
    for r in records:
        try:
            student_name = r["students"]["users"]["name"]
            student_email = r["students"]["users"]["email"]
        except (KeyError, TypeError):
            student_name = ""
            student_email = ""
        try:
            course_title = r["courses"]["title"]
            course_code = r["courses"]["code"]
        except (KeyError, TypeError):
            course_title = ""
            course_code = ""
        result.append({
            "id": r["id"],
            "student_id": r.get("student_id", ""),
            "course_id": r.get("course_id", ""),
            "student_name": student_name,
            "student_email": student_email,
            "course_title": course_title,
            "course_code": course_code,
            "date": r["date"],
            "status": r["status"],
            "week_number": r.get("week_number"),
            "hours_present": r.get("hours_present", 0),
        })
    return result

@router.get("/grades")
def get_all_grades(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    require_admin(token)
    grades = supabase.table("grades").select("id, value, semester, grade_type, weight, students(user_id, users(name)), courses(title)").execute().data
    result = []
    for g in grades:
        try:
            student_name = g["students"]["users"]["name"]
        except (KeyError, TypeError):
            student_name = ""
        try:
            course_title = g["courses"]["title"]
        except (KeyError, TypeError):
            course_title = ""
        result.append({
            "id": g["id"],
            "student_name": student_name,
            "course_title": course_title,
            "value": g["value"],
            "semester": g["semester"],
            "grade_type": g.get("grade_type") or "",
            "weight": g.get("weight")
        })
    return result