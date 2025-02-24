from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Category(db.Model):
    __tablename__ = 'category'
    category_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    category_desc = db.Column(db.String(255), nullable=True)  # Ensure this column exists

    expenses = db.relationship('Expense', backref='category', lazy=True)

class Expense(db.Model):
    __tablename__ = 'expense'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.category_id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    date = db.Column(db.Date, nullable=False)  # Ensure only the date is stored
    description = db.Column(db.Text)
    image_data = db.Column(db.LargeBinary)  # Add this line to store image data
    file_type = db.Column(db.String(50))  # Add this line to store the file type
    created_on = db.Column(db.DateTime, default=db.func.current_timestamp())
