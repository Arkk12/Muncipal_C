from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Complaint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(300))
    before_photo = db.Column(db.String(300), nullable=False)
    after_photo = db.Column(db.String(300), nullable=True)
    status = db.Column(db.String(50), default='Pending')   # Pending, Assigned, In Progress, Work Done, Rejected
    assigned_to = db.Column(db.String(100), nullable=True) # Worker name
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ai_similarity = db.Column(db.Float, nullable=True)