from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, TaskAssignment, TaskCompletion
from datetime import datetime, timedelta
from sqlalchemy import and_, or_

calendar_bp = Blueprint('calendar', __name__)

@calendar_bp.route('/user/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_calendar(user_id):
    """
    Obtener calendario de un usuario con sus tareas
    Query params:
        - start_date: fecha inicio (YYYY-MM-DD)
        - end_date: fecha fin (YYYY-MM-DD)
        - view: 'day'|'week'|'month' (opcional, por defecto 'month')
    """
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Solo admin o el propio usuario puede ver el calendario
    if current_user.role != 'admin' and current_user_id != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Obtener parámetros de fecha
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    view = request.args.get('view', 'month')
    
    if not start_date_str or not end_date_str:
        # Por defecto, mes actual
        today = datetime.now().date()
        start_date = today.replace(day=1)
        # Último día del mes
        if today.month == 12:
            end_date = today.replace(day=31)
        else:
            end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
    else:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    
    # Obtener asignaciones en el rango de fechas
    assignments = TaskAssignment.query.filter(
        and_(
            TaskAssignment.user_id == user_id,
            TaskAssignment.assigned_date >= start_date,
            TaskAssignment.assigned_date <= end_date
        )
    ).order_by(TaskAssignment.assigned_date).all()
    
    # Agrupar por fecha
    calendar_data = {}
    for assignment in assignments:
        date_str = assignment.assigned_date.isoformat()
        if date_str not in calendar_data:
            calendar_data[date_str] = []
        calendar_data[date_str].append(assignment.to_dict())
    
    return jsonify({
        'user_id': user_id,
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
        'view': view,
        'calendar': calendar_data
    }), 200

@calendar_bp.route('/user/<int:user_id>/day/<string:date>', methods=['GET'])
@jwt_required()
def get_user_day(user_id, date):
    """
    Obtener tareas de un usuario para un día específico
    date: YYYY-MM-DD
    """
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Solo admin o el propio usuario puede ver las tareas
    if current_user.role != 'admin' and current_user_id != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Convertir fecha
    target_date = datetime.strptime(date, '%Y-%m-%d').date()
    
    # Obtener asignaciones del día
    assignments = TaskAssignment.query.filter(
        and_(
            TaskAssignment.user_id == user_id,
            TaskAssignment.assigned_date == target_date
        )
    ).all()
    
    return jsonify({
        'user_id': user_id,
        'date': target_date.isoformat(),
        'tasks': [a.to_dict() for a in assignments]
    }), 200

@calendar_bp.route('/user/<int:user_id>/pending', methods=['GET'])
@jwt_required()
def get_user_pending_tasks(user_id):
    """Obtener tareas pendientes de un usuario (no completadas y no canceladas)"""
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Solo admin o el propio usuario
    if current_user.role != 'admin' and current_user_id != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Tareas no completadas Y no canceladas hasta hoy
    today = datetime.now().date()
    pending_assignments = TaskAssignment.query.filter(
        and_(
            TaskAssignment.user_id == user_id,
            TaskAssignment.is_completed == False,
            TaskAssignment.is_cancelled == False,
            TaskAssignment.assigned_date <= today
        )
    ).order_by(TaskAssignment.assigned_date).all()
    
    return jsonify({
        'user_id': user_id,
        'pending_count': len(pending_assignments),
        'tasks': [a.to_dict() for a in pending_assignments]
    }), 200

@calendar_bp.route('/user/<int:user_id>/cancelled', methods=['GET'])
@jwt_required()
def get_user_cancelled_tasks(user_id):
    """Obtener tareas no completadas/canceladas de un usuario"""
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Solo admin o el propio usuario
    if current_user.role != 'admin' and current_user_id != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Obtener límite de resultados (default 30)
    limit = request.args.get('limit', 30, type=int)
    
    # Tareas canceladas
    cancelled_assignments = TaskAssignment.query.filter(
        and_(
            TaskAssignment.user_id == user_id,
            TaskAssignment.is_cancelled == True
        )
    ).order_by(TaskAssignment.cancelled_at.desc()).limit(limit).all()
    
    return jsonify({
        'user_id': user_id,
        'cancelled_count': len(cancelled_assignments),
        'tasks': [a.to_dict() for a in cancelled_assignments]
    }), 200

@calendar_bp.route('/user/<int:user_id>/completed', methods=['GET'])
@jwt_required()
def get_user_completed_tasks(user_id):
    """Obtener tareas completadas de un usuario"""
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Solo admin o el propio usuario
    if current_user.role != 'admin' and current_user_id != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Límite de resultados (últimas 100 por defecto)
    limit = request.args.get('limit', 100, type=int)
    
    completed_assignments = TaskAssignment.query.filter(
        and_(
            TaskAssignment.user_id == user_id,
            TaskAssignment.is_completed == True
        )
    ).order_by(TaskAssignment.assigned_date.desc()).limit(limit).all()
    
    return jsonify({
        'user_id': user_id,
        'completed_count': len(completed_assignments),
        'tasks': [a.to_dict() for a in completed_assignments]
    }), 200
