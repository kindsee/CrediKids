from . import db
from datetime import datetime
from enum import Enum

class TaskType(str, Enum):
    OBLIGATORY = 'obligatory'  # Misiones Base - al validar: suman al admin, restan al usuario
    SPECIAL = 'special'  # Misiones Especiales - al validar: suman al admin
    PROPOSED = 'proposed'  # Misiones Propuestas - al validar: suman al admin

class TaskFrequency(str, Enum):
    DAILY = 'daily'
    WEEKLY = 'weekly'
    MONTHLY = 'monthly'
    ONE_TIME = 'one_time'

class TaskStatus(str, Enum):
    ACTIVE = 'active'
    INACTIVE = 'inactive'
    ARCHIVED = 'archived'

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    task_type = db.Column(db.Enum(TaskType), nullable=False)
    frequency = db.Column(db.Enum(TaskFrequency), nullable=False)
    base_value = db.Column(db.Integer, nullable=False)  # Valor/recompensa base
    status = db.Column(db.Enum(TaskStatus), default=TaskStatus.ACTIVE)
    
    # Quién creó la tarea
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    assignments = db.relationship('TaskAssignment', back_populates='task', lazy='dynamic')
    completions = db.relationship('TaskCompletion', back_populates='task', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'task_type': self.task_type.value,
            'frequency': self.frequency.value,
            'base_value': self.base_value,
            'status': self.status.value,
            'created_by_id': self.created_by_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
