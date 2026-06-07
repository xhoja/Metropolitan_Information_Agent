from fastapi import APIRouter, HTTPException, Header
from models import LoginRequest, UserCreate
from db import supabase
import bcrypt
import jwt, os, datetime

router = APIRouter()
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is required. Set it in backend/.env "
        "to a strong random value (32+ characters)."
    )

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str):
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token invalid")

def require_role(token: str, *roles: str):
    """Shared role guard: decode the token and ensure the caller holds one of
    the allowed roles, returning a clean 403 otherwise."""
    payload = decode_token(token)
    if payload.get("role") not in roles:
        raise HTTPException(status_code=403, detail="Forbidden: insufficient role")
    return payload

@router.post("/login")
def login(req: LoginRequest):
    res = supabase.table("users").select("*").eq("email", req.email).execute()
    if not res.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = res.data[0]
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["role"])
    return {"access_token": token, "role": user["role"], "name": user["name"]}

@router.post("/register")
def register(data: UserCreate):
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
        supabase.table("students").insert({
            "user_id": user["id"],
            "major": data.major,
            "enrolled_year": datetime.datetime.now().year
        }).execute()
    elif data.role == "professor":
        supabase.table("professors").insert({
            "user_id": user["id"],
            "department": data.department,
            "title": data.title
        }).execute()
    token = create_token(user["id"], user["role"])
    return {"access_token": token, "role": user["role"], "name": user["name"]}

@router.get("/me")
def get_me(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    res = supabase.table("users").select("id, name, email, role").eq("id", payload["sub"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
    return res.data[0]