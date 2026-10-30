from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import AutoReconnect, NetworkTimeout, ServerSelectionTimeoutError
import os
import logging
from pathlib import Path
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import secrets
import string
import hashlib
import random

from models import (
    UserCreate, UserLogin, UserResponse, UserUpdate, UserInDB,
    GroupCreate, GroupResponse, GroupInDB, GroupRole, GroupRoleUpdate, GroupArchiveUpdate,
    GroupQuestionConfig, GroupQuestionCategoriesUpdate, GroupQuestionHistoryUpdate,
    QuestionResponse, QuestionInDB, QuestionStatus,
    UserQuestionProgress, NextQuestionResponse,
    Token
)
from auth import (
    get_password_hash, verify_password, create_access_token, decode_access_token
)
from question_priority import aggregate_question_priority, priority_key

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
mongo_timeout_ms = int(os.getenv("MONGO_SERVER_SELECTION_TIMEOUT_MS", "3000"))
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=mongo_timeout_ms)
db = client[os.environ['DB_NAME']]

# Collections
users_collection = db.users
groups_collection = db.groups
questions_collection = db.questions
user_questions_collection = db.user_questions
invites_collection = db.group_invites

APP_BASE_PATH = os.getenv("APP_BASE_PATH", "/DeepTalk").strip() or "/DeepTalk"
if not APP_BASE_PATH.startswith("/"):
    APP_BASE_PATH = f"/{APP_BASE_PATH}"
APP_BASE_PATH = APP_BASE_PATH.rstrip("/")
PUBLIC_APP_URL = os.getenv("PUBLIC_APP_URL", "").rstrip("/")

# Create the main app
app = FastAPI()


@app.exception_handler(ServerSelectionTimeoutError)
@app.exception_handler(NetworkTimeout)
@app.exception_handler(AutoReconnect)
async def database_unavailable_handler(request: Request, exc: Exception):
    logging.exception("MongoDB is unavailable while handling %s", request.url.path)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Сервис временно недоступен. Попробуйте ещё раз через несколько секунд."},
    )

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

def normalize_member_roles(group: dict) -> dict:
    """Backfill and validate member roles for old and new group documents."""
    member_ids = list(dict.fromkeys(group.get("member_ids", [])))
    raw_roles = group.get("member_roles") or {}
    valid_roles = {GroupRole.HOST.value, GroupRole.PARTICIPANT.value}
    normalized = {}

    for member_id in member_ids:
        raw_role = raw_roles.get(member_id)
        if raw_role in valid_roles:
            normalized[member_id] = raw_role
        elif member_id == group.get("creator_id"):
            normalized[member_id] = GroupRole.HOST.value
        else:
            normalized[member_id] = GroupRole.PARTICIPANT.value

    creator_id = group.get("creator_id")
    if creator_id in normalized and GroupRole.HOST.value not in normalized.values():
        normalized[creator_id] = GroupRole.HOST.value

    return normalized


def normalize_member_role_permissions(group: dict, normalized_roles: dict) -> dict:
    """Keep role delegation explicit while preserving access for legacy hosts."""
    raw_permissions = group.get("member_role_permissions") or {}
    raw_roles = group.get("member_roles") or {}
    creator_id = group.get("creator_id")
    normalized = {}

    for member_id, role in normalized_roles.items():
        if role != GroupRole.HOST.value:
            continue
        if member_id == creator_id:
            normalized[member_id] = True
        elif member_id in raw_permissions:
            normalized[member_id] = bool(raw_permissions[member_id])
        else:
            # Before this permission existed every host could manage roles.
            normalized[member_id] = raw_roles.get(member_id) == GroupRole.HOST.value

    return normalized


def can_manage_member_roles(group: dict, member_id: str) -> bool:
    return (
        group.get("member_roles", {}).get(member_id) == GroupRole.HOST.value
        and bool(group.get("member_role_permissions", {}).get(member_id))
    )

async def ensure_group_roles(group: dict) -> dict:
    """Persist normalized roles when a group was created before roles existed."""
    normalized_roles = normalize_member_roles(group)
    normalized_permissions = normalize_member_role_permissions(group, normalized_roles)
    updates = {}
    if group.get("member_roles") != normalized_roles:
        updates["member_roles"] = normalized_roles
    if group.get("member_role_permissions") != normalized_permissions:
        updates["member_role_permissions"] = normalized_permissions
    if updates:
        await groups_collection.update_one(
            {"id": group["id"]},
            {"$set": updates}
        )
    group["member_roles"] = normalized_roles
    group["member_role_permissions"] = normalized_permissions
    return group

