from typing import Annotated, List, Optional
from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Form
from db import supabase
from routers.auth import decode_token
from datetime import datetime, timezone
import uuid
import json

router = APIRouter()

NOT_FOUND_RESPONSE = {404: {"description": "Student not found"}}
BEARER_PREFIX = "Bearer "

def get_student_id(token: str):
    payload = decode_token(token)
    res = supabase.table("students").select("id").eq("user_id", payload["sub"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Student not found")
    return res.data[0]["id"]

@router.get("/courses", responses=NOT_FOUND_RESPONSE)
def get_my_courses(authorization: Annotated[str, Header()]):
    token = authorization.replace(BEARER_PREFIX, "")
    student_id = get_student_id(token)
    res = supabase.table("enrollments").select("*, courses(*, professors(users(name)))").eq("student_id", student_id).execute()
    return res.data

@router.get("/grades", responses=NOT_FOUND_RESPONSE)
def get_my_grades(authorization: Annotated[str, Header()]):
    token = authorization.replace(BEARER_PREFIX, "")
    student_id = get_student_id(token)
    res = supabase.table("grades").select("*, courses(title, code)").eq("student_id", student_id).execute()
    return res.data

@router.get("/attendance", responses=NOT_FOUND_RESPONSE)
def get_my_attendance(authorization: Annotated[str, Header()]):
    token = authorization.replace(BEARER_PREFIX, "")
    student_id = get_student_id(token)
    res = supabase.table("attendance").select("*, courses(title, code)").eq("student_id", student_id).execute()
    return res.data

@router.get("/transcript", responses=NOT_FOUND_RESPONSE)
def get_transcript(authorization: Annotated[str, Header()]):
    token = authorization.replace(BEARER_PREFIX, "")
    student_id = get_student_id(token)
    student = supabase.table("students").select("*, users(name, email)").eq("id", student_id).execute().data[0]
    grades = supabase.table("grades").select("*, courses(title, code, credits)").eq("student_id", student_id).execute().data
    return {"student": student, "grades": grades}

@router.get("/assignments", responses=NOT_FOUND_RESPONSE)
def get_my_assignments(authorization: Annotated[str, Header()]):
    token = authorization.replace(BEARER_PREFIX, "")
    student_id = get_student_id(token)
    enrollments = supabase.table("enrollments").select("course_id, courses(title, code)").eq("student_id", student_id).execute().data
    course_map = {e["course_id"]: (e.get("courses") or {}) for e in enrollments}
    course_ids = list(course_map.keys())
    now = datetime.now(timezone.utc)

    assignments = []
    for cid in course_ids:
        res = supabase.table("assignments").select("*").eq("course_id", cid).execute()
        components = supabase.table("grade_components").select("id, name, weight").eq("course_id", cid).execute().data
        for a in res.data:
            a["course_name"] = course_map.get(cid, {}).get("title", "")
            a["course_code"] = course_map.get(cid, {}).get("code", "")
            atype = (a.get("type") or "").lower()
            matched_comp = next((c for c in components if atype in c["name"].lower() or c["name"].lower() in atype), None)
            a["component_name"] = matched_comp["name"] if matched_comp else None
            a["component_weight"] = matched_comp["weight"] if matched_comp else None

            try:
                sub_res = supabase.table("submissions").select("id, submitted_at, file_url, grade").eq("student_id", student_id).eq("assignment_id", a["id"]).execute()
                a["submission"] = sub_res.data[0] if sub_res.data else None
            except Exception:
                a["submission"] = None

            # Also check grades table for a recorded grade (professor may have graded via Grades tab)
            try:
                if matched_comp:
                    grade_res = supabase.table("grades").select("value").eq("student_id", student_id).eq("course_id", cid).eq("grade_type", matched_comp["name"]).execute()
                    recorded = grade_res.data[0]["value"] if grade_res.data else None
                    if a["submission"] is not None:
                        if a["submission"].get("grade") is None and recorded is not None:
                            a["submission"]["grade"] = recorded
                    elif recorded is not None:
                        a["recorded_grade"] = recorded
                    else:
                        a["recorded_grade"] = None
                else:
                    a["recorded_grade"] = None
            except Exception:
                a["recorded_grade"] = None

            is_past_due = False
            if a.get("due_date"):
                try:
                    due = datetime.fromisoformat(a["due_date"].replace("Z", "+00:00"))
                    if due.tzinfo is None:
                        due = due.replace(tzinfo=timezone.utc)
                    is_past_due = due < now
                except (ValueError, TypeError):
                    pass
            a["is_past_due"] = is_past_due

            if is_past_due and a["submission"] is None:
                try:
                    _auto_grade_missed(student_id, cid, a)
                except Exception:
                    pass

        assignments.extend(res.data)
    return assignments

def _auto_grade_missed(student_id: str, course_id: str, assignment: dict):
    assignment_type = (assignment.get("type") or "").lower()
    components = supabase.table("grade_components").select("id, name, weight").eq("course_id", course_id).execute().data
    matched = next((c for c in components if assignment_type in c["name"].lower() or c["name"].lower() in assignment_type), None)
    if not matched:
        return
    existing_grade = supabase.table("grades").select("id").eq("student_id", student_id).eq("course_id", course_id).eq("grade_type", matched["name"]).execute()
    if existing_grade.data:
        return
    from datetime import date
    current_month = date.today().month
    current_year = date.today().year
    semester = f"Spring {current_year}" if current_month <= 6 else f"Autumn {current_year}"
    supabase.table("grades").insert({
        "student_id": student_id,
        "course_id": course_id,
        "value": 0,
        "semester": semester,
        "grade_type": matched["name"],
        "weight": matched["weight"],
    }).execute()

@router.get("/courses/{course_id}/materials", responses=NOT_FOUND_RESPONSE)
def get_course_materials(course_id: str, authorization: Annotated[str, Header()]):
    token = authorization.replace(BEARER_PREFIX, "")
    student_id = get_student_id(token)
    enrolled = supabase.table("enrollments").select("id").eq("student_id", student_id).eq("course_id", course_id).execute()
    if not enrolled.data:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    res = supabase.table("materials").select("id, title, file_url, file_name").eq("course_id", course_id).execute()
    return res.data

@router.post("/assignments/{assignment_id}/submit", responses=NOT_FOUND_RESPONSE)
def submit_assignment(
    assignment_id: str,
    authorization: Annotated[str, Header()],
    files: Optional[List[UploadFile]] = File(None),
):
    token = authorization.replace(BEARER_PREFIX, "")
    student_id = get_student_id(token)

    # Block submission if past due
    assignment = supabase.table("assignments").select("due_date").eq("id", assignment_id).execute()
    if assignment.data and assignment.data[0].get("due_date"):
        due = datetime.fromisoformat(assignment.data[0]["due_date"].replace("Z", "+00:00"))
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)
        if due < datetime.now(timezone.utc):
            raise HTTPException(status_code=403, detail="Assignment is past due. Submission not allowed.")

    file_urls = []
    if files:
        for upload in files:
            file_bytes = upload.file.read()
            path = f"{student_id}/{assignment_id}/{uuid.uuid4()}_{upload.filename}"
            supabase.storage.from_("submissions").upload(
                path, file_bytes, {"content-type": upload.content_type or "application/octet-stream"}
            )
            url = supabase.storage.from_("submissions").get_public_url(path)
            file_urls.append(url)

    submission_data = {
        "student_id": student_id,
        "assignment_id": assignment_id,
        "file_url": json.dumps(file_urls) if file_urls else None,
    }

    existing = supabase.table("submissions").select("id").eq("student_id", student_id).eq("assignment_id", assignment_id).execute()
    if existing.data:
        res = supabase.table("submissions").update(submission_data).eq("id", existing.data[0]["id"]).execute()
    else:
        res = supabase.table("submissions").insert(submission_data).execute()

    return res.data[0]
