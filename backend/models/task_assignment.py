from . import db
from datetime import datetime

class TaskAssignment(db.Model):
    """Asignación de una tarea a un usuario con fecha específica"""
    __tablename__ = 'task_assignments'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_date = db.Column(db.Date, nullable=False)  # Día específico asignado
    is_completed = db.Column(db.Boolean, default=False)
    is_validated = db.Column(db.Boolean, default=False)
    is_cancelled = db.Column(db.Boolean, default=False)  # Usuario decidió no completar
    cancelled_at = db.Column(db.DateTime)  # Fecha de cancelación
    
    assigned_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    task = db.relationship('Task', back_populates='assignments')
    user = db.relationship('User', foreign_keys=[user_id], back_populates='task_assignments')
    assigned_by = db.relationship('User', foreign_keys=[assigned_by_id])
    completion = db.relationship('TaskCompletion', back_populates='assignment', uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'user_id': self.user_id,
            'assigned_date': self.assigned_date.isoformat(),
            'is_completed': self.is_completed,
            'is_validated': self.is_validated,
            'is_cancelled': self.is_cancelled,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'assigned_by_id': self.assigned_by_id,
            'created_at': self.created_at.isoformat(),
            'task': self.task.to_dict() if self.task else None,
            'completion': self.completion.to_dict() if self.completion else None
        }
