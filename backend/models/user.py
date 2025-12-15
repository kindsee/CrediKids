from . import db
from datetime import datetime
import bcrypt

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    nick = db.Column(db.String(50), unique=True, nullable=False)
    figure = db.Column(db.String(100), nullable=False)  # Avatar/imagen
    access_code = db.Column(db.String(200), nullable=False)  # 4 iconos codificados
    role = db.Column(db.String(20), nullable=False, default='user')  # 'admin' o 'user'
    score = db.Column(db.Integer, default=0)  # Créditos actuales
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    task_assignments = db.relationship('TaskAssignment', foreign_keys='TaskAssignment.user_id', back_populates='user', lazy='dynamic')
    task_completions = db.relationship('TaskCompletion', foreign_keys='TaskCompletion.user_id', back_populates='user', lazy='dynamic')
    task_proposals = db.relationship('TaskProposal', foreign_keys='TaskProposal.user_id', back_populates='user', lazy='dynamic')
    reward_redemptions = db.relationship('RewardRedemption', foreign_keys='RewardRedemption.user_id', back_populates='user', lazy='dynamic')
    
    def set_access_code(self, icon_ids):
        """
        Establece el código de acceso basado en 4 IDs de iconos
        icon_ids: lista de 4 enteros [1, 5, 12, 8]
        """
        if len(icon_ids) != 4:
            raise ValueError("Access code must contain exactly 4 icons")
        # Guardamos como string separado por comas
        self.access_code = ','.join(map(str, icon_ids))
    
    def verify_access_code(self, icon_ids):
        """Verifica si el código de acceso coincide"""
        if len(icon_ids) != 4:
            return False
        provided_code = ','.join(map(str, icon_ids))
        return self.access_code == provided_code
    
    def get_access_code_icons(self):
        """Retorna los IDs de los iconos como lista"""
        return [int(x) for x in self.access_code.split(',')]
    
    def add_credits(self, amount):
        """Suma créditos al score"""
        self.score += amount
        
    def subtract_credits(self, amount):
        """Resta créditos del score (puede quedar negativo)"""
        self.score -= amount
    
    def to_dict(self):
        return {
            'id': self.id,
            'nick': self.nick,
            'figure': self.figure,
            'role': self.role,
            'score': self.score,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'access_code_icons': self.get_access_code_icons()
        }
