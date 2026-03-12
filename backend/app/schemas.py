from pydantic import BaseModel, EmailStr, field_validator, computed_field
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal

# --- User Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    nickname: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if len(v) > 72:
            raise ValueError('Password cannot be longer than 72 characters')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    nickname: str
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# --- Account Member Schemas ---
class AccountMemberBase(BaseModel):
    nickname: str

class AccountMemberCreate(AccountMemberBase):
    pass

class AccountMemberUpdate(BaseModel):
    nickname: str

class AccountMember(AccountMemberBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Account Type Schemas ---
class AccountTypeBase(BaseModel):
    name: str

class AccountTypeCreate(AccountTypeBase):
    pass

class AccountTypeUpdate(BaseModel):
    name: str

class AccountType(AccountTypeBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Category Limit Schemas ---
class CategoryLimitBase(BaseModel):
    category: str
    limit_amount: Decimal

class CategoryLimitCreate(CategoryLimitBase):
    pass

class CategoryLimitUpdate(BaseModel):
    limit_amount: Decimal

class CategoryLimit(CategoryLimitBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# --- Payment Suggestion Schemas ---
class PaymentSuggestionResponse(BaseModel):
    id: int
    user_id: int
    original_payment_id: int
    suggested_date: date
    status: str
    created_at: datetime
    title: str
    amount: Decimal
    category: str
    payment_type: str
    recurring_frequency: str
    account_type: str
    
    class Config:
        from_attributes = True

class PaymentSuggestionAction(BaseModel):
    suggestion_id: int
            
# --- Payment Schemas ---
class PaymentCreate(BaseModel):
    title: str
    category: str
    amount: Decimal
    payment_type: str
    payment_date: date
    account_member_id: Optional[int] = None
    is_recurring: Optional[bool] = False
    recurring_frequency: Optional[str] = None
    account_type: Optional[str] = 'default'

class PaymentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[Decimal] = None
    payment_type: Optional[str] = None
    payment_date: Optional[date] = None
    account_member_id: Optional[int] = None
    is_recurring: Optional[bool] = None
    recurring_frequency: Optional[str] = None
    account_type: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    title: str
    category: str
    amount: float
    payment_type: str
    payment_date: date
    is_recurring: bool
    recurring_frequency: Optional[str]
    account_type: str
    member_nickname: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Payment(BaseModel):
    id: int
    user_id: int
    account_member_id: Optional[int]
    title: str
    category: str
    amount: Decimal
    payment_type: str
    payment_date: date
    is_recurring: bool
    recurring_frequency: Optional[str]
    account_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- NEW: Savings Account Schemas ---
class SavingsAccountBase(BaseModel):
    name: str
    bank_name: str
    account_type: str
    interest_rate: Decimal
    start_date: date
    maturity_date: Optional[date] = None
    notes: Optional[str] = None

class SavingsAccountCreate(SavingsAccountBase):
    pass

class SavingsAccountUpdate(BaseModel):
    name: Optional[str] = None
    bank_name: Optional[str] = None
    account_type: Optional[str] = None
    interest_rate: Optional[Decimal] = None
    start_date: Optional[date] = None
    maturity_date: Optional[date] = None
    notes: Optional[str] = None

class SavingsAccountResponse(SavingsAccountBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- NEW: Savings Goal Schemas ---
class SavingsGoalBase(BaseModel):
    name: str
    target_amount: Decimal
    deadline: Optional[date] = None
    notes: Optional[str] = None
    account_member_id: Optional[int] = None
    savings_account_id: Optional[int] = None

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[Decimal] = None
    deadline: Optional[date] = None
    notes: Optional[str] = None
    account_member_id: Optional[int] = None
    savings_account_id: Optional[int] = None
    is_completed: Optional[bool] = None

class SavingsGoalResponse(SavingsGoalBase):
    id: int
    user_id: int
    is_completed: bool
    created_at: datetime
    updated_at: datetime
    current_amount: float
    progress_percentage: float
    
    class Config:
        from_attributes = True

# --- NEW: Savings Deposit Schemas ---
class SavingsDepositBase(BaseModel):
    amount: Decimal
    transaction_type: str  # 'deposit' or 'withdrawal'
    transaction_date: date
    notes: Optional[str] = None
    account_member_id: Optional[int] = None

class SavingsDepositCreate(SavingsDepositBase):
    savings_goal_id: int

class SavingsDepositUpdate(BaseModel):
    amount: Optional[Decimal] = None
    transaction_type: Optional[str] = None
    transaction_date: Optional[date] = None
    notes: Optional[str] = None
    account_member_id: Optional[int] = None

class SavingsDepositResponse(SavingsDepositBase):
    id: int
    savings_goal_id: int
    member_nickname: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True