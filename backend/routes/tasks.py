from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Task, TaskAssignment, TaskCompletion, TaskProposal, TaskType, TaskFrequency, ProposalStatus, Bonus
from datetime import datetime, date, timedelta
from sqlalchemy import and_
from calendar import monthrange

tasks_bp = Blueprint('tasks', __name__)

def admin_required(fn):
    """Decorator para verificar que el usuario es administrador"""
    from functools import wraps
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        return fn(*args, **kwargs)
    return wrapper

@tasks_bp.route('', methods=['GET'])
@jwt_required()
def get_tasks():
    """Obtener lista de tareas"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    # Admin ve todas, usuarios solo las activas
    if user.role == 'admin':
        tasks = Task.query.all()
    else:
        tasks = Task.query.filter_by(status='active').all()
    
    return jsonify([task.to_dict() for task in tasks]), 200

@tasks_bp.route('/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    """Obtener información de una tarea específica"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    return jsonify(task.to_dict()), 200

@tasks_bp.route('', methods=['POST'])
@admin_required
def create_task():
    """
    Crear nueva tarea (solo admin)
    Body: {
        "title": "...",
        "description": "...",
        "task_type": "obligatory|special|proposed",
        "frequency": "daily|weekly|monthly|one_time",
        "base_value": 100
    }
    """
    data = request.get_json()
    user_id = int(get_jwt_identity())
    
    required_fields = ['title', 'task_type', 'frequency', 'base_value']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    task = Task(
        title=data['title'],
        description=data.get('description', ''),
        task_type=TaskType(data['task_type']),
        frequency=TaskFrequency(data['frequency']),
        base_value=data['base_value'],
        created_by_id=user_id
    )
    
    db.session.add(task)
    db.session.commit()
    
    return jsonify(task.to_dict()), 201

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@admin_required
def update_task(task_id):
    """Actualizar tarea (solo admin)"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    
    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    if 'task_type' in data:
        task.task_type = TaskType(data['task_type'])
    if 'frequency' in data:
        task.frequency = TaskFrequency(data['frequency'])
    if 'base_value' in data:
        task.base_value = data['base_value']
    if 'status' in data:
        task.status = data['status']
    
    db.session.commit()
    
    return jsonify(task.to_dict()), 200

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@admin_required
def delete_task(task_id):
    """Archivar tarea (solo admin)"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    task.status = 'archived'
    db.session.commit()
    
    return jsonify({'message': 'Task archived successfully'}), 200