async def build_group_response(group: dict, current_user: UserInDB) -> GroupResponse:
    group = await ensure_group_roles(group)
    member_ids = group.get("member_ids", [])
    members_cursor = users_collection.find({"id": {"$in": member_ids}})
    members = await members_cursor.to_list(100)

    return GroupResponse(
        **group,
        current_user_role=group["member_roles"].get(current_user.id),
        current_user_can_manage_roles=can_manage_member_roles(group, current_user.id),
        members=[UserResponse(**member) for member in members],
        is_archived=current_user.id in group.get("archived_by", []),
        can_delete=group.get("creator_id") == current_user.id,
    )

def build_invite_url(invite_code: str) -> str:
    invite_path = f"{APP_BASE_PATH}/join/{invite_code}"
    if PUBLIC_APP_URL:
        return f"{PUBLIC_APP_URL}/join/{invite_code}"
    return invite_path

def build_default_question_categories(questions: List[dict]) -> List[dict]:
    grouped_questions = {}
    category_order = []

    for question in questions:
        category_name = question["category"]
        if category_name not in grouped_questions:
            grouped_questions[category_name] = []
            category_order.append(category_name)
        grouped_questions[category_name].append(question)

    categories = []
    for category_name in category_order:
        category_id = "category_" + hashlib.sha1(category_name.encode("utf-8")).hexdigest()[:10]
        category_questions = grouped_questions[category_name]
        categories.append({
            "id": category_id,
            "name": category_name,
            "enabled": True,
            "questions": [question["text"] for question in category_questions],
            "questionIds": [question["id"] for question in category_questions],
            "disabledQuestions": [],
        })

    return [{
        "id": "set_base_1",
        "type": "question_set",
        "name": "Базовый набор № 1",
        "enabled": True,
        "subcategories": categories,
    }]

def normalize_question_history(history: Optional[dict]) -> dict:
    if not history:
        return {"used": [], "skipped": []}
    return {
        "used": list(history.get("used", [])),
        "skipped": list(history.get("skipped", [])),
    }


async def get_member_question_priority(member_ids: List[str]) -> dict:
    """Count prior completions and skips among the current conversation members."""
    if not member_ids:
        return {}

    progress = await user_questions_collection.find({
        "$or": [
            {"user_id": {"$in": member_ids}},
            {"answered_with_users": {"$in": member_ids}},
        ],
        "status": {"$in": [QuestionStatus.COMPLETED.value, QuestionStatus.SKIPPED.value]},
    }).to_list(10000)
    return aggregate_question_priority(progress, member_ids=member_ids)


def get_discussion_member_ids(group: dict) -> List[str]:
    return list(group.get("member_ids", []))


async def get_group_for_member(group_id: str, current_user: UserInDB) -> dict:
    group = await groups_collection.find_one({"id": group_id})
    if not group or current_user.id not in group.get("member_ids", []):
        raise HTTPException(status_code=403, detail="Not a member of this group")
    return await ensure_group_roles(group)

async def get_group_question_config_data(group: dict) -> dict:
    categories = group.get("question_categories")
    history = normalize_question_history(group.get("question_history"))
    updates = {}

    if categories is None:
        all_questions = await questions_collection.find({}).to_list(1000)
        categories = build_default_question_categories(all_questions)
        updates["question_categories"] = categories

    if group.get("question_history") != history:
        updates["question_history"] = history

    if updates:
        await groups_collection.update_one({"id": group["id"]}, {"$set": updates})
        group.update(updates)

    question_priority = await get_member_question_priority(get_discussion_member_ids(group))
    return {
        "categories": categories,
        "history": history,
        "question_priority": question_priority,
    }

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
        "member_roles": {current_user.id: GroupRole.HOST.value},
        "member_role_permissions": {current_user.id: True},
        "archived_by": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await groups_collection.insert_one(group_dict)
    
    return await build_group_response(group_dict, current_user)

@api_router.get("/groups", response_model=List[GroupResponse])
async def get_user_groups(current_user: UserInDB = Depends(get_current_user)):
    """Get all groups user is member of"""
    groups = await groups_collection.find(
        {"member_ids": current_user.id}
    ).to_list(100)
    
    result = []
    for group in groups:
        result.append(await build_group_response(group, current_user))
    
    return result

