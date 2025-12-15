from models import db
from datetime import datetime

class Bonus(db.Model):
    """Bonos de créditos asignados por el administrador"""
    __tablename__ = 'bonuses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    credits = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text)
    assigned_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='bonuses_received')
    assigned_by = db.relationship('User', foreign_keys=[assigned_by_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'credits': self.credits,
            'description': self.description,
            'assigned_by_id': self.assigned_by_id,
            'assigned_by': self.assigned_by.nick if self.assigned_by else None,
            'created_at': self.created_at.isoformat(),
            'user': {
                'id': self.user.id,
                'nick': self.user.nick,
                'figure': self.user.figure,
                'role': self.user.role
            } if self.user else None
        }
