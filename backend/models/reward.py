from . import db
from datetime import datetime

class Reward(db.Model):
    """Premios canjeables por créditos"""
    __tablename__ = 'rewards'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(200))  # URL o path de imagen/icono
    credit_cost = db.Column(db.Integer, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    stock = db.Column(db.Integer)  # NULL = ilimitado, número = stock disponible
    
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    redemptions = db.relationship('RewardRedemption', back_populates='reward', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'credit_cost': self.credit_cost,
            'is_active': self.is_active,
            'stock': self.stock,
            'created_by_id': self.created_by_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
