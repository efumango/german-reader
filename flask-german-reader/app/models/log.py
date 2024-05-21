from datetime import datetime
from app.extensions import db

class Log(db.Model):
    __tablename__ = 'log'
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    username = db.Column(db.String(255), nullable=True)
    activity = db.Column(db.String(255), nullable=True)
    filename = db.Column(db.String(255), nullable=True)
    word = db.Column(db.String(255), nullable=True)