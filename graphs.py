from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, send_file, Response
from models import db, Expense, Category, Budget, User,Family,SavingCategory, SavingsTarget, Savings
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta,timezone
from io import BytesIO
import base64
import matplotlib
import matplotlib.pyplot as plt
import pandas as pd
import random, string, os,re, calendar
import io
import plotly.graph_objects as go 
import numpy as np

matplotlib.use('Agg')

def create_bar_chart():
    families = Family.query.all()
    names = [family.name for family in families]
    counts = [family.count for family in families]
    bills = [family.count * family.cost_per_member for family in families]

    plt.figure(figsize=(6, 3))
    bars = plt.bar(names, counts, color='skyblue')
    plt.xlabel("Family Name")
    plt.ylabel("Number of Members")
    plt.title("Family Members and Monthly Bills")

    for i, bar in enumerate(bars):
        family_members = counts[i]
        bar_x = bar.get_x()
        bar_width = bar.get_width()
        
        for j in range(1, family_members):
            plt.plot([bar_x, bar_x + bar_width], [j, j], color='black', linestyle='--')

        plt.text(bar_x + bar_width / 2, family_members + 0.2, f'₹{bills[i]:,}', 
                 ha='center', fontsize=10, color='black')
        
    plt.tight_layout()
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png')
    img_buffer.seek(0)
    plt.close()
    return base64.b64encode(img_buffer.getvalue()).decode('utf-8')

def generate_monthly_expenses_plot(user_id=None):
    # Initialize the base query
    query = db.session.query(
        db.func.strftime('%Y-%m', Expense.date).label('month'),
        db.func.sum(Expense.amount).label('total_expense')
    ).group_by('month').order_by('month')

    # Filter by user_id if provided
    if user_id:
        user = User.query.get(session['user_id'])
        if user.role == "family_member":
            user_id = user.approved_by  # Use the super_user's ID
        else:
            user_id = user.id 
        query = query.filter(Expense.user_id == user_id)

    # Execute the query
    monthly_expenses = query.all()

    # Extract data for plotting
    months = [row.month for row in monthly_expenses]
    expenses = [float(row.total_expense) for row in monthly_expenses]

    # Generate the plot
    plt.figure(figsize=(8, 5))
    plt.plot(months, expenses, marker='o', linestyle='-', color='b')
    plt.xlabel('Month')
    plt.ylabel('Total Expense')
    plt.title('Monthly Expenses')
    plt.xticks(rotation=90)
    plt.grid()
    plt.tight_layout()

    # Save the plot to a BytesIO object
    img = io.BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    plt.close()

    # Return the plot as a base64-encoded string
    return base64.b64encode(img.getvalue()).decode()

def generate_category_expenses_plot(year, month,user_id=None,):
    query = db.session.query(
        Category.name,
        db.func.sum(Expense.amount).label('total_expense')
    ).join(Expense, Category.category_id == Expense.category_id).filter(
        db.func.strftime('%Y', Expense.date) == str(year)
    ).filter(
        db.func.strftime('%m', Expense.date) == f'{month:02d}'
    ).group_by(Category.name)

    # Filter by user_id if provided
    if user_id:
        user = User.query.get(session['user_id'])
        if user.role == "family_member":
            user_id = user.approved_by  # Use the super_user's ID
        else:
            user_id = user.id 
        query = query.filter(Expense.user_id == user_id)

    # Execute the query
    category_expenses = query.all()

    # Extract data for plotting
    categories = [row.name for row in category_expenses]
    expenses = [float(row.total_expense) for row in category_expenses]

    # Generate the plot
    plt.figure(figsize=(8, 5))
    plt.bar(categories, expenses, color='orange')
    plt.xlabel('Category')
    plt.ylabel('Total Expense')
    plt.title(f'Expenses by Category for {year}-{month:02d}')
    plt.xticks(rotation=45)
    plt.tight_layout()

    # Save the plot to a BytesIO object
    img = io.BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    plt.close()

    # Return the plot as a base64-encoded string
    return base64.b64encode(img.getvalue()).decode()


