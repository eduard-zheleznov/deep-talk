from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class QuestionStatus(str, Enum):
    NOT_ANSWERED = "not_answered"
    COMPLETED = "completed"
    SKIPPED = "skipped"

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    telegram: Optional[str] = None
    whatsapp: Optional[str] = None
    about_me: Optional[str] = None

class UserCreate(UserBase):
    password: str
    secret_question: str
    secret_answer: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserInDB(UserBase):
    id: str
    hashed_password: str
    secret_question: str
    hashed_secret_answer: str
    avatar_url: Optional[str] = None
    photos: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserResponse(UserBase):
    id: str
    avatar_url: Optional[str] = None
    photos: List[str] = []

class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    telegram: Optional[str] = None
    whatsapp: Optional[str] = None
    about_me: Optional[str] = None

# Group Models
class GroupBase(BaseModel):
    name: str

class GroupCreate(GroupBase):
    pass

class GroupInDB(GroupBase):
    id: str
    creator_id: str
    member_ids: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GroupResponse(GroupBase):
    id: str
    creator_id: str
    member_ids: List[str]
    members: List[UserResponse] = []

class GroupInvite(BaseModel):
    group_id: str
    invite_code: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

# Question Models
class QuestionBase(BaseModel):
    text: str
    category: str

class QuestionCreate(QuestionBase):
    pass

class QuestionInDB(QuestionBase):
    id: str

class QuestionResponse(QuestionBase):
    id: str

# User Question Progress
class UserQuestionProgress(BaseModel):
    id: str
    user_id: str
    question_id: str
    status: QuestionStatus
    answered_with_users: List[str] = []  # IDs of users they discussed this with
    answered_at: Optional[datetime] = None

class NextQuestionResponse(BaseModel):
    question: QuestionResponse
    total_questions: int
    answered_count: int
    skipped_count: int

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[str] = None
