from fastapi import APIRouter, HTTPException, Header
from schemas.mia import ChatRequest, ChatResponse, SessionRead, MessageRead
import os
from openai import OpenAI
from dotenv import load_dotenv
from db import supabase
from routers.auth import decode_token
from typing import Optional, Dict, Any, Annotated
from datetime import datetime

load_dotenv()

router = APIRouter()

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

# Temporary in-memory history for unauthenticated users
chat_history: list[dict] = []


def create_chat_session(student_id: str) -> str:
    res = supabase.table("chat_sessions").insert({"student_id": student_id}).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create chat session")
    return res.data[0]["id"]


def validate_chat_session(student_id: str, session_id: str) -> str:
    res = supabase.table("chat_sessions").select("id").eq("id", session_id).eq("student_id", student_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session_id


def save_chat_message(session_id: str, role: str, content: str) -> None:
    supabase.table("messages").insert({"session_id": session_id, "role": role, "content": content}).execute()


def load_chat_history(session_id: str) -> list[dict]:
    res = supabase.table("messages").select("role, content").eq("session_id", session_id).order("created_at", desc=False).execute()
    return res.data or []


def list_student_sessions(student_id: str) -> list[dict]:
    res = supabase.table("chat_sessions").select("id, started_at, ended_at").eq("student_id", student_id).order("started_at", desc=True).execute()
    return res.data or []


def get_session_messages(student_id: str, session_id: str) -> list[dict]:
    validate_chat_session(student_id, session_id)
    res = supabase.table("messages").select("id, session_id, role, content, created_at").eq("session_id", session_id).order("created_at", desc=False).execute()
    return res.data or []


def extract_student_id(authorization: Optional[str]) -> Optional[str]:
    """Extract student ID from authorization token"""
    if not authorization:
        return None
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        
        res = supabase.table("students").select("id").eq("user_id", payload["sub"]).execute()
        
        if res.data:
            student_id = res.data[0]["id"]
            return student_id
        else:
            pass
    except Exception as e:
        print(f"DEBUG: Error extracting student ID: {e}")
    return None


def fetch_student_profile(student_id: str) -> Dict[str, Any]:
    """Fetch comprehensive student profile including grades, courses, and attendance"""
    try:
        # Student basic info
        student = supabase.table("students").select("*, users(name, email, created_at)").eq("id", student_id).execute()
        
        
        # Courses enrolled
        enrollments = supabase.table("enrollments").select("*, courses(title, code, credits)").eq("student_id", student_id).execute()
        
        
        # Grades
        grades = supabase.table("grades").select("value, course_id, courses(title, code)").eq("student_id", student_id).execute()
        
        
        # Convert 'value' to 'grade' for consistency
        for grade_record in grades.data:
            if 'value' in grade_record:
                grade_record['grade'] = grade_record.pop('value')
        
        # Attendance
        attendance = supabase.table("attendance").select("status, course_id, date, courses(title, code)").eq("student_id", student_id).order("date", desc=True).execute()
        
        # Student preferences
        preferences = supabase.table("student_preferences").select("preference_text").eq("student_id", student_id).execute()
        
        
        # Calculate GPA and attendance stats
        gpa = calculate_gpa(grades.data) if grades.data else None
        attendance_stats = calculate_attendance_stats(attendance.data) if attendance.data else None
        course_attendance = calculate_course_attendance_stats(attendance.data) if attendance.data else {}
        low_attendance_courses = extract_low_attendance_courses(course_attendance)
        
        profile = {
            "student_info": student.data[0] if student.data else None,
            "courses": [e["courses"] for e in enrollments.data] if enrollments.data else [],
            "grades": grades.data,
            "gpa": gpa,
            "attendance": attendance_stats,
            "course_attendance": course_attendance,
            "low_attendance_courses": low_attendance_courses,
            "total_credits": sum(e["courses"]["credits"] for e in enrollments.data) if enrollments.data else 0,
            "preferences": [p["preference_text"] for p in preferences.data] if preferences.data else [],
        }
        
        return profile
    except Exception as e:
        print(f"Error fetching student profile: {e}")
        return {}


def calculate_gpa(grades: list) -> float:
    """Calculate student GPA from grades"""
    grade_map = {"A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7, "C+": 2.3, "C": 2.0, "C-": 1.7, "D": 1.0, "F": 0.0}
    valid_grades = []
    for g in grades:
        grade_value = g.get("grade") or g.get("value")
        if grade_value in grade_map:
            valid_grades.append(grade_map[grade_value])
        elif isinstance(grade_value, (int, float)):
            # If it's already a numeric grade
            valid_grades.append(float(grade_value))
    
    gpa = sum(valid_grades) / len(valid_grades) if valid_grades else 0
    return gpa


def calculate_attendance_stats(attendance: list) -> Dict[str, Any]:
    """Calculate attendance statistics"""
    total = len(attendance)
    present = sum(1 for a in attendance if a["status"] == "present")
    absent = sum(1 for a in attendance if a["status"] == "absent")
    late = sum(1 for a in attendance if a["status"] == "late")
    
    return {
        "total_records": total,
        "present": present,
        "absent": absent,
        "late": late,
        "presence_rate": (present / total * 100) if total > 0 else 0,
    }


def calculate_course_attendance_stats(attendance: list) -> Dict[str, Any]:
    """Calculate attendance statistics by course."""
    courses = {}
    for record in attendance:
        course = record.get("courses") or {}
        course_id = record.get("course_id")
        course_key = course_id or course.get("code") or record.get("status")
        if course_key not in courses:
            courses[course_key] = {
                "title": course.get("title", "Unknown"),
                "code": course.get("code", "Unknown"),
                "total": 0,
                "present": 0,
                "absent": 0,
                "late": 0,
            }
        courses[course_key]["total"] += 1
        if record["status"] == "present":
            courses[course_key]["present"] += 1
        elif record["status"] == "absent":
            courses[course_key]["absent"] += 1
        elif record["status"] == "late":
            courses[course_key]["late"] += 1

    for stats in courses.values():
        stats["presence_rate"] = (stats["present"] / stats["total"] * 100) if stats["total"] > 0 else 0
    return courses


def extract_low_attendance_courses(course_attendance: dict, threshold: float = 75.0) -> list[dict]:
    """Identify courses below the attendance threshold."""
    return [
        {
            "code": stats.get("code", "Unknown"),
            "title": stats.get("title", "Unknown"),
            "presence_rate": stats.get("presence_rate", 0),
        }
        for stats in course_attendance.values()
        if stats.get("presence_rate", 0) < threshold
    ]


def build_student_context(student_profile: Dict[str, Any]) -> str:
    """Build a rich context string from student profile for the system prompt"""
    if not student_profile.get("student_info"):
        return ""
    
    student_info = student_profile["student_info"]
    user_info = student_info.get("users", {})
    
    context = f"""
[STUDENT PROFILE - CONFIDENTIAL ACADEMIC DATA]
Name: {user_info.get('name', 'Unknown')}
Email: {user_info.get('email', 'Unknown')}
Enrollment Date: {user_info.get('created_at', 'Unknown')}

Academic Performance:
- Current GPA: {f"{student_profile.get('gpa'):.2f}" if student_profile.get('gpa') is not None else 'N/A'}
- Total Credits: {student_profile.get('total_credits', 0)}
- Courses Enrolled: {len(student_profile.get('courses', []))} courses

Recent Grades:
{format_grades(student_profile.get('grades', []))}

Current Courses:
{format_courses(student_profile.get('courses', []))}

Attendance Summary:
{format_attendance(student_profile.get('attendance', {}))}

Course Attendance by Subject:
{format_course_attendance(student_profile.get('course_attendance', {}))}

Attendance Risk / Failed Courses:
{format_low_attendance_courses(student_profile.get('low_attendance_courses', []))}

Student Preferences:
{format_preferences(student_profile.get('preferences', []))}

[END STUDENT PROFILE]
"""
    return context


def format_grades(grades: list) -> str:
    """Format grades for display"""
    if not grades:
        return "- No grades recorded yet"
    
    formatted = []
    for grade in grades[:10]:  # Show last 10 grades
        course = grade.get("courses", {})
        formatted.append(f"  • {course.get('code', 'N/A')}: {grade.get('grade', 'N/A')}")
    return "\n".join(formatted)


def format_courses(courses: list) -> str:
    """Format courses for display"""
    if not courses:
        return "- No courses enrolled"
    
    formatted = []
    for course in courses:
        formatted.append(f"  • {course.get('code', 'N/A')}: {course.get('title', 'N/A')} ({course.get('credits', 0)} credits)")
    return "\n".join(formatted)


def format_attendance(attendance_stats: dict) -> str:
    """Format attendance statistics"""
    if not attendance_stats:
        return "- No attendance data available"
    
    return f"""  • Presence Rate: {attendance_stats.get('presence_rate', 0):.1f}%
  • Present: {attendance_stats.get('present', 0)} classes
  • Absent: {attendance_stats.get('absent', 0)} classes
  • Late: {attendance_stats.get('late', 0)} times
  • Note: course attendance below 75% is considered a failure in that subject."""


def format_course_attendance(course_attendance: dict) -> str:
    """Format attendance details by course."""
    if not course_attendance:
        return "- No course attendance data available"

    formatted = []
    for stats in course_attendance.values():
        formatted.append(
            f"  • {stats.get('code', 'Unknown')} - {stats.get('title', 'Unknown')}: "
            f"{stats.get('presence_rate', 0):.1f}% attendance "
            f"({stats.get('present', 0)}/{stats.get('total', 0)} present)"
        )
    return "\n".join(formatted)


def format_low_attendance_courses(low_attendance_courses: list) -> str:
    """Format courses that are below the attendance threshold."""
    if not low_attendance_courses:
        return "  • None"

    formatted = []
    for course in low_attendance_courses:
        formatted.append(
            f"  • {course.get('code', 'Unknown')} - {course.get('title', 'Unknown')}: "
            f"{course.get('presence_rate', 0):.1f}% attendance"
        )
    return "\n".join(formatted)


def format_preferences(preferences: list) -> str:
    """Format student preferences for display"""
    if not preferences:
        return "- No preferences recorded yet"
    
    formatted = []
    for pref in preferences:
        formatted.append(f"  • {pref}")
    return "\n".join(formatted)


def call_model(messages: list[dict], student_context: str = "") -> str:
    system_message = """You are M.I.A (Metropolitan Information Agent), a helpful and empathetic academic advisor at a university.
Your role is to:
1. Provide personalized academic guidance based on the student's performance and enrollment
2. Suggest improvements and strategies for success
3. Answer questions about courses, grades, attendance, and academic policies
4. Be supportive and encouraging while honest about challenges
5. Help students understand their academic standing and plan their future

When providing advice:
- Reference specific courses, grades, or attendance issues if available
- Take into account the student's recorded preferences and tailor your advice accordingly
- Provide actionable recommendations that align with their stated preferences
- Celebrate achievements and improvements
- Suggest resources or support if needed (tutoring, office hours, counseling)
- Treat any course with attendance below 75% as failed and clearly advise the student on attendance improvement
- Be professional but conversational"""

    if student_context:
        system_message += f"\n\n{student_context}"
    
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_message},
            *messages,
        ],
        temperature=0.7,
        max_tokens=1024,
    )
    
    return completion.choices[0].message.content


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, authorization: Annotated[Optional[str], Header()] = None):
    student_context = ""
    session_id = req.session_id

    if authorization:
        student_id = extract_student_id(authorization)
        if not student_id:
            raise HTTPException(status_code=401, detail="Invalid authorization token")

        profile = fetch_student_profile(student_id)
        student_context = build_student_context(profile)

        history = []
        try:
            if session_id:
                session_id = validate_chat_session(student_id, session_id)
            else:
                session_id = create_chat_session(student_id)
            history = load_chat_history(session_id)
            save_chat_message(session_id, "user", req.message)
        except Exception as e:
            print(f"Session/history DB error (chat will continue without persistence): {e}")
            session_id = session_id or "temporary"

        try:
            answer = call_model(history + [{"role": "user", "content": req.message}], student_context)
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

        try:
            if session_id != "temporary":
                save_chat_message(session_id, "assistant", answer)
        except Exception as e:
            print(f"Failed to save assistant message: {e}")

        return {"response": answer, "session_id": session_id}

    # Fallback when no authorization is provided: keep in-memory history only
    chat_history.append({"role": "user", "content": req.message})
    try:
        answer = call_model(chat_history, student_context)
    except Exception as e:
        chat_history.pop()
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")
    chat_history[:] = chat_history[-10:]
    chat_history.append({"role": "assistant", "content": answer})
    return {"response": answer, "session_id": session_id or "temporary"}


@router.get("/sessions", response_model=list[SessionRead])
def get_chat_sessions(authorization: Annotated[str, Header()]):
    token = authorization.replace("Bearer ", "")
    student_id = extract_student_id(token)
    return list_student_sessions(student_id)


@router.get("/sessions/{session_id}/messages", response_model=list[MessageRead])
def get_chat_session_messages(session_id: str, authorization: Annotated[str, Header()]):
    token = authorization.replace("Bearer ", "")
    student_id = extract_student_id(token)
    return get_session_messages(student_id, session_id)


@router.delete("/sessions/{session_id}", status_code=204)
def delete_chat_session(session_id: str, authorization: Annotated[str, Header()]):
    token = authorization.replace("Bearer ", "")
    student_id = extract_student_id(token)
    validate_chat_session(student_id, session_id)
    supabase.table("messages").delete().eq("session_id", session_id).execute()
    supabase.table("chat_sessions").delete().eq("id", session_id).eq("student_id", student_id).execute()