def generate_pie_chart(user_id=None, month=None, year=None):
    if month is None or year is None:
        today = datetime.today()
        month, year = today.month, today.year

    # Query for budget data
    budget_query = db.session.query(
        Category.name,
        db.func.sum(Budget.amount).label('total_budget')
    ).join(Budget, Category.category_id == Budget.category_id).filter(
        Budget.month == month
    ).filter(
        Budget.year == year
    )

    # Filter by user_id if provided
    if user_id:
        user = User.query.get(session['user_id'])
        if user.role == "family_member":
            user_id = user.approved_by  # Use the super_user's ID
        else:
            user_id = user.id 
        budget_query = budget_query.filter(Budget.user_id == user_id)

    budget_data = budget_query.group_by(Category.name).all()

    # Query for expense data
    expense_query = db.session.query(
        Category.name,
        db.func.sum(Expense.amount).label('total_expense')
    ).join(Expense, Category.category_id == Expense.category_id).filter(
        db.func.strftime('%m', Expense.date) == f'{month:02d}'
    ).filter(
        db.func.strftime('%Y', Expense.date) == str(year)
    )

    # Filter by user_id if provided
    if user_id:
        user = User.query.get(session['user_id'])
        if user.role == "family_member":
            user_id = user.approved_by  # Use the super_user's ID
        else:
            user_id = user.id 
        expense_query = expense_query.filter(Expense.user_id == user_id)

    expense_data = expense_query.group_by(Category.name).all()

    # Extract data for plotting
    categories_budget = [row.name for row in budget_data]
    budget_amounts = [float(row.total_budget) for row in budget_data]

    categories_expense = [row.name for row in expense_data]
    expense_amounts = [float(row.total_expense) for row in expense_data]

    # Generate the plot
    fig, axs = plt.subplots(1, 2, figsize=(12, 6))

    if budget_amounts:
        axs[0].pie(budget_amounts, labels=categories_budget, autopct='%1.1f%%', startangle=140)
        axs[0].set_title('Planned Budget')
    else:
        axs[0].text(0.5, 0.5, "No Data", fontsize=15, ha='center')

    if expense_amounts:
        axs[1].pie(expense_amounts, labels=categories_expense, autopct='%1.1f%%', startangle=140)
        axs[1].set_title('Actual Expenses')
    else:
        axs[1].text(0.5, 0.5, "No Data", fontsize=15, ha='center')
    
    # Save the plot to a BytesIO object
    img = io.BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    plt.close()

    # Return the plot as a base64-encoded string
    return base64.b64encode(img.getvalue()).decode()

def generate_bar_chart(user_id=None, month=None, year=None):
    if month is None or year is None:
        today = datetime.today()
        month, year = today.month, today.year

    # Query to get budget and expense data for the user
    query = db.session.query(
        Category.name,
        db.func.sum(Budget.amount).label('total_budget'),
        db.func.sum(Expense.amount).label('total_expense')
    ).join(Budget, Category.category_id == Budget.category_id, isouter=True).join(
        Expense, Category.category_id == Expense.category_id, isouter=True
    ).filter(
        db.func.strftime('%m', Expense.date) == f'{month:02d}'
    ).filter(
        db.func.strftime('%Y', Expense.date) == str(year)
    )

    # Filter by user_id if provided
    if user_id:
        user = User.query.get(session['user_id'])
        if user.role == "family_member":
            user_id = user.approved_by  # Use the super_user's ID
        else:
            user_id = user.id 
        query = query.filter(Budget.user_id == user_id).filter(Expense.user_id == user_id)

    # Group by category and execute the query
    data = query.group_by(Category.name).all()

    # Calculate total budget and total expense
    total_budget = sum(row[1] for row in data) if data else 0
    total_expense = sum(row[2] for row in data) if data else 0

    # Generate the plot
    fig, ax = plt.subplots(figsize=(12, 6))  # Make it wider

    if not data or all(row[1] == 0 and row[2] == 0 for row in data):
        ax.text(0.5, 0.5, "No Data Available", fontsize=15, ha='center', va='center')
    else:
        categories = [row[0] for row in data]
        budgets = [row[1] for row in data]
        expenses = [row[2] for row in data]
        x_indexes = range(len(categories))

        # Plot budget and expense bars
        ax.barh(x_indexes, budgets, height=0.8, color='aqua', label="Budget", alpha=0.6)
        ax.barh(x_indexes, expenses, height=0.8, color='red', label="Expense", alpha=0.6)

        # Customize the plot
        ax.set_yticks(x_indexes)
        ax.set_yticklabels(categories)
        ax.set_xlabel("Amount")
        ax.set_title(f"Spending Progress by Category ({month}/{year})")
        ax.legend()

        # Add a legend with total budget and total expense
        legend_text = f"Total Budget: Rs.{total_budget:,.2f}\nTotal Spent: Rs.{total_expense:,.2f}"
        ax.text(1.05, 0.98, legend_text, transform=ax.transAxes, fontsize=12, verticalalignment='top',
                bbox=dict(facecolor='white', edgecolor='black', boxstyle='round,pad=0.5'))

    # Save the plot to a BytesIO object
    img = io.BytesIO()
    plt.savefig(img, format="png", bbox_inches="tight")
    img.seek(0)
    plt.close()

    # Return the plot as a base64-encoded string
    return base64.b64encode(img.getvalue()).decode()