@api_router.put("/groups/{group_id}/archive", response_model=GroupResponse)
async def update_group_archive(
    group_id: str,
    payload: GroupArchiveUpdate,
    current_user: UserInDB = Depends(get_current_user),
):
    """Archive or restore a conversation for the current user only."""
    await get_group_for_member(group_id, current_user)
    update = (
        {"$addToSet": {"archived_by": current_user.id}}
        if payload.archived
        else {"$pull": {"archived_by": current_user.id}}
    )
    await groups_collection.update_one({"id": group_id}, update)
    group = await groups_collection.find_one({"id": group_id})
    return await build_group_response(group, current_user)

@api_router.delete("/groups/{group_id}")
async def delete_group(
    group_id: str,
    current_user: UserInDB = Depends(get_current_user),
):
    """Permanently delete an archived conversation owned by the current user."""
    group = await get_group_for_member(group_id, current_user)
    if group.get("creator_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Удалить разговор может только его создатель")
    if current_user.id not in group.get("archived_by", []):
        raise HTTPException(status_code=409, detail="Сначала переместите разговор в архив")

    await invites_collection.delete_many({"group_id": group_id})
    result = await groups_collection.delete_one({"id": group_id, "creator_id": current_user.id})
    if result.deleted_count != 1:
        raise HTTPException(status_code=409, detail="Не удалось удалить разговор")
    return {"success": True}

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
    
    group = await ensure_group_roles(group)
    
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
    
    return {"invite_code": invite_code, "invite_url": build_invite_url(invite_code)}

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
    
    group = await ensure_group_roles(group)
    
    # Add user to group if not already member
    if current_user.id not in group["member_ids"]:
        await groups_collection.update_one(
            {"id": group["id"]},
            {
                "$push": {"member_ids": current_user.id},
                "$set": {f"member_roles.{current_user.id}": GroupRole.PARTICIPANT.value}
            }
        )
        group["member_ids"].append(current_user.id)
        group["member_roles"][current_user.id] = GroupRole.PARTICIPANT.value
    
    return await build_group_response(group, current_user)

