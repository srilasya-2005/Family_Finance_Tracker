from flask_sqlalchemy import SQLAlchemy
import datetime

db=SQLAlchemy()

# User Model
class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    family_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)  # Hashed password
    phone = db.Column(db.String(15), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="super_user")
    privilege = db.Column(db.String(20), default="edit")
    approved_by = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    status = db.Column(db.String(20), default="pending")
    created_on = db.Column(db.DateTime, default=db.func.current_timestamp())

class Category(db.Model):
    __tablename__ = 'category'
    category_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    category_desc = db.Column(db.String(255), nullable=True)
    expenses = db.relationship('Expense', backref='category', lazy=True)
    budgets = db.relationship('Budget', backref='category', lazy=True)

class Expense(db.Model):
    __tablename__ = 'expense'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id= db.Column(db.Integer,nullable=True)
    name = db.Column(db.String(255), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.category_id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.Text)
    image_data = db.Column(db.LargeBinary)
    file_type = db.Column(db.String(50))
    created_on = db.Column(db.DateTime, default=db.func.current_timestamp())

class Budget(db.Model):
    __tablename__ = 'budget'
    user_id= db.Column(db.Integer,nullable=True)
    budget_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    category_id = db.Column(db.Integer, db.ForeignKey('category.category_id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    recurring = db.Column(db.Boolean, default=False)
    created_on = db.Column(db.DateTime, default=db.func.current_timestamp())

class SavingCategory(db.Model):
    __tablename__ = 'saving_category'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    savings_targets = db.relationship('SavingsTarget', backref='saving_category', lazy=True)

class SavingsTarget(db.Model):
    __tablename__ = 'savings_target'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('saving_category.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    target_date = db.Column(db.Date, nullable=True)
    created_on = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    savings = db.relationship('Savings', backref='savings_target', lazy=True)

class Savings(db.Model):
    __tablename__ = 'savings'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    target_id = db.Column(db.Integer, db.ForeignKey('savings_target.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    mode = db.Column(db.String(50), nullable=True)
    date = db.Column(db.Date, default=datetime.datetime.utcnow)

class Family(db.Model):
    __tablename__ = 'family'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    count = db.Column(db.Integer, nullable=False)
    cost_per_member = db.Column(db.Integer, nullable=False)