def generate_stacked_bar_chart(user_id=None, month=None, year=None):
    if month is None or year is None:
        today = datetime.today()
        month, year = today.month, today.year

    # Query to get expenses by family members and categories
    query = db.session.query(
        User.username,
        Category.name,
        db.func.sum(Expense.amount).label('total_expense')
    ).join(Expense, User.id == Expense.user_id).join(
        Category, Expense.category_id == Category.category_id
    ).filter(
        db.func.strftime('%m', Expense.date) == f'{month:02d}'
    ).filter(
        db.func.strftime('%Y', Expense.date) == str(year)
    )

    # Filter by user_id if provided
    if user_id:
        user = User.query.get(session['user_id'])
        if user.role == "family_member":
            user_id = user.approved_by  # Use the super_user's ID
        else:
            user_id = user.id 
        query = query.filter(Expense.user_id == user_id)

    # Group by username and category, then execute the query
    data = query.group_by(User.username, Category.name).all()

    # Convert to a DataFrame
    df = pd.DataFrame(data, columns=['username', 'category', 'total_expense'])

    if df.empty:
        print("❗ No expense data found for this month and year. Returning empty plot.")
        return None  # Return None to indicate no data

    # Pivot the DataFrame for stacked bar chart
    df_pivot = df.pivot(index='username', columns='category', values='total_expense').fillna(0)

    # Ensure numeric values
    df_pivot = df_pivot.apply(pd.to_numeric, errors='coerce').fillna(0)

    # Generate the plot
    plt.figure(figsize=(12, 6))
    df_pivot.plot(kind='bar', stacked=True, colormap='Set2', edgecolor='black')
    plt.xlabel('Family Members')
    plt.ylabel('Total Expense')
    plt.title(f"Family Members' Expenses by Category for {month}/{year}")
    plt.xticks(rotation=0)
    plt.legend(title='Category', bbox_to_anchor=(1.05, 1), loc='upper left')

    # Save the plot to a BytesIO object
    img = io.BytesIO()
    plt.savefig(img, format='png', bbox_inches='tight')
    img.seek(0)
    plt.close()

    # Return the plot as a base64-encoded string
    return base64.b64encode(img.getvalue()).decode()

def generate_line_chart(year=None, user_id=None):
    # Query to get budget and expense data for the year
    query = db.session.query(
        db.func.strftime('%m', Expense.date).label('month'),
        db.func.sum(Budget.amount).label('total_budget'),
        db.func.sum(Expense.amount).label('total_expense')
    ).join(
        Budget, (Budget.category_id == Expense.category_id) & 
                (Budget.month == db.func.strftime('%m', Expense.date)), isouter=True
    ).filter(
        db.func.strftime('%Y', Expense.date) == str(year)
    )
    

    # Filter by user_id if provided
    if user_id:
        user = User.query.get(session['user_id'])
        if user.role == "family_member":
            user_id = user.approved_by  # Use the super_user's ID
        else:
            user_id = user.id 
        query = query.filter(Budget.user_id == user_id).filter(Expense.user_id == user_id)

    # Group by month and execute the query
    data = query.group_by(func.strftime('%m', Expense.date)).order_by(func.strftime('%m', Expense.date)).all()

    
    # Convert data to DataFrame
    df = pd.DataFrame(data, columns=['Month', 'TotalBudget', 'TotalExpense'])

    # Handle empty data
    if df.empty:
        print("❗ No expense data found for this month and year. Returning empty plot.")
        return None

    # Aggregate duplicate months and remove duplicate indices
    df = df.groupby('Month', as_index=False).sum()
    df = df[~df.index.duplicated(keep='first')]

    # Fill missing months with zero
    all_months = [f"{i:02d}" for i in range(1, 13)]
    df = df.set_index('Month').reindex(all_months, fill_value=0).reset_index()

    # Convert to numeric and handle NaN
    df[['TotalBudget', 'TotalExpense']] = df[['TotalBudget', 'TotalExpense']].apply(pd.to_numeric, errors='coerce').fillna(0)

    # Plot the data
    months = df['Month'].tolist()
    total_budget = df['TotalBudget'].tolist()
    total_expense = df['TotalExpense'].tolist()

    plt.figure(figsize=(12, 6))
    plt.plot(months, total_budget, label='Budget', marker='o', linestyle='-', color='#007bff', linewidth=2)
    plt.plot(months, total_expense, label='Expense', marker='o', linestyle='-', color='#ffa500', linewidth=2)

    # Add month names as labels
    month_labels = [calendar.month_abbr[int(month)] for month in months]
    plt.xticks(range(len(months)), month_labels)

    # Set y-axis limits with some buffer
    max_value = max(max(total_budget), max(total_expense))
    plt.ylim(0, max_value * 1.1 if max_value > 0 else 1)

    plt.xlabel('Month')
    plt.ylabel('Amount')
    plt.title(f'Budget vs. Expense by Month ({year})')
    plt.legend()
    plt.grid(color='gray', linestyle='--', linewidth=0.5)

    # Save plot as image and return base64-encoded string
    img = io.BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    plt.close()

    return base64.b64encode(img.getvalue()).decode()

