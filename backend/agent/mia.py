from fastapi import APIRouter, HTTPException, Header
from schemas.mia import ChatRequest, ChatResponse
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

# Temporary in-memory history — will be replaced in Point 6 with DB persistence
chat_history: list[dict] = []


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
        attendance = supabase.table("attendance").select("status, date, courses(title)").eq("student_id", student_id).order("date", desc=True).limit(20).execute()
        
        # Student preferences
        preferences = supabase.table("student_preference").select("value").eq("student_id", student_id).execute()
        
        
        # Calculate GPA and attendance stats
        gpa = calculate_gpa(grades.data) if grades.data else None
        attendance_stats = calculate_attendance_stats(attendance.data) if attendance.data else None
        
        profile = {
            "student_info": student.data[0] if student.data else None,
            "courses": [e["courses"] for e in enrollments.data] if enrollments.data else [],
            "grades": grades.data,
            "gpa": gpa,
            "attendance": attendance_stats,
            "total_credits": sum(e["courses"]["credits"] for e in enrollments.data) if enrollments.data else 0,
            "preferences": [p["value"] for p in preferences.data] if preferences.data else [],
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
  • Late: {attendance_stats.get('late', 0)} times"""


def format_preferences(preferences: list) -> str:
    """Format student preferences for display"""
    if not preferences:
        return "- No preferences recorded yet"
    
    formatted = []
    for pref in preferences:
        formatted.append(f"  • {pref}")
    return "\n".join(formatted)


def call_model(message: str, student_context: str = "") -> str:
    global chat_history
    chat_history.append({"role": "user", "content": message})
    
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
- Be professional but conversational"""

    if student_context:
        system_message += f"\n\n{student_context}"
    
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_message},
            *chat_history,
        ],
        temperature=0.7,
        max_tokens=1024,
    )
    
    reply = completion.choices[0].message.content
    chat_history = chat_history[-10:]
    chat_history.append({"role": "assistant", "content": reply})
    return reply


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, authorization: Annotated[Optional[str], Header()] = None):
    student_context = ""
    
    # If authorization header provided, fetch student context
    if authorization:
        student_id = extract_student_id(authorization)
        if student_id:
            profile = fetch_student_profile(student_id)
            student_context = build_student_context(profile)
    
    
    
    answer = call_model(req.message, student_context)
    # session_id is a placeholder until Point 6 wires up DB persistence
    return {"response": answer, "session_id": "temporary"}
