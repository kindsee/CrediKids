from . import db
from datetime import datetime

class RewardRedemption(db.Model):
    """Registro de canje de premios"""
    __tablename__ = 'reward_redemptions'
    
    id = db.Column(db.Integer, primary_key=True)
    reward_id = db.Column(db.Integer, db.ForeignKey('rewards.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    credits_spent = db.Column(db.Integer, nullable=False)
    redeemed_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    
    # Sistema de aprobación
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    approved_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    
    # Relaciones
    reward = db.relationship('Reward', back_populates='redemptions')
    user = db.relationship('User', foreign_keys=[user_id], back_populates='reward_redemptions')
    approved_by = db.relationship('User', foreign_keys=[approved_by_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'reward_id': self.reward_id,
            'user_id': self.user_id,
            'credits_spent': self.credits_spent,
            'redeemed_at': self.redeemed_at.isoformat(),
            'notes': self.notes,
            'status': self.status,
            'approved_by_id': self.approved_by_id,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rejection_reason': self.rejection_reason,
            'reward': self.reward.to_dict() if self.reward else None,
            'user': {'id': self.user.id, 'nick': self.user.nick, 'figure': self.user.figure} if self.user else None
        }
