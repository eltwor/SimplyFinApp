from sqlalchemy import Column, Integer, String, DateTime, Numeric, Date, ForeignKey, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    nickname = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    payments = relationship("Payment", back_populates="user")
    account_members = relationship("AccountMember", back_populates="user", cascade="all, delete-orphan")
    account_types = relationship("AccountType", back_populates="user", cascade="all, delete-orphan")
    category_limits = relationship("CategoryLimit", back_populates="user", cascade="all, delete-orphan")
    savings_goals = relationship("SavingsGoal", back_populates="user", cascade="all, delete-orphan")
    savings_accounts = relationship("SavingsAccount", back_populates="user", cascade="all, delete-orphan")

class AccountMember(Base):
    __tablename__ = "account_members"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    nickname = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="account_members")
    payments = relationship("Payment", back_populates="account_member")
    savings_goals = relationship("SavingsGoal", back_populates="account_member")
    savings_deposits = relationship("SavingsDeposit", back_populates="account_member")

class AccountType(Base):
    __tablename__ = "account_types"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="account_types")

class CategoryLimit(Base):
    __tablename__ = "category_limits"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)
    limit_amount = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="category_limits")

class PaymentSuggestion(Base):
    __tablename__ = "payment_suggestions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_payment_id = Column(Integer, ForeignKey("payments.id", ondelete="CASCADE"), nullable=False)
    suggested_date = Column(Date, nullable=False)
    status = Column(String(20), default='pending', nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    original_payment = relationship("Payment")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    account_member_id = Column(Integer, ForeignKey("account_members.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_type = Column(String, nullable=False)
    payment_date = Column(Date, nullable=False)
    is_recurring = Column(Boolean, default=False, nullable=False)
    recurring_frequency = Column(String, nullable=True)
    account_type = Column(String(50), default='default', nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="payments")
    account_member = relationship("AccountMember", back_populates="payments")
    
    @property
    def member_nickname(self):
        if self.account_member:
            return self.account_member.nickname
        return self.user.nickname

# NEW: Savings Account Template
class SavingsAccount(Base):
    __tablename__ = "savings_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)  # e.g., "ING Savings Account"
    bank_name = Column(String(200), nullable=False)
    account_type = Column(String(100), nullable=False)  # e.g., "Standard Savings", "Fixed Term"
    interest_rate = Column(Numeric(5, 2), default=0.00, nullable=False)  # Annual percentage
    start_date = Column(Date, nullable=False)
    maturity_date = Column(Date, nullable=True)  # For fixed term deposits
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="savings_accounts")
    savings_goals = relationship("SavingsGoal", back_populates="savings_account")

# NEW: Savings Goal
class SavingsGoal(Base):
    __tablename__ = "savings_goals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    account_member_id = Column(Integer, ForeignKey("account_members.id", ondelete="SET NULL"), nullable=True)
    savings_account_id = Column(Integer, ForeignKey("savings_accounts.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(200), nullable=False)
    target_amount = Column(Numeric(10, 2), nullable=False)
    deadline = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="savings_goals")
    account_member = relationship("AccountMember", back_populates="savings_goals")
    savings_account = relationship("SavingsAccount", back_populates="savings_goals")
    deposits = relationship("SavingsDeposit", back_populates="savings_goal", cascade="all, delete-orphan")
    
    @property
    def current_amount(self):
        """Calculate current amount from all deposits and withdrawals"""
        total = sum(deposit.amount for deposit in self.deposits)
        return float(total)
    
    @property
    def progress_percentage(self):
        """Calculate progress percentage"""
        if self.target_amount == 0:
            return 0
        return min(100, (self.current_amount / float(self.target_amount)) * 100)

# NEW: Savings Deposit/Withdrawal Transaction
class SavingsDeposit(Base):
    __tablename__ = "savings_deposits"
    
    id = Column(Integer, primary_key=True, index=True)
    savings_goal_id = Column(Integer, ForeignKey("savings_goals.id", ondelete="CASCADE"), nullable=False)
    account_member_id = Column(Integer, ForeignKey("account_members.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)  # Positive for deposit, negative for withdrawal
    transaction_type = Column(String(20), nullable=False)  # 'deposit' or 'withdrawal'
    transaction_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    savings_goal = relationship("SavingsGoal", back_populates="deposits")
    account_member = relationship("AccountMember", back_populates="savings_deposits")
    
    @property
    def member_nickname(self):
        if self.account_member:
            return self.account_member.nickname
        return None