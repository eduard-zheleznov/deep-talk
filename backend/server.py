from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import secrets
import string

from models import (
    UserCreate, UserLogin, UserResponse, UserUpdate, UserInDB,
    GroupCreate, GroupResponse, GroupInDB,
    QuestionResponse, QuestionInDB, QuestionStatus,
    UserQuestionProgress, NextQuestionResponse,
    Token
)
from auth import (
    get_password_hash, verify_password, create_access_token, decode_access_token
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
users_collection = db.users
groups_collection = db.groups
questions_collection = db.questions
user_questions_collection = db.user_questions
invites_collection = db.group_invites

# Create the main app
app = FastAPI()

# Security
security = HTTPBearer()

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper function to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserInDB:
    token = credentials.credentials
    user_id = decode_access_token(token)
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user = await users_collection.find_one({"id": user_id})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return UserInDB(**user)

# Helper function to generate invite code
def generate_invite_code(length: int = 8) -> str:
    """Generate a random invite code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_dict = user_data.model_dump(exclude={"password", "secret_answer"})
    user_dict.update({
        "id": str(uuid.uuid4()),
        "hashed_password": get_password_hash(user_data.password),
        "hashed_secret_answer": get_password_hash(user_data.secret_answer),
        "avatar_url": None,
        "photos": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await users_collection.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_dict["id"]})
    
    return Token(access_token=access_token)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user"""
    user = await users_collection.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user["id"]})
    return Token(access_token=access_token)

# ==================== USER/PROFILE ENDPOINTS ====================

@api_router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: UserInDB = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse(**current_user.model_dump())

