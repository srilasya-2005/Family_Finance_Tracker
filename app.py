from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = "uploads"

from models import db, Expense

with app.app_context():
    db.init_app(app)
    db.create_all()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/add_expense", methods=["POST"])
def add_expense():
    data = request.form.to_dict()

    name = data.get("name")
    category = data.get("category")
    date = data.get("date")
    amount = data.get("amount")
    description = data.get("description", "")
    file_name = None

    if not name or not category or not date or not amount:
        return jsonify({"message": "Missing required fields!"}), 400

    try:
        amount = float(amount)
    except ValueError:
        return jsonify({"message": "Invalid amount!"}), 400

    file = request.files.get("file-upload")
    if file and file.filename:
        os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
        file.save(file_path)
        file_name = file.filename

    new_expense = Expense(name=name, category=category, date=date, amount=amount, description=description, file_name=file_name)
    db.session.add(new_expense)
    db.session.commit()

    return jsonify({"message": "Expense added successfully!"})

@app.route("/get_expenses")
def get_expenses():
    expenses = Expense.query.all()
    return jsonify([{
        "id": exp.id, "name": exp.name, "category": exp.category, "date": exp.date,
        "amount": exp.amount, "description": exp.description, "file_name": exp.file_name
    } for exp in expenses])

@app.route("/edit_expense/<int:expense_id>", methods=["PUT"])
def edit_expense(expense_id):
    expense = Expense.query.get(expense_id)

    if not expense:
        return jsonify({"message": "Expense not found"}), 404

    data = request.form.to_dict()

    expense.name = data.get("name", expense.name)
    expense.category = data.get("category", expense.category)
    expense.date = data.get("date", expense.date)
    expense.amount = float(data.get("amount", expense.amount))
    expense.description = data.get("description", expense.description)

    file = request.files.get("file-upload")
    if file and file.filename:
        os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
        file.save(file_path)
        expense.file_name = file.filename  # Update file name in the database

    db.session.commit()

    return jsonify({"message": "Expense updated successfully!"})


@app.route("/delete_expense/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    expense = Expense.query.get(expense_id)

    if not expense:
        return jsonify({"message": "Expense not found"}), 404

    db.session.delete(expense)
    db.session.commit()

    return jsonify({"message": "Expense deleted successfully!"})

if __name__ == "__main__":
    app.run(debug=True)
