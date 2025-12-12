from . import db
from datetime import datetime
from enum import Enum

class ProposalStatus(str, Enum):
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    MODIFIED = 'modified'

class TaskProposal(db.Model):
    """Propuestas de tareas creadas por usuarios"""
    __tablename__ = 'task_proposals'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    frequency = db.Column(db.String(20), nullable=False)
    suggested_reward = db.Column(db.Integer, nullable=False)
    message_to_admin = db.Column(db.Text)
    
    status = db.Column(db.Enum(ProposalStatus), default=ProposalStatus.PENDING)
    
    # Respuesta del admin
    reviewed_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    reviewed_at = db.Column(db.DateTime)
    admin_notes = db.Column(db.Text)
    
    # Si se aprueba, se puede modificar
    final_title = db.Column(db.String(200))
    final_description = db.Column(db.Text)
    final_reward = db.Column(db.Integer)
    
    # Si se aprueba, se crea una tarea
    created_task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'))
    created_task = db.relationship('Task')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    user = db.relationship('User', foreign_keys=[user_id], back_populates='task_proposals')
    reviewed_by = db.relationship('User', foreign_keys=[reviewed_by_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'frequency': self.frequency,
            'suggested_reward': self.suggested_reward,
            'message_to_admin': self.message_to_admin,
            'status': self.status.value,
            'reviewed_by_id': self.reviewed_by_id,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'admin_notes': self.admin_notes,
            'final_title': self.final_title,
            'final_description': self.final_description,
            'final_reward': self.final_reward,
            'created_task_id': self.created_task_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