@api_router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update user profile"""
    update_data = profile_data.model_dump(exclude_unset=True)
    
    if update_data:
        await users_collection.update_one(
            {"id": current_user.id},
            {"$set": update_data}
        )
    
    updated_user = await users_collection.find_one({"id": current_user.id})
    return UserResponse(**updated_user)

# ==================== GROUP ENDPOINTS ====================

@api_router.post("/groups", response_model=GroupResponse)
async def create_group(
    group_data: GroupCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Create a new group"""
    group_dict = {
        "id": str(uuid.uuid4()),
        "name": group_data.name,
        "creator_id": current_user.id,
        "member_ids": [current_user.id],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await groups_collection.insert_one(group_dict)
    
    # Get creator info for response
    group_response = GroupResponse(**group_dict, members=[UserResponse(**current_user.model_dump())])
    return group_response

@api_router.get("/groups", response_model=List[GroupResponse])
async def get_user_groups(current_user: UserInDB = Depends(get_current_user)):
    """Get all groups user is member of"""
    groups = await groups_collection.find(
        {"member_ids": current_user.id}
    ).to_list(100)
    
    result = []
    for group in groups:
        # Get all members
        member_ids = group["member_ids"]
        members_cursor = users_collection.find({"id": {"$in": member_ids}})
        members = await members_cursor.to_list(100)
        
        group_response = GroupResponse(
            **group,
            members=[UserResponse(**m) for m in members]
        )
        result.append(group_response)
    
    return result

@api_router.post("/groups/{group_id}/invite")
async def create_invite(
    group_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Generate invite link for group"""
    group = await groups_collection.find_one({"id": group_id})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id not in group["member_ids"]:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # Generate invite code
    invite_code = generate_invite_code()
    
    # Check if code already exists, regenerate if needed
    while await invites_collection.find_one({"invite_code": invite_code}):
        invite_code = generate_invite_code()
    
    # Create invite
    invite_dict = {
        "id": str(uuid.uuid4()),
        "group_id": group_id,
        "invite_code": invite_code,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user.id
    }
    
    await invites_collection.insert_one(invite_dict)
    
    return {"invite_code": invite_code, "invite_url": f"/join/{invite_code}"}

@api_router.post("/groups/join/{invite_code}", response_model=GroupResponse)
async def join_group(
    invite_code: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Join group using invite code"""
    invite = await invites_collection.find_one({"invite_code": invite_code})
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    
    group = await groups_collection.find_one({"id": invite["group_id"]})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Add user to group if not already member
    if current_user.id not in group["member_ids"]:
        await groups_collection.update_one(
            {"id": group["id"]},
            {"$push": {"member_ids": current_user.id}}
        )
        group["member_ids"].append(current_user.id)
    
    # Get all members for response
    members_cursor = users_collection.find({"id": {"$in": group["member_ids"]}})
    members = await members_cursor.to_list(100)
    
    return GroupResponse(
        **group,
        members=[UserResponse(**m) for m in members]
    )

# ==================== QUESTION ENDPOINTS ====================

@api_router.get("/questions/next/{group_id}", response_model=NextQuestionResponse)
async def get_next_question(
    group_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get next question for user in group context"""
    # Verify user is member of group
    group = await groups_collection.find_one({"id": group_id})
    if not group or current_user.id not in group["member_ids"]:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # Get user's answered questions
    user_progress = await user_questions_collection.find(
        {"user_id": current_user.id}
    ).to_list(1000)
    
    answered_question_ids = [p["question_id"] for p in user_progress]
    
    # Get all questions
    all_questions = await questions_collection.find({}).to_list(1000)
    
    # Priority 1: Questions not answered by majority of group members
    unanswered_by_majority = []
    answered_by_user = []
    
    for question in all_questions:
        q_id = question["id"]
        
        # Count how many group members answered this
        answered_count = await user_questions_collection.count_documents({
            "question_id": q_id,
            "user_id": {"$in": group["member_ids"]},
            "status": {"$in": [QuestionStatus.COMPLETED, QuestionStatus.SKIPPED]}
        })
        
        majority_threshold = len(group["member_ids"]) / 2
        
        if q_id not in answered_question_ids and answered_count < majority_threshold:
            unanswered_by_majority.append(question)
        elif q_id in answered_question_ids:
            answered_by_user.append(question)
    
    # Choose question
    if unanswered_by_majority:
        next_question = unanswered_by_majority[0]
    elif answered_by_user:
        next_question = answered_by_user[0]
    else:
        # All questions exhausted, start over
        next_question = all_questions[0] if all_questions else None
    
    if not next_question:
        raise HTTPException(status_code=404, detail="No questions available")
    
    # Get stats
    total_questions = len(all_questions)
    answered_count = sum(1 for p in user_progress if p["status"] == QuestionStatus.COMPLETED)
    skipped_count = sum(1 for p in user_progress if p["status"] == QuestionStatus.SKIPPED)
    
    return NextQuestionResponse(
        question=QuestionResponse(**next_question),
        total_questions=total_questions,
        answered_count=answered_count,
        skipped_count=skipped_count
    )

@api_router.post("/questions/{question_id}/mark")
async def mark_question(
    question_id: str,
    status: QuestionStatus,
    group_id: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """Mark question as completed or skipped"""
    # Check if already marked
    existing = await user_questions_collection.find_one({
        "user_id": current_user.id,
        "question_id": question_id
    })
    
    if existing:
        # Update status
        await user_questions_collection.update_one(
            {"id": existing["id"]},
            {
                "$set": {
                    "status": status,
                    "answered_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    else:
        # Create new progress entry
        progress_dict = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "question_id": question_id,
            "status": status,
            "answered_with_users": [],
            "answered_at": datetime.now(timezone.utc).isoformat()
        }
        await user_questions_collection.insert_one(progress_dict)
    
    return {"success": True, "status": status}

# ==================== SEED QUESTIONS ====================

@api_router.post("/admin/seed-questions")
async def seed_questions():
    """Seed initial questions (admin only - remove in production)"""
    # Check if questions already exist
    existing_count = await questions_collection.count_documents({})
    if existing_count > 0:
        return {"message": f"Questions already seeded ({existing_count} questions)"}
    
    # This will be populated with actual questions
    # For now, just a placeholder
    categories_questions = {
        "Цели": [],
        "Ценности": [],
        "Прошлое": [],
        "Мечты": [],
        "Отношения": [],
        "Внутренние состояния": [],
        "Саморазвитие и рост": [],
        "Препятствия и страхи": [],
        "Вдохновение и творчество": [],
        "Смысл жизни и философия": []
    }
    
    # Will populate this in next step
    return {"message": "Seeding endpoint ready, questions to be added"}

# Include router in app
app.include_router(api_router)

# Health check
@app.get("/health")
async def health():
    return {"status": "ok"}