@api_router.put("/groups/{group_id}/members/{member_id}/role", response_model=GroupResponse)
async def update_group_member_role(
    group_id: str,
    member_id: str,
    role_update: GroupRoleUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update a member role and optional role-delegation permission."""
    group = await groups_collection.find_one({"id": group_id})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id not in group["member_ids"]:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    group = await ensure_group_roles(group)
    
    if not can_manage_member_roles(group, current_user.id):
        raise HTTPException(status_code=403, detail="Role management permission required")
    
    if member_id not in group["member_ids"]:
        raise HTTPException(status_code=404, detail="Member not found in this group")
    if member_id == group.get("creator_id") and role_update.role != GroupRole.HOST:
        raise HTTPException(status_code=400, detail="Conversation creator must remain an administrator")
    
    updated_roles = dict(group["member_roles"])
    updated_roles[member_id] = role_update.role.value
    updated_permissions = dict(group.get("member_role_permissions", {}))
    if role_update.role == GroupRole.HOST:
        updated_permissions[member_id] = (
            True if member_id == group.get("creator_id") else role_update.can_manage_roles
        )
    else:
        updated_permissions.pop(member_id, None)
    
    if GroupRole.HOST.value not in updated_roles.values():
        raise HTTPException(status_code=400, detail="Group must have at least one host")
    
    await groups_collection.update_one(
        {"id": group_id},
        {"$set": {
            "member_roles": updated_roles,
            "member_role_permissions": updated_permissions,
        }}
    )
    group["member_roles"] = updated_roles
    group["member_role_permissions"] = updated_permissions
    
    return await build_group_response(group, current_user)

@api_router.get("/groups/{group_id}/question-config", response_model=GroupQuestionConfig)
async def get_group_question_config(
    group_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get per-group categories, question toggles, and discussion history."""
    group = await get_group_for_member(group_id, current_user)
    return GroupQuestionConfig(**await get_group_question_config_data(group))

@api_router.put("/groups/{group_id}/question-categories", response_model=GroupQuestionConfig)
async def update_group_question_categories(
    group_id: str,
    payload: GroupQuestionCategoriesUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Persist category and question selection settings for a group."""
    group = await get_group_for_member(group_id, current_user)
    if group["member_roles"].get(current_user.id) != GroupRole.HOST.value:
        raise HTTPException(status_code=403, detail="Only hosts can manage question settings")
    
    await groups_collection.update_one(
        {"id": group_id},
        {"$set": {"question_categories": payload.categories}}
    )
    group["question_categories"] = payload.categories
    return GroupQuestionConfig(**await get_group_question_config_data(group))

@api_router.put("/groups/{group_id}/question-history", response_model=GroupQuestionConfig)
async def update_group_question_history(
    group_id: str,
    payload: GroupQuestionHistoryUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Persist shared question history for a group discussion."""
    group = await get_group_for_member(group_id, current_user)
    history = normalize_question_history(payload.history)
    await groups_collection.update_one(
        {"id": group_id},
        {"$set": {"question_history": history}}
    )
    group["question_history"] = history
    return GroupQuestionConfig(**await get_group_question_config_data(group))

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
    group = await ensure_group_roles(group)
    
    # Keep this compatibility endpoint aligned with the client-side/offline
    # selector: fewer completions first, then fewer skips, random within a tie.
    user_progress = await user_questions_collection.find(
        {"user_id": current_user.id}
    ).to_list(1000)

    # Get all questions
    all_questions = await questions_collection.find({}).to_list(1000)
    question_priority = await get_member_question_priority(get_discussion_member_ids(group))
    if all_questions:
        best_priority = min(
            priority_key(question_priority.get(question["id"], {}))
            for question in all_questions
        )
        best_questions = [
            question for question in all_questions
            if priority_key(question_priority.get(question["id"], {})) == best_priority
        ]
        next_question = random.choice(best_questions)
    else:
        next_question = None
    
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
    group = None
    if group_id:
        group = await groups_collection.find_one({"id": group_id})
        if not group or current_user.id not in group["member_ids"]:
            raise HTTPException(status_code=403, detail="Not a member of this group")
        
        group = await ensure_group_roles(group)
    
    # A completion is permanent for prioritization: a later skip must not
    # downgrade a question that the user has already discussed.
    existing = await user_questions_collection.find_one({
        "user_id": current_user.id,
        "question_id": question_id
    })
    
    requested_status = status.value
    discussed_with = (
        [member_id for member_id in get_discussion_member_ids(group) if member_id != current_user.id]
        if group and requested_status == QuestionStatus.COMPLETED.value
        else []
    )
    if existing:
        next_status = (
            QuestionStatus.COMPLETED.value
            if existing.get("status") == QuestionStatus.COMPLETED.value
            or requested_status == QuestionStatus.COMPLETED.value
            else QuestionStatus.SKIPPED.value
        )
        update = {
            "$set": {
                "status": next_status,
                "answered_at": datetime.now(timezone.utc).isoformat()
            }
        }
        if next_status == QuestionStatus.COMPLETED.value and discussed_with:
            update["$addToSet"] = {"answered_with_users": {"$each": discussed_with}}

        await user_questions_collection.update_one(
            {"id": existing["id"]},
            update,
        )
    else:
        # Create new progress entry
        progress_dict = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "question_id": question_id,
            "status": requested_status,
            "answered_with_users": discussed_with,
            "answered_at": datetime.now(timezone.utc).isoformat()
        }
        await user_questions_collection.insert_one(progress_dict)
    
        next_status = requested_status

    return {"success": True, "status": next_status}

# ==================== SEED QUESTIONS ====================

@api_router.post("/admin/seed-questions")
async def seed_questions():
    """Seed initial questions (admin only - remove in production)"""
    from questions_seed import QUESTIONS_DATA
    
    # Check if questions already exist
    existing_count = await questions_collection.count_documents({})
    if existing_count > 0:
        return {"message": f"Questions already seeded ({existing_count} questions)"}
    
    # Seed all questions
    questions_to_insert = []
    for category, questions in QUESTIONS_DATA.items():
        for question_text in questions:
            question_dict = {
                "id": str(uuid.uuid4()),
                "text": question_text,
                "category": category
            }
            questions_to_insert.append(question_dict)
    
    if questions_to_insert:
        await questions_collection.insert_many(questions_to_insert)
    
    return {
        "message": f"Successfully seeded {len(questions_to_insert)} questions across {len(QUESTIONS_DATA)} categories",
        "total_questions": len(questions_to_insert),
        "categories": list(QUESTIONS_DATA.keys())
    }

# Include router in app
app.include_router(api_router)

# Health check
@app.get("/health")
async def health():
    return {"status": "ok"}
