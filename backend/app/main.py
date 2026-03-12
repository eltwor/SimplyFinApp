from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from typing import List, Optional
import traceback
from . import models, auth, schemas
from .database import get_db
from sqlalchemy import func, extract
from calendar import monthrange

app = FastAPI(title="SimplyFin API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://127.0.0.1",
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173" 
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.middleware("http")
async def log_requests(request, call_next):
    print(f"📨 {request.method} {request.url}")
    print(f"🔑 Headers: {request.headers}")
    response = await call_next(request)
    print(f"✅ Response status: {response.status_code}")
    return response

@app.get("/")
def root():
    return {"message": "SimplyFin API is running"}

# --- Auth Endpoints ---

@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserRegister, db: Session = Depends(get_db)):
    try:
        print(f"🔍 Attempting to register: {user.email}")
        
        existing_user = db.query(models.User).filter(models.User.email == user.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        hashed_password = auth.get_password_hash(user.password)
        new_user = models.User(
            email=user.email,
            password_hash=hashed_password,
            nickname=user.nickname
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # ✅ NOWE: Automatyczne tworzenie systemowych typów kont
        system_account_types = ['default', 'cash']
        for account_type_name in system_account_types:
            account_type = models.AccountType(
                user_id=new_user.id,
                name=account_type_name,
                is_active=True
            )
            db.add(account_type)
        
        db.commit()
        
        print(f"✅ User registered successfully! ID: {new_user.id}")
        print(f"✅ System account types created: {', '.join(system_account_types)}")
        return new_user
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    try:
        print(f"🔐 Login attempt for: {credentials.email}")
        
        user = db.query(models.User).filter(models.User.email == credentials.email).first()
        
        if not user or not auth.verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": user.email}, 
            expires_delta=access_token_expires
        )
        
        print(f"✅ Login successful for: {user.nickname}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/me", response_model=schemas.UserResponse)
async def get_current_user_info(current_user: models.User = Depends(auth.get_current_user)):
    """Get current logged-in user info"""
    return current_user

# --- Account Member Endpoints ---

@app.get("/account-members", response_model=List[schemas.AccountMember])
async def get_account_members(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all account members for the current user"""
    members = db.query(models.AccountMember).filter(
        models.AccountMember.user_id == current_user.id
    ).all()
    return members

@app.post("/account-members", response_model=schemas.AccountMember)
async def create_account_member(
    member_data: schemas.AccountMemberCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new account member"""
    
    # Check if user already has 10 active members
    active_count = db.query(models.AccountMember).filter(
        models.AccountMember.user_id == current_user.id,
        models.AccountMember.is_active == True
    ).count()
    
    if active_count >= 10:
        raise HTTPException(status_code=400, detail="Maximum of 10 account members reached")
    
    # Check for duplicate nickname
    existing = db.query(models.AccountMember).filter(
        models.AccountMember.user_id == current_user.id,
        models.AccountMember.nickname == member_data.nickname,
        models.AccountMember.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Member with this nickname already exists")
    
    # Create new member
    new_member = models.AccountMember(
        user_id=current_user.id,
        nickname=member_data.nickname,
        is_active=True
    )
    
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    return new_member

@app.delete("/account-members/{member_id}")
async def delete_account_member(
    member_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete (deactivate) an account member"""
    
    member = db.query(models.AccountMember).filter(
        models.AccountMember.id == member_id,
        models.AccountMember.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Account member not found")
    
    # Soft delete - set is_active to False
    member.is_active = False
    db.commit()
    
    return {"message": "Account member deactivated successfully"}

# --- Payment Endpoints ---

@app.get("/payments", response_model=List[schemas.PaymentResponse])
async def get_user_payments(
    limit: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all payments for the current user"""
    query = db.query(models.Payment).filter(
        models.Payment.user_id == current_user.id
    ).order_by(models.Payment.payment_date.desc())
    
    if limit:
        query = query.limit(limit)
    
    payments = query.all()
    return payments

@app.get("/payments/recent", response_model=List[schemas.PaymentResponse])
async def get_recent_payments(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent 10 payments for dashboard"""
    payments = db.query(models.Payment).filter(
        models.Payment.user_id == current_user.id
    ).order_by(models.Payment.payment_date.desc()).limit(10).all()
    
    return payments

@app.post("/payments", response_model=schemas.Payment)
async def create_payment(
    payment_data: schemas.PaymentCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new payment with optional account member and recurring settings"""
    
    # If account_member_id is provided, verify it belongs to the user
    if payment_data.account_member_id:
        member = db.query(models.AccountMember).filter(
            models.AccountMember.id == payment_data.account_member_id,
            models.AccountMember.user_id == current_user.id,
            models.AccountMember.is_active == True
        ).first()
        
        if not member:
            raise HTTPException(status_code=400, detail="Invalid account member")
    
    new_payment = models.Payment(
        user_id=current_user.id,
        account_member_id=payment_data.account_member_id,
        title=payment_data.title,
        category=payment_data.category,
        amount=payment_data.amount,
        payment_type=payment_data.payment_type,
        payment_date=payment_data.payment_date,
        is_recurring=payment_data.is_recurring or False,
        recurring_frequency=payment_data.recurring_frequency,
        account_type=payment_data.account_type or 'default'  # ADD THIS LINE
    )
    
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    
    return new_payment


@app.put("/payments/{payment_id}", response_model=schemas.Payment)
async def update_payment(
    payment_id: int,
    payment_data: schemas.PaymentUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing payment"""
    
    # Get the payment and verify ownership
    payment = db.query(models.Payment).filter(
        models.Payment.id == payment_id,
        models.Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # If account_member_id is being updated, verify it belongs to the user
    if payment_data.account_member_id is not None:
        if payment_data.account_member_id:  # If not None and not 0
            member = db.query(models.AccountMember).filter(
                models.AccountMember.id == payment_data.account_member_id,
                models.AccountMember.user_id == current_user.id,
                models.AccountMember.is_active == True
            ).first()
            
            if not member:
                raise HTTPException(status_code=400, detail="Invalid account member")
    
    # Update fields if provided
    update_data = payment_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(payment, field, value)
    
    db.commit()
    db.refresh(payment)
    
    return payment

@app.delete("/payments/{payment_id}")
async def delete_payment(
    payment_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a payment (only if it belongs to current user)"""
    payment = db.query(models.Payment).filter(
        models.Payment.id == payment_id,
        models.Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    db.delete(payment)
    db.commit()
    
    return {"message": "Payment deleted successfully"}

@app.get("/payments/expenses", response_model=List[schemas.PaymentResponse])
async def get_user_expenses(
    limit: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get expenses for the current user with optional date filtering"""
    query = db.query(models.Payment).filter(
        models.Payment.user_id == current_user.id,
        models.Payment.payment_type == 'expense'
    )
    
    if start_date:
        query = query.filter(models.Payment.payment_date >= start_date)
    if end_date:
        query = query.filter(models.Payment.payment_date <= end_date)
    
    query = query.order_by(models.Payment.payment_date.desc())
    
    if limit:
        query = query.limit(limit)
    
    expenses = query.all()
    return expenses

@app.get("/payments/income", response_model=List[schemas.PaymentResponse])
async def get_user_income(
    limit: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get income for the current user with optional date filtering"""
    query = db.query(models.Payment).filter(
        models.Payment.user_id == current_user.id,
        models.Payment.payment_type == 'income'
    )
    
    if start_date:
        query = query.filter(models.Payment.payment_date >= start_date)
    if end_date:
        query = query.filter(models.Payment.payment_date <= end_date)
    
    query = query.order_by(models.Payment.payment_date.desc())
    
    if limit:
        query = query.limit(limit)
    
    income = query.all()
    return income

@app.get("/payments/stats")
async def get_payment_stats(
    days: int = 30,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment statistics for the last N days"""
    start_date = date.today() - timedelta(days=days)
    
    # Calculate total expenses in the period
    total_expenses = db.query(
        func.sum(models.Payment.amount)
    ).filter(
        models.Payment.user_id == current_user.id,
        models.Payment.payment_type == 'expense',
        models.Payment.payment_date >= start_date
    ).scalar() or 0
    
    # Calculate total income in the period
    total_income = db.query(
        func.sum(models.Payment.amount)
    ).filter(
        models.Payment.user_id == current_user.id,
        models.Payment.payment_type == 'income',
        models.Payment.payment_date >= start_date
    ).scalar() or 0
    
    # Get expenses by category
    expenses_by_category = db.query(
        models.Payment.category,
        func.sum(models.Payment.amount).label('total')
    ).filter(
        models.Payment.user_id == current_user.id,
        models.Payment.payment_type == 'expense',
        models.Payment.payment_date >= start_date
    ).group_by(models.Payment.category).all()
    
    return {
        "period_days": days,
        "start_date": start_date,
        "end_date": date.today(),
        "total_expenses": float(abs(total_expenses)),
        "total_income": float(total_income),
        "expenses_by_category": [
            {"category": cat, "total": float(abs(total))}
            for cat, total in expenses_by_category
        ]
    }


@app.get("/payments/monthly-stats")
async def get_monthly_stats(
    months: int = 6,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get monthly breakdown of expenses and income for the last N months"""
    try:
        today = date.today()
        monthly_data = []
        
        # Generate list of months to query
        for i in range(months - 1, -1, -1):
            # Calculate target month by going back i months
            year = today.year
            month = today.month - i
            
            # Handle year rollover
            while month <= 0:
                month += 12
                year -= 1
            
            # Get first and last day of the month
            first_day = date(year, month, 1)
            last_day = date(year, month, monthrange(year, month)[1])
        
            # Calculate expenses for this month
            expenses = db.query(
                func.sum(models.Payment.amount)
            ).filter(
                models.Payment.user_id == current_user.id,
                models.Payment.payment_type == 'expense',
                models.Payment.payment_date >= first_day,
                models.Payment.payment_date <= last_day
            ).scalar() or 0
            
            # Calculate income for this month
            income = db.query(
                func.sum(models.Payment.amount)
            ).filter(
                models.Payment.user_id == current_user.id,
                models.Payment.payment_type == 'income',
                models.Payment.payment_date >= first_day,
                models.Payment.payment_date <= last_day
            ).scalar() or 0
            
            monthly_data.append({
                "month": month,
                "year": year,
                "month_name": first_day.strftime("%b"),
                "expenses": float(abs(expenses)),
                "income": float(income)
            })
        
        return {"months": monthly_data}
    
    except Exception as e:
        print(f"Error in monthly-stats: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/payments/stats-with-comparison")
async def get_stats_with_comparison(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment statistics with month-over-month comparison"""
    try:
        today = date.today()
        
        # Current month dates
        current_month_start = date(today.year, today.month, 1)
        current_month_end = today
        
        # Previous month dates
        if today.month == 1:
            prev_month = 12
            prev_year = today.year - 1
        else:
            prev_month = today.month - 1
            prev_year = today.year
        
        prev_month_start = date(prev_year, prev_month, 1)
        prev_month_end = date(prev_year, prev_month, monthrange(prev_year, prev_month)[1])
    
        # Current month expenses
        current_expenses = db.query(
            func.sum(models.Payment.amount)
        ).filter(
            models.Payment.user_id == current_user.id,
            models.Payment.payment_type == 'expense',
            models.Payment.payment_date >= current_month_start,
            models.Payment.payment_date <= current_month_end
        ).scalar() or 0
        
        # Previous month expenses
        prev_expenses = db.query(
            func.sum(models.Payment.amount)
        ).filter(
            models.Payment.user_id == current_user.id,
            models.Payment.payment_type == 'expense',
            models.Payment.payment_date >= prev_month_start,
            models.Payment.payment_date <= prev_month_end
        ).scalar() or 0
        
        # Current month income
        current_income = db.query(
            func.sum(models.Payment.amount)
        ).filter(
            models.Payment.user_id == current_user.id,
            models.Payment.payment_type == 'income',
            models.Payment.payment_date >= current_month_start,
            models.Payment.payment_date <= current_month_end
        ).scalar() or 0
        
        # Previous month income
        prev_income = db.query(
            func.sum(models.Payment.amount)
        ).filter(
            models.Payment.user_id == current_user.id,
            models.Payment.payment_type == 'income',
            models.Payment.payment_date >= prev_month_start,
            models.Payment.payment_date <= prev_month_end
        ).scalar() or 0
        
        # Calculate percentage changes
        expense_change = 0
        if prev_expenses != 0:
            expense_change = ((abs(current_expenses) - abs(prev_expenses)) / abs(prev_expenses)) * 100
        
        income_change = 0
        if prev_income != 0:
            income_change = ((current_income - prev_income) / prev_income) * 100
        
        # Calculate balance change
        current_balance = current_income - abs(current_expenses)
        prev_balance = prev_income - abs(prev_expenses)
        
        balance_change = 0
        if prev_balance != 0:
            balance_change = ((current_balance - prev_balance) / abs(prev_balance)) * 100
        
        # Get expenses by category for current month
        expenses_by_category = db.query(
            models.Payment.category,
            func.sum(models.Payment.amount).label('total')
        ).filter(
            models.Payment.user_id == current_user.id,
            models.Payment.payment_type == 'expense',
            models.Payment.payment_date >= current_month_start,
            models.Payment.payment_date <= current_month_end
        ).group_by(models.Payment.category).all()
        
        return {
            "current_month": {
                "expenses": float(abs(current_expenses)),
                "income": float(current_income),
                "balance": float(current_balance)
            },
            "previous_month": {
                "expenses": float(abs(prev_expenses)),
                "income": float(prev_income),
                "balance": float(prev_balance)
            },
            "changes": {
                "expense_change": round(expense_change, 1),
                "income_change": round(income_change, 1),
                "balance_change": round(balance_change, 1)
            },
            "expenses_by_category": [
                {"category": cat, "total": float(abs(total))}
                for cat, total in expenses_by_category
            ]
        }
    
    except Exception as e:
        print(f"Error in stats-with-comparison: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
    
 # --- Account Type Endpoints ---

@app.get("/account-types", response_model=List[schemas.AccountType])
async def get_account_types(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all account types for the current user"""
    account_types = db.query(models.AccountType).filter(
        models.AccountType.user_id == current_user.id,
        models.AccountType.is_active == True
    ).all()
    return account_types


@app.post("/account-types", response_model=schemas.AccountType)
async def create_account_type(
    account_type_data: schemas.AccountTypeCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new account type"""
    
    # Check if user already has 20 active account types
    active_count = db.query(models.AccountType).filter(
        models.AccountType.user_id == current_user.id,
        models.AccountType.is_active == True
    ).count()
    
    if active_count >= 20:
        raise HTTPException(status_code=400, detail="Maximum of 20 account types reached")
    
    # Check for duplicate name
    existing = db.query(models.AccountType).filter(
        models.AccountType.user_id == current_user.id,
        models.AccountType.name == account_type_data.name,
        models.AccountType.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Account type with this name already exists")
    
    # Create new account type
    new_account_type = models.AccountType(
        user_id=current_user.id,
        name=account_type_data.name,
        is_active=True
    )
    
    db.add(new_account_type)
    db.commit()
    db.refresh(new_account_type)
    
    return new_account_type


@app.put("/account-types/{account_type_id}", response_model=schemas.AccountType)
async def update_account_type(
    account_type_id: int,
    account_type_data: schemas.AccountTypeUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update an account type name"""
    
    account_type = db.query(models.AccountType).filter(
        models.AccountType.id == account_type_id,
        models.AccountType.user_id == current_user.id,
        models.AccountType.is_active == True
    ).first()
    
    if not account_type:
        raise HTTPException(status_code=404, detail="Account type not found")
    
    # Don't allow renaming 'default' or 'cash' (system types)
    if account_type.name in ['default', 'cash']:
        raise HTTPException(status_code=400, detail="Cannot rename system account types")
    
    # Check if new name already exists
    existing = db.query(models.AccountType).filter(
        models.AccountType.user_id == current_user.id,
        models.AccountType.name == account_type_data.name,
        models.AccountType.is_active == True,
        models.AccountType.id != account_type_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Account type with this name already exists")
    
    # Store old name for updating payments
    old_name = account_type.name
    
    # Update the account type name
    account_type.name = account_type_data.name
    
    # Update all payments that use this account type
    db.query(models.Payment).filter(
        models.Payment.user_id == current_user.id,
        models.Payment.account_type == old_name
    ).update({"account_type": account_type_data.name})
    
    db.commit()
    db.refresh(account_type)
    
    return account_type


@app.delete("/account-types/{account_type_id}")
async def delete_account_type(
    account_type_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an account type and update all payments using it to 'default'"""
    
    account_type = db.query(models.AccountType).filter(
        models.AccountType.id == account_type_id,
        models.AccountType.user_id == current_user.id
    ).first()
    
    if not account_type:
        raise HTTPException(status_code=404, detail="Account type not found")
    
    # Don't allow deleting 'default' or 'cash' (system types)
    if account_type.name in ['default', 'cash']:
        raise HTTPException(status_code=400, detail="Cannot delete system account types")
    
    # Update all payments using this account type to 'default'
    db.query(models.Payment).filter(
        models.Payment.user_id == current_user.id,
        models.Payment.account_type == account_type.name
    ).update({"account_type": "default"})
    
    # Soft delete - set is_active to False
    account_type.is_active = False
    db.commit()
    
    return {"message": "Account type deleted successfully"}


# --- Updated Account Member Endpoint ---

@app.put("/account-members/{member_id}", response_model=schemas.AccountMember)
async def update_account_member(
    member_id: int,
    member_data: schemas.AccountMemberUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update an account member's nickname"""
    
    member = db.query(models.AccountMember).filter(
        models.AccountMember.id == member_id,
        models.AccountMember.user_id == current_user.id,
        models.AccountMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Account member not found")
    
    # Check if new nickname already exists
    existing = db.query(models.AccountMember).filter(
        models.AccountMember.user_id == current_user.id,
        models.AccountMember.nickname == member_data.nickname,
        models.AccountMember.is_active == True,
        models.AccountMember.id != member_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Member with this nickname already exists")
    
    # Update the nickname
    member.nickname = member_data.nickname
    db.commit()
    db.refresh(member)
    
    return member


# --- Category Limit Endpoints ---

@app.get("/category-limits", response_model=List[schemas.CategoryLimit])
async def get_category_limits(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all category limits for the current user"""
    limits = db.query(models.CategoryLimit).filter(
        models.CategoryLimit.user_id == current_user.id
    ).all()
    return limits


@app.post("/category-limits", response_model=schemas.CategoryLimit)
async def create_category_limit(
    limit_data: schemas.CategoryLimitCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new category limit"""
    
    # Check if limit already exists for this category
    existing = db.query(models.CategoryLimit).filter(
        models.CategoryLimit.user_id == current_user.id,
        models.CategoryLimit.category == limit_data.category
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Limit for this category already exists")
    
    # Validate amount is positive
    if limit_data.limit_amount <= 0:
        raise HTTPException(status_code=400, detail="Limit amount must be positive")
    
    # Create new limit
    new_limit = models.CategoryLimit(
        user_id=current_user.id,
        category=limit_data.category,
        limit_amount=limit_data.limit_amount
    )
    
    db.add(new_limit)
    db.commit()
    db.refresh(new_limit)
    
    return new_limit


@app.put("/category-limits/{limit_id}", response_model=schemas.CategoryLimit)
async def update_category_limit(
    limit_id: int,
    limit_data: schemas.CategoryLimitUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update a category limit"""
    
    limit = db.query(models.CategoryLimit).filter(
        models.CategoryLimit.id == limit_id,
        models.CategoryLimit.user_id == current_user.id
    ).first()
    
    if not limit:
        raise HTTPException(status_code=404, detail="Category limit not found")
    
    # Validate amount is positive
    if limit_data.limit_amount <= 0:
        raise HTTPException(status_code=400, detail="Limit amount must be positive")
    
    # Update the limit
    limit.limit_amount = limit_data.limit_amount
    limit.updated_at = func.now()
    
    db.commit()
    db.refresh(limit)
    
    return limit


@app.delete("/category-limits/{limit_id}")
async def delete_category_limit(
    limit_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a category limit"""
    
    limit = db.query(models.CategoryLimit).filter(
        models.CategoryLimit.id == limit_id,
        models.CategoryLimit.user_id == current_user.id
    ).first()
    
    if not limit:
        raise HTTPException(status_code=404, detail="Category limit not found")
    
    db.delete(limit)
    db.commit()
    
    return {"message": "Category limit deleted successfully"}

# --- Payment Suggestion Endpoints ---

@app.get("/payment-suggestions", response_model=List[schemas.PaymentSuggestionResponse])
async def get_payment_suggestions(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all pending payment suggestions and generate new ones if needed.
    This checks recurring payments and creates suggestions when they're due.
    """
    try:
        today = date.today()
        
        # First, generate suggestions for any due recurring payments
        generate_suggestions_for_user(current_user.id, db, today)
        
        # Get all pending suggestions with their original payment details
        suggestions = db.query(models.PaymentSuggestion).filter(
            models.PaymentSuggestion.user_id == current_user.id,
            models.PaymentSuggestion.status == 'pending'
        ).all()
        
        # Build response with payment details
        result = []
        for suggestion in suggestions:
            original_payment = suggestion.original_payment
            result.append({
                "id": suggestion.id,
                "user_id": suggestion.user_id,
                "original_payment_id": suggestion.original_payment_id,
                "suggested_date": suggestion.suggested_date,
                "status": suggestion.status,
                "created_at": suggestion.created_at,
                # Original payment details
                "title": original_payment.title,
                "amount": original_payment.amount,
                "category": original_payment.category,
                "payment_type": original_payment.payment_type,
                "recurring_frequency": original_payment.recurring_frequency,
                "account_type": original_payment.account_type
            })
        
        return result
        
    except Exception as e:
        print(f"Error getting suggestions: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/payment-suggestions/{suggestion_id}/accept")
async def accept_payment_suggestion(
    suggestion_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accept a payment suggestion - creates a new payment with today's date
    and marks the suggestion as accepted.
    """
    try:
        # Get the suggestion
        suggestion = db.query(models.PaymentSuggestion).filter(
            models.PaymentSuggestion.id == suggestion_id,
            models.PaymentSuggestion.user_id == current_user.id,
            models.PaymentSuggestion.status == 'pending'
        ).first()
        
        if not suggestion:
            raise HTTPException(status_code=404, detail="Suggestion not found")
        
        # Get original payment
        original_payment = suggestion.original_payment
        
        # Create new payment with today's date
        new_payment = models.Payment(
            user_id=current_user.id,
            account_member_id=original_payment.account_member_id,
            title=original_payment.title,
            category=original_payment.category,
            amount=original_payment.amount,
            payment_type=original_payment.payment_type,
            payment_date=date.today(),  # Use today's date
            is_recurring=original_payment.is_recurring,
            recurring_frequency=original_payment.recurring_frequency,
            account_type=original_payment.account_type
        )
        
        db.add(new_payment)
        
        # Mark suggestion as accepted
        suggestion.status = 'accepted'
        suggestion.updated_at = func.now()
        
        db.commit()
        db.refresh(new_payment)
        
        return {
            "message": "Payment created successfully",
            "payment": new_payment
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error accepting suggestion: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/payment-suggestions/{suggestion_id}/dismiss")
async def dismiss_payment_suggestion(
    suggestion_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dismiss a payment suggestion - marks it as dismissed so it won't show again.
    """
    try:
        # Get the suggestion
        suggestion = db.query(models.PaymentSuggestion).filter(
            models.PaymentSuggestion.id == suggestion_id,
            models.PaymentSuggestion.user_id == current_user.id,
            models.PaymentSuggestion.status == 'pending'
        ).first()
        
        if not suggestion:
            raise HTTPException(status_code=404, detail="Suggestion not found")
        
        # Mark as dismissed
        suggestion.status = 'dismissed'
        suggestion.updated_at = func.now()
        
        db.commit()
        
        return {"message": "Suggestion dismissed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error dismissing suggestion: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Helper function to generate suggestions
def generate_suggestions_for_user(user_id: int, db: Session, today: date):
    """
    Check all recurring payments for a user and create suggestions if they're due.
    """
    # Get all recurring payments for this user
    recurring_payments = db.query(models.Payment).filter(
        models.Payment.user_id == user_id,
        models.Payment.is_recurring == True
    ).all()
    
    for payment in recurring_payments:
        # Calculate when the next payment should be
        next_due_date = calculate_next_due_date(payment, db)
        
        # If it's due (today or past due) and no pending/dismissed suggestion exists, create one
        if next_due_date and next_due_date <= today:
            # Check for ANY existing suggestion (pending OR dismissed) for this payment
            existing_suggestion = db.query(models.PaymentSuggestion).filter(
                models.PaymentSuggestion.user_id == user_id,
                models.PaymentSuggestion.original_payment_id == payment.id,
                models.PaymentSuggestion.suggested_date >= next_due_date  # Check if already suggested for this period
            ).first()
            
            # If no existing suggestion, or last suggestion was accepted (meaning payment was created)
            if not existing_suggestion:
                # Double-check: only create if there's no dismissed suggestion for this due date
                dismissed_suggestion = db.query(models.PaymentSuggestion).filter(
                    models.PaymentSuggestion.user_id == user_id,
                    models.PaymentSuggestion.original_payment_id == payment.id,
                    models.PaymentSuggestion.status == 'dismissed',
                    models.PaymentSuggestion.suggested_date >= next_due_date
                ).first()
                
                if not dismissed_suggestion:
                    # Create new suggestion
                    new_suggestion = models.PaymentSuggestion(
                        user_id=user_id,
                        original_payment_id=payment.id,
                        suggested_date=today,
                        status='pending'
                    )
                    db.add(new_suggestion)
    
    db.commit()


def calculate_next_due_date(payment: models.Payment, db: Session) -> date:
    """
    Calculate when the next occurrence of a recurring payment should be,
    based on the last time it was added.
    """
    # Find the most recent payment with same title, category, and amount
    # This includes both the original and any copies created from suggestions
    last_payment = db.query(models.Payment).filter(
        models.Payment.user_id == payment.user_id,
        models.Payment.title == payment.title,
        models.Payment.category == payment.category,
        models.Payment.payment_type == payment.payment_type,
        models.Payment.is_recurring == True
    ).order_by(models.Payment.payment_date.desc()).first()
    
    if not last_payment:
        return None
    
    last_date = last_payment.payment_date
    frequency = payment.recurring_frequency
    
    # Calculate next due date based on frequency
    if frequency == 'daily':
        next_due = last_date + timedelta(days=1)
    elif frequency == 'weekly':
        next_due = last_date + timedelta(days=7)
    elif frequency == 'monthly':
        # Add one month
        if last_date.month == 12:
            next_due = last_date.replace(year=last_date.year + 1, month=1)
        else:
            next_due = last_date.replace(month=last_date.month + 1)
    elif frequency == 'yearly':
        next_due = last_date.replace(year=last_date.year + 1)
    else:
        return None
    
    return next_due


def get_period_key(payment_date: date, frequency: str) -> str:
    """
    Generate a unique key for each payment period to track dismissals.
    This ensures dismissed suggestions don't reappear for the same period.
    """
    if frequency == 'daily':
        return payment_date.strftime('%Y-%m-%d')
    elif frequency == 'weekly':
        # Week number in year
        return payment_date.strftime('%Y-W%W')
    elif frequency == 'monthly':
        # Year and month
        return payment_date.strftime('%Y-%m')
    elif frequency == 'yearly':
        # Just the year
        return str(payment_date.year)
    return payment_date.strftime('%Y-%m-%d')


# Helper function to generate suggestions
def generate_suggestions_for_user(user_id: int, db: Session, today: date):
    """
    Check all recurring payments for a user and create suggestions if they're due.
    Only creates suggestions if no pending/dismissed suggestion exists for this period.
    """
    # Get all recurring payments for this user
    recurring_payments = db.query(models.Payment).filter(
        models.Payment.user_id == user_id,
        models.Payment.is_recurring == True
    ).all()
    
    for payment in recurring_payments:
        # Calculate when the next payment should be
        next_due_date = calculate_next_due_date(payment, db)
        
        # If it's due (today or past due), check if we should create a suggestion
        if next_due_date and next_due_date <= today:
            # Get period key for this due date
            period_key = get_period_key(next_due_date, payment.recurring_frequency)
            
            # Check if ANY suggestion exists for this payment in this period
            # (regardless of status - pending, accepted, or dismissed)
            existing_suggestion = db.query(models.PaymentSuggestion).filter(
                models.PaymentSuggestion.user_id == user_id,
                models.PaymentSuggestion.original_payment_id == payment.id,
                models.PaymentSuggestion.suggested_date >= next_due_date
            ).first()
            
            # Only create if no suggestion exists for this period
            if not existing_suggestion:
                # Create new suggestion
                new_suggestion = models.PaymentSuggestion(
                    user_id=user_id,
                    original_payment_id=payment.id,
                    suggested_date=today,
                    status='pending'
                )
                db.add(new_suggestion)
    
    db.commit()

    # --- Savings Account Endpoints ---

@app.get("/savings-accounts", response_model=List[schemas.SavingsAccountResponse])
async def get_savings_accounts(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all savings account templates for the current user"""
    accounts = db.query(models.SavingsAccount).filter(
        models.SavingsAccount.user_id == current_user.id,
        models.SavingsAccount.is_active == True
    ).all()
    return accounts


@app.post("/savings-accounts", response_model=schemas.SavingsAccountResponse)
async def create_savings_account(
    account_data: schemas.SavingsAccountCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new savings account template"""
    
    # Check if user already has 50 active savings accounts
    active_count = db.query(models.SavingsAccount).filter(
        models.SavingsAccount.user_id == current_user.id,
        models.SavingsAccount.is_active == True
    ).count()
    
    if active_count >= 50:
        raise HTTPException(status_code=400, detail="Maximum of 50 savings accounts reached")
    
    # Create new savings account
    new_account = models.SavingsAccount(
        user_id=current_user.id,
        **account_data.model_dump()
    )
    
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    
    return new_account


@app.put("/savings-accounts/{account_id}", response_model=schemas.SavingsAccountResponse)
async def update_savings_account(
    account_id: int,
    account_data: schemas.SavingsAccountUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update a savings account template"""
    
    account = db.query(models.SavingsAccount).filter(
        models.SavingsAccount.id == account_id,
        models.SavingsAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Savings account not found")
    
    # Update fields
    update_data = account_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(account, field, value)
    
    db.commit()
    db.refresh(account)
    
    return account


@app.delete("/savings-accounts/{account_id}")
async def delete_savings_account(
    account_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete a savings account template"""
    
    account = db.query(models.SavingsAccount).filter(
        models.SavingsAccount.id == account_id,
        models.SavingsAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Savings account not found")
    
    # Soft delete
    account.is_active = False
    db.commit()
    
    return {"message": "Savings account deleted successfully"}


# --- Savings Goal Endpoints ---

@app.get("/savings-goals", response_model=List[schemas.SavingsGoalResponse])
async def get_savings_goals(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all savings goals for the current user"""
    goals = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.user_id == current_user.id
    ).all()
    return goals


@app.post("/savings-goals", response_model=schemas.SavingsGoalResponse)
async def create_savings_goal(
    goal_data: schemas.SavingsGoalCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new savings goal"""
    
    # Verify account_member_id if provided
    if goal_data.account_member_id:
        member = db.query(models.AccountMember).filter(
            models.AccountMember.id == goal_data.account_member_id,
            models.AccountMember.user_id == current_user.id,
            models.AccountMember.is_active == True
        ).first()
        
        if not member:
            raise HTTPException(status_code=400, detail="Invalid account member")
    
    # Verify savings_account_id if provided
    if goal_data.savings_account_id:
        savings_account = db.query(models.SavingsAccount).filter(
            models.SavingsAccount.id == goal_data.savings_account_id,
            models.SavingsAccount.user_id == current_user.id,
            models.SavingsAccount.is_active == True
        ).first()
        
        if not savings_account:
            raise HTTPException(status_code=400, detail="Invalid savings account")
    
    # Create new goal
    new_goal = models.SavingsGoal(
        user_id=current_user.id,
        **goal_data.model_dump()
    )
    
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    
    return new_goal


@app.put("/savings-goals/{goal_id}", response_model=schemas.SavingsGoalResponse)
async def update_savings_goal(
    goal_id: int,
    goal_data: schemas.SavingsGoalUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update a savings goal"""
    
    goal = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.id == goal_id,
        models.SavingsGoal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    
    # Update fields
    update_data = goal_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)
    
    db.commit()
    db.refresh(goal)
    
    return goal


@app.delete("/savings-goals/{goal_id}")
async def delete_savings_goal(
    goal_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a savings goal"""
    
    goal = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.id == goal_id,
        models.SavingsGoal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    
    db.delete(goal)
    db.commit()
    
    return {"message": "Savings goal deleted successfully"}


# --- Savings Deposit Endpoints ---

@app.get("/savings-goals/{goal_id}/deposits", response_model=List[schemas.SavingsDepositResponse])
async def get_savings_deposits(
    goal_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all deposits/withdrawals for a specific savings goal"""
    
    # Verify goal belongs to user
    goal = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.id == goal_id,
        models.SavingsGoal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    
    deposits = db.query(models.SavingsDeposit).filter(
        models.SavingsDeposit.savings_goal_id == goal_id
    ).order_by(models.SavingsDeposit.transaction_date.desc()).all()
    
    return deposits


@app.post("/savings-deposits", response_model=schemas.SavingsDepositResponse)
async def create_savings_deposit(
    deposit_data: schemas.SavingsDepositCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Add a deposit or withdrawal to a savings goal"""
    
    # Verify goal belongs to user
    goal = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.id == deposit_data.savings_goal_id,
        models.SavingsGoal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    
    # Verify account_member_id if provided
    if deposit_data.account_member_id:
        member = db.query(models.AccountMember).filter(
            models.AccountMember.id == deposit_data.account_member_id,
            models.AccountMember.user_id == current_user.id,
            models.AccountMember.is_active == True
        ).first()
        
        if not member:
            raise HTTPException(status_code=400, detail="Invalid account member")
    
    # Ensure amount is positive for deposits, negative for withdrawals
    amount = deposit_data.amount
    if deposit_data.transaction_type == 'deposit':
        amount = abs(amount)
    elif deposit_data.transaction_type == 'withdrawal':
        amount = -abs(amount)
    
    # Create new deposit
    new_deposit = models.SavingsDeposit(
        savings_goal_id=deposit_data.savings_goal_id,
        account_member_id=deposit_data.account_member_id,
        amount=amount,
        transaction_type=deposit_data.transaction_type,
        transaction_date=deposit_data.transaction_date,
        notes=deposit_data.notes
    )
    
    db.add(new_deposit)
    
    # Update goal's updated_at timestamp
    goal.updated_at = func.now()
    
    db.commit()
    db.refresh(new_deposit)
    
    return new_deposit


@app.delete("/savings-deposits/{deposit_id}")
async def delete_savings_deposit(
    deposit_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a savings deposit/withdrawal"""
    
    deposit = db.query(models.SavingsDeposit).filter(
        models.SavingsDeposit.id == deposit_id
    ).first()
    
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    
    # Verify the goal belongs to the user
    goal = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.id == deposit.savings_goal_id,
        models.SavingsGoal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    
    db.delete(deposit)
    
    # Update goal's updated_at timestamp
    goal.updated_at = func.now()
    
    db.commit()
    
    return {"message": "Deposit deleted successfully"}


# --- Savings Stats Endpoint ---

@app.get("/savings-stats")
async def get_savings_stats(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get overall savings statistics"""
    
    goals = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.user_id == current_user.id
    ).all()
    
    total_target = sum(float(goal.target_amount) for goal in goals)
    total_saved = sum(goal.current_amount for goal in goals)
    completed_goals = sum(1 for goal in goals if goal.is_completed)
    active_goals = len(goals) - completed_goals
    
    return {
        "total_goals": len(goals),
        "active_goals": active_goals,
        "completed_goals": completed_goals,
        "total_target": total_target,
        "total_saved": total_saved,
        "overall_progress": (total_saved / total_target * 100) if total_target > 0 else 0
    }