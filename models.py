from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Expense(db.Model):
    """Expense model representing financial expenses."""
    id = db.Column(db.Integer, primary_key=True)  # Unique identifier
    name = db.Column(db.String(100), nullable=False)  # Expense name
    category = db.Column(db.String(50), nullable=False)  # Category
    date = db.Column(db.String(10), nullable=False)  # Date (YYYY-MM-DD)
    amount = db.Column(db.Float, nullable=False)  # Amount spent
    description = db.Column(db.Text, nullable=True)  # Optional description
    file_name = db.Column(db.String(255), nullable=True)  # Store uploaded file name

    def __repr__(self):
        return f"<Expense {self.name} - {self.amount}>"