#Bar graph
def plot_savings_progress(user_id=None):  # Main bar graph
    family_group_user_ids = []  # To hold all user_ids to filter on

    # Check if user is logged in
    if 'user_id' in session:
        user = User.query.get(session['user_id'])

        if not user:
            return "<div style='text-align:center;'><h3>No Data Available</h3></div>"

        if user.role == "family_member":
            # Family member: include self + their superuser + other family members under same superuser
            superuser_id = user.approved_by
            family_members = User.query.filter_by(approved_by=superuser_id).all()
            family_group_user_ids = [fm.id for fm in family_members] + [superuser_id]
        else:
            # Superuser: include self + family members they approved
            family_members = User.query.filter_by(approved_by=user.id).all()
            family_group_user_ids = [fm.id for fm in family_members] + [user.id]
    else:
        # If not logged in, return 'no data'
        return "<div style='text-align:center;'><h3>No Data Available</h3></div>"

    # Now apply filter to query only for these user IDs
    query = db.session.query(
        SavingCategory.name.label('category'),
        db.func.coalesce(db.func.sum(SavingsTarget.amount), 0).label('target_savings'),
        db.func.coalesce(db.func.sum(Savings.amount), 0).label('actual_savings')
    ).outerjoin(SavingsTarget, SavingCategory.id == SavingsTarget.category_id)\
     .outerjoin(Savings, SavingsTarget.id == Savings.target_id)\
     .filter(SavingsTarget.user_id.in_(family_group_user_ids))  # Filter for family group

    # Group and execute query
    data = query.group_by(SavingCategory.name).all()

    # If no data found, return 'no data' image
    if not data:
        return "<div style='text-align:center;'><h3>No Data Available</h3></div>"

    # Extract data for plotting
    categories = [row.category for row in data]
    target_savings = [row.target_savings for row in data]
    actual_savings = [row.actual_savings for row in data]

    # Plotting
    x = np.arange(len(categories))
    width = 0.35

    plt.figure(figsize=(10, 6))
    bars1 = plt.bar(x - width/2, target_savings, width, color='gray', label='Target Savings')
    bars2 = plt.bar(x + width/2, actual_savings, width, color='blue', label='Actual Savings')

    plt.xlabel('Savings Goals')
    plt.ylabel('Amount ($)')
    plt.title('Savings Target vs. Actual')
    plt.xticks(x, categories, rotation=45, ha='right')
    plt.legend()

    # Annotate bar values
    for bar in bars1 + bars2:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width() / 2, yval + 50, f"${yval:.2f}", ha='center', va='bottom')

    plt.tight_layout()

    # Save plot as base64-encoded PNG
    img_io = BytesIO()
    plt.savefig(img_io, format='png')
    img_io.seek(0)
    img_base64 = base64.b64encode(img_io.read()).decode('utf-8')
    plt.close()
    return img_base64

def generate_no_data_image():#Function for returning no data image when no data found
    fig = go.Figure()
    fig.add_annotation(
        text="No Data Available",
        x=0.5, y=0.5,
        showarrow=False,
        font=dict(size=24, color="grey")
    )
    fig.update_layout(
        xaxis=dict(showgrid=False, zeroline=False, visible=False),
        yaxis=dict(showgrid=False, zeroline=False, visible=False),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        margin=dict(t=0, b=0, l=0, r=0),
        height=300  # You can adjust height/width if needed
    )

    img_io = BytesIO()
    fig.write_image(img_io, format='png', scale=3)
    img_io.seek(0)
    return Response(img_io.getvalue(), mimetype='image/png') 