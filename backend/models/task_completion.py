from . import db
from datetime import datetime

class TaskCompletion(db.Model):
    """Registro de completado y validación de una tarea"""
    __tablename__ = 'task_completions'
    
    id = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey('task_assignments.id'), nullable=False, unique=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Validación por admin
    validation_score = db.Column(db.Integer)  # 1, 2 o 3 (10%, 60%, 100%)
    validated_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    validated_at = db.Column(db.DateTime)
    validation_notes = db.Column(db.Text)
    
    # Créditos otorgados
    credits_awarded = db.Column(db.Integer, default=0)
    
    # Relaciones
    assignment = db.relationship('TaskAssignment', back_populates='completion')
    task = db.relationship('Task', back_populates='completions')
    user = db.relationship('User', foreign_keys=[user_id], back_populates='task_completions')
    validated_by = db.relationship('User', foreign_keys=[validated_by_id])
    
    def calculate_credits(self, base_value):
        """Calcula créditos según la puntuación de validación"""
        if self.validation_score == 1:
            return int(base_value * 0.10)
        elif self.validation_score == 2:
            return int(base_value * 0.60)
        elif self.validation_score == 3:
            return base_value
        return 0
    
    def to_dict(self):
        return {
            'id': self.id,
            'assignment_id': self.assignment_id,
            'task_id': self.task_id,
            'user_id': self.user_id,
            'completed_at': self.completed_at.isoformat(),
            'validation_score': self.validation_score,
            'validated_by_id': self.validated_by_id,
            'validated_at': self.validated_at.isoformat() if self.validated_at else None,
            'validation_notes': self.validation_notes,
            'credits_awarded': self.credits_awarded,
            'task': self.task.to_dict() if self.task else None
        }
