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
    
    # Relaciones
    reward = db.relationship('Reward', back_populates='redemptions')
    user = db.relationship('User', back_populates='reward_redemptions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'reward_id': self.reward_id,
            'user_id': self.user_id,
            'credits_spent': self.credits_spent,
            'redeemed_at': self.redeemed_at.isoformat(),
            'notes': self.notes,
            'reward': self.reward.to_dict() if self.reward else None
        }