@tasks_bp.route('/assign', methods=['POST'])
@admin_required
def assign_task():
    """
    Asignar tarea a usuario
    Body: {
        "task_id": 1,
        "user_id": 2,
        "assigned_date": "2025-12-11"
    }
    """
    data = request.get_json()
    admin_id = int(get_jwt_identity())
    
    required_fields = ['task_id', 'user_id', 'assigned_date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    task = Task.query.get(data['task_id'])
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Convertir fecha
    assigned_date = datetime.strptime(data['assigned_date'], '%Y-%m-%d').date()
    
    # Verificar si ya existe asignación
    existing = TaskAssignment.query.filter_by(
        task_id=data['task_id'],
        user_id=data['user_id'],
        assigned_date=assigned_date
    ).first()
    
    if existing:
        return jsonify({'error': 'Task already assigned for this date'}), 400
    
    assignment = TaskAssignment(
        task_id=data['task_id'],
        user_id=data['user_id'],
        assigned_date=assigned_date,
        assigned_by_id=admin_id
    )
    
    db.session.add(assignment)
    db.session.commit()
    
    return jsonify(assignment.to_dict()), 201

@tasks_bp.route('/assign/bulk', methods=['POST'])
@admin_required
def bulk_assign_task():
    """
    Asignar tarea a usuario(s) con intervalo de fechas
    Body: {
        "task_id": 1,
        "user_ids": [2, 3],  // Lista de usuarios
        "start_date": "2025-12-01",
        "end_date": "2025-12-31",
        "frequency": "daily|weekly|monthly",  // Frecuencia de asignación
        "weekdays": [0, 1, 2, 3, 4],  // Para daily: días de la semana (0=Lun, 6=Dom)
        "times_per_day": 1,  // Para daily: cuántas veces al día
        "weeks": [1, 2, 3, 4],  // Para weekly: qué semanas del mes
        "months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]  // Para monthly: qué meses
    }
    """
    data = request.get_json()
    admin_id = int(get_jwt_identity())
    
    required_fields = ['task_id', 'user_ids', 'start_date', 'end_date', 'frequency']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    task = Task.query.get(data['task_id'])
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    # Verificar usuarios
    user_ids = data['user_ids']
    users = User.query.filter(User.id.in_(user_ids)).all()
    if len(users) != len(user_ids):
        return jsonify({'error': 'One or more users not found'}), 404
    
    # Convertir fechas
    start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
    end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
    
    if start_date > end_date:
        return jsonify({'error': 'start_date must be before end_date'}), 400
    
    frequency = data['frequency']
    assignments_created = []
    
    # Generar asignaciones según frecuencia
    if frequency == 'daily':
        weekdays = data.get('weekdays', [0, 1, 2, 3, 4, 5, 6])  # Por defecto todos los días
        times_per_day = data.get('times_per_day', 1)
        
        current_date = start_date
        while current_date <= end_date:
            # Verificar si el día de la semana está en la lista
            if current_date.weekday() in weekdays:
                # Asignar N veces por día a cada usuario
                for user_id in user_ids:
                    for _ in range(times_per_day):
                        # Verificar si ya existe
                        existing = TaskAssignment.query.filter_by(
                            task_id=task.id,
                            user_id=user_id,
                            assigned_date=current_date
                        ).count()
                        
                        # Permitir múltiples asignaciones el mismo día
                        assignment = TaskAssignment(
                            task_id=task.id,
                            user_id=user_id,
                            assigned_date=current_date,
                            assigned_by_id=admin_id
                        )
                        db.session.add(assignment)
                        assignments_created.append({
                            'user_id': user_id,
                            'date': current_date.isoformat()
                        })
            
            current_date += timedelta(days=1)
    
    elif frequency == 'weekly':
        # Para semanal, asignar en semanas específicas del mes
        weeks = data.get('weeks', [1, 2, 3, 4])  # Por defecto todas las semanas
        weekday = data.get('weekday', 0)  # Día de la semana (0=Lun)
        
        current_date = start_date
        while current_date <= end_date:
            # Calcular qué semana del mes es
            week_of_month = (current_date.day - 1) // 7 + 1
            
            if current_date.weekday() == weekday and week_of_month in weeks:
                for user_id in user_ids:
                    # Verificar si ya existe
                    existing = TaskAssignment.query.filter_by(
                        task_id=task.id,
                        user_id=user_id,
                        assigned_date=current_date
                    ).first()
                    
                    if not existing:
                        assignment = TaskAssignment(
                            task_id=task.id,
                            user_id=user_id,
                            assigned_date=current_date,
                            assigned_by_id=admin_id
                        )
                        db.session.add(assignment)
                        assignments_created.append({
                            'user_id': user_id,
                            'date': current_date.isoformat()
                        })
            
            current_date += timedelta(days=1)
    
    elif frequency == 'monthly':
        # Para mensual, asignar en meses específicos
        months = data.get('months', list(range(1, 13)))  # Por defecto todos los meses
        day_of_month = data.get('day_of_month', 1)  # Día del mes (1-31)
        
        current_date = start_date
        while current_date <= end_date:
            if current_date.month in months and current_date.day == day_of_month:
                for user_id in user_ids:
                    # Verificar si ya existe
                    existing = TaskAssignment.query.filter_by(
                        task_id=task.id,
                        user_id=user_id,
                        assigned_date=current_date
                    ).first()
                    
                    if not existing:
                        assignment = TaskAssignment(
                            task_id=task.id,
                            user_id=user_id,
                            assigned_date=current_date,
                            assigned_by_id=admin_id
                        )
                        db.session.add(assignment)
                        assignments_created.append({
                            'user_id': user_id,
                            'date': current_date.isoformat()
                        })
            
            current_date += timedelta(days=1)
    
    else:
        return jsonify({'error': 'Invalid frequency'}), 400
    
    db.session.commit()
    
    return jsonify({
        'message': f'{len(assignments_created)} assignments created successfully',
        'assignments': assignments_created
    }), 201

@tasks_bp.route('/assignments/<int:assignment_id>/complete', methods=['POST'])
@jwt_required()
def complete_task(assignment_id):
    """
    Marcar tarea como completada
    Body (opcional): {
        "completion_notes": "Comentario del usuario..."
    }
    """
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    
    assignment = TaskAssignment.query.get(assignment_id)
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404
    
    # Verificar que el usuario es el asignado
    if assignment.user_id != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    if assignment.is_completed:
        return jsonify({'error': 'Task already completed'}), 400
    
    # Crear registro de completado
    completion = TaskCompletion(
        assignment_id=assignment_id,
        task_id=assignment.task_id,
        user_id=user_id,
        completed_at=datetime.utcnow(),
        completion_notes=data.get('completion_notes', '')
    )
    
    assignment.is_completed = True
    
    db.session.add(completion)
    db.session.commit()
    
    return jsonify(completion.to_dict()), 201

@tasks_bp.route('/assignments/<int:assignment_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_task(assignment_id):
    """
    Cancelar/no completar una tarea
    Si es obligatoria, se resta el base_value de los créditos del usuario
    Body (opcional): {
        "cancellation_reason": "Motivo de cancelación..."
    }
    """
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    
    assignment = TaskAssignment.query.get(assignment_id)
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404
    
    # Verificar que el usuario es el asignado
    if assignment.user_id != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    if assignment.is_completed:
        return jsonify({'error': 'Task already completed'}), 400
        
    if assignment.is_cancelled:
        return jsonify({'error': 'Task already cancelled'}), 400
    
    # Marcar como cancelada
    assignment.is_cancelled = True
    assignment.cancelled_at = datetime.utcnow()
    
    # Si es obligatoria, aplicar penalización
    user = User.query.get(user_id)
    penalty_applied = 0
    
    if assignment.task.task_type == 'obligatory':
        penalty = assignment.task.base_value
        user.subtract_credits(penalty)
        penalty_applied = penalty
    
    db.session.commit()
    
    return jsonify({
        'message': 'Task cancelled successfully',
        'assignment': assignment.to_dict(),
        'penalty_applied': penalty_applied
    }), 200

@tasks_bp.route('/completions/<int:completion_id>/validate', methods=['POST'])
@admin_required
def validate_task(completion_id):
    """
    Validar tarea completada
    Body: {
        "validation_score": 1|2|3,
        "validation_notes": "..."
    }
    """
    data = request.get_json()
    admin_id = int(get_jwt_identity())
    
    if 'validation_score' not in data:
        return jsonify({'error': 'validation_score is required'}), 400
    
    score = data['validation_score']
    if score not in [1, 2, 3]:
        return jsonify({'error': 'validation_score must be 1, 2, or 3'}), 400
    
    completion = TaskCompletion.query.get(completion_id)
    if not completion:
        return jsonify({'error': 'Completion not found'}), 404
    
    if completion.validation_score:
        return jsonify({'error': 'Task already validated'}), 400
    
    # Obtener la tarea para calcular créditos
    task = Task.query.get(completion.task_id)
    
    # Actualizar completion primero con el score
    completion.validation_score = score
    completion.validated_by_id = admin_id
    completion.validated_at = datetime.utcnow()
    completion.validation_notes = data.get('validation_notes', '')
    
    # Calcular créditos según tipo de tarea DESPUÉS de asignar el score
    credits = 0
    if task.task_type == TaskType.OBLIGATORY:
        # Tareas obligatorias no suman créditos al completarse
        credits = 0
    else:
        # Tareas especiales y propuestas sí suman créditos
        credits = completion.calculate_credits(task.base_value)
    
    completion.credits_awarded = credits
    
    # Actualizar assignment
    assignment = TaskAssignment.query.get(completion.assignment_id)
    assignment.is_validated = True
    
    # Actualizar score del usuario
    user = User.query.get(completion.user_id)
    user.add_credits(credits)
    
    db.session.commit()
    
    return jsonify({
        'completion': completion.to_dict(),
        'user_score': user.score
    }), 200

@tasks_bp.route('/assignments/<int:assignment_id>/reset', methods=['POST'])
@admin_required
def reset_task_assignment(assignment_id):
    """
    Resetear una tarea (completada o cancelada) a su estado original (pendiente)
    """
    assignment = TaskAssignment.query.get(assignment_id)
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404
    
    # Si está completada, eliminar el completion y revertir créditos
    if assignment.is_completed:
        completion = TaskCompletion.query.filter_by(assignment_id=assignment_id).first()
        if completion:
            # Si fue validada, revertir créditos
            if completion.credits_awarded and completion.credits_awarded > 0:
                user = User.query.get(assignment.user_id)
                user.subtract_credits(completion.credits_awarded)
            
            db.session.delete(completion)
        
        assignment.is_completed = False
        assignment.is_validated = False
    
    # Si está cancelada, revertir penalización si era obligatoria
    if assignment.is_cancelled:
        task = Task.query.get(assignment.task_id)
        if task.task_type == 'obligatory':
            user = User.query.get(assignment.user_id)
            user.add_credits(task.base_value)  # Devolver los créditos restados
        
        assignment.is_cancelled = False
        assignment.cancelled_at = None
    
    db.session.commit()
    
    return jsonify({
        'message': 'Task reset successfully',
        'assignment': assignment.to_dict()
    }), 200

@tasks_bp.route('/completions/pending-validation', methods=['GET'])
@admin_required
def get_pending_validations():
    """
    Obtener todas las tareas completadas pendientes de validación
    """
    completions = TaskCompletion.query.filter(
        TaskCompletion.validation_score.is_(None)
    ).order_by(TaskCompletion.completed_at.desc()).all()
    
    return jsonify({
        'count': len(completions),
        'completions': [c.to_dict() for c in completions]
    }), 200

@tasks_bp.route('/assignments/cancelled', methods=['GET'])
@admin_required
def get_cancelled_assignments():
    """
    Obtener todas las tareas canceladas (para que admin las revise)
    """
    assignments = TaskAssignment.query.filter(
        TaskAssignment.is_cancelled.is_(True)
    ).order_by(TaskAssignment.cancelled_at.desc()).all()
    
    return jsonify({
        'count': len(assignments),
        'assignments': [a.to_dict() for a in assignments]
    }), 200

@tasks_bp.route('/users/<int:user_id>/bonus', methods=['POST'])
@admin_required
def assign_bonus_credits(user_id):
    """
    Asignar créditos bonus a un usuario (premio especial)
    Body: {
        "credits": 50,
        "description": "Premio por buen comportamiento" (opcional)
    }
    """
    data = request.get_json()
    admin_id = int(get_jwt_identity())
    
    if 'credits' not in data:
        return jsonify({'error': 'credits is required'}), 400
    
    credits = int(data['credits'])
    if credits <= 0:
        return jsonify({'error': 'credits must be positive'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    description = data.get('description', 'Créditos bonus del administrador')
    
    # Crear registro de bonus
    bonus = Bonus(
        user_id=user_id,
        credits=credits,
        description=description,
        assigned_by_id=admin_id
    )
    
    # Asignar créditos al usuario
    user.add_credits(credits)
    
    db.session.add(bonus)
    db.session.commit()
    
    return jsonify({
        'message': 'Bonus credits assigned successfully',
        'user': user.to_dict(),
        'bonus': bonus.to_dict()
    }), 200

@tasks_bp.route('/proposals', methods=['GET'])
@jwt_required()
def get_proposals():
    """Obtener propuestas de tareas"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.role == 'admin':
        # Admin ve todas las propuestas
        proposals = TaskProposal.query.order_by(TaskProposal.created_at.desc()).all()
    else:
        # Usuario ve solo sus propuestas
        proposals = TaskProposal.query.filter_by(user_id=user_id).order_by(TaskProposal.created_at.desc()).all()
    
    return jsonify([p.to_dict() for p in proposals]), 200

@tasks_bp.route('/proposals', methods=['POST'])
@jwt_required()
def create_proposal():
    """
    Crear propuesta de tarea
    Body: {
        "title": "...",
        "description": "...",
        "frequency": "daily|weekly|monthly",
        "suggested_reward": 100,
        "message_to_admin": "..."
    }
    """
    data = request.get_json()
    user_id = int(get_jwt_identity())
    
    required_fields = ['title', 'description', 'frequency', 'suggested_reward']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    proposal = TaskProposal(
        user_id=user_id,
        title=data['title'],
        description=data['description'],
        frequency=data['frequency'],
        suggested_reward=data['suggested_reward'],
        message_to_admin=data.get('message_to_admin', '')
    )
    
    db.session.add(proposal)
    db.session.commit()
    
    return jsonify(proposal.to_dict()), 201

@tasks_bp.route('/proposals/<int:proposal_id>/review', methods=['POST'])
@admin_required
def review_proposal(proposal_id):
    """
    Revisar propuesta de tarea
    Body: {
        "status": "approved|rejected|modified",
        "admin_notes": "...",
        "final_title": "...",  // opcional si status=modified
        "final_description": "...",  // opcional si status=modified
        "final_reward": 150  // opcional si status=modified
    }
    """
    data = request.get_json()
    admin_id = int(get_jwt_identity())
    
    if 'status' not in data:
        return jsonify({'error': 'status is required'}), 400
    
    proposal = TaskProposal.query.get(proposal_id)
    if not proposal:
        return jsonify({'error': 'Proposal not found'}), 404
    
    if proposal.status != ProposalStatus.PENDING:
        return jsonify({'error': 'Proposal already reviewed'}), 400
    
    status = ProposalStatus(data['status'])
    proposal.status = status
    proposal.reviewed_by_id = admin_id
    proposal.reviewed_at = datetime.utcnow()
    proposal.admin_notes = data.get('admin_notes', '')
    
    if status == ProposalStatus.APPROVED or status == ProposalStatus.MODIFIED:
        # Usar valores finales o los originales
        final_title = data.get('final_title', proposal.title)
        final_description = data.get('final_description', proposal.description)
        final_reward = data.get('final_reward', proposal.suggested_reward)
        
        proposal.final_title = final_title
        proposal.final_description = final_description
        proposal.final_reward = final_reward
        
        # Crear la tarea
        task = Task(
            title=final_title,
            description=final_description,
            task_type=TaskType.PROPOSED,
            frequency=TaskFrequency(proposal.frequency),
            base_value=final_reward,
            created_by_id=admin_id
        )
        
        db.session.add(task)
        db.session.flush()  # Para obtener el ID
        
        proposal.created_task_id = task.id
    
    db.session.commit()
    
    return jsonify(proposal.to_dict()), 200
