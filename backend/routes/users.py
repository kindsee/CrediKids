from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User
from functools import wraps

users_bp = Blueprint('users', __name__)

def admin_required(fn):
    """Decorator para verificar que el usuario es administrador"""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        return fn(*args, **kwargs)
    return wrapper

@users_bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    """Obtener lista de usuarios, incluyendo inactivos (solo admin)"""
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)
    
    if current_user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    # Mostrar todos los usuarios, incluyendo inactivos
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Obtener información de un usuario específico"""
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Solo admin o el propio usuario puede ver la info
    if current_user.role != 'admin' and current_user_id != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200

@users_bp.route('', methods=['POST'])
@admin_required
def create_user():
    """
    Crear nuevo usuario (solo admin)
    Body: {
        "nick": "usuario",
        "figure": "avatar1.png",
        "icon_codes": [1, 5, 12, 8],
        "role": "user"
    }
    """
    data = request.get_json()
    
    required_fields = ['nick', 'figure', 'icon_codes']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if len(data['icon_codes']) != 4:
        return jsonify({'error': 'Icon codes must contain exactly 4 icons'}), 400
    
    # Verificar que el nick no existe
    existing_user = User.query.filter_by(nick=data['nick']).first()
    if existing_user:
        return jsonify({'error': 'Nick already exists'}), 400
    
    # Verificar que la secuencia de iconos no existe
    icon_codes_str = ','.join(map(str, data['icon_codes']))
    existing_code = User.query.filter_by(access_code=icon_codes_str).first()
    if existing_code:
        return jsonify({'error': 'Esta secuencia de iconos ya está en uso'}), 400
    
    # Crear usuario
    user = User(
        nick=data['nick'],
        figure=data['figure'],
        role=data.get('role', 'user'),
        score=0
    )
    user.set_access_code(data['icon_codes'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify(user.to_dict()), 201

@users_bp.route('/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """
    Actualizar usuario (solo admin)
    Body: { "nick": "...", "figure": "...", "icon_codes": [...], "role": "..." }
    """
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if 'nick' in data:
        # Verificar que el nick no esté en uso por otro usuario
        existing = User.query.filter_by(nick=data['nick']).first()
        if existing and existing.id != user_id:
            return jsonify({'error': 'Nick already exists'}), 400
        user.nick = data['nick']
    
    if 'figure' in data:
        user.figure = data['figure']
    
    if 'icon_codes' in data:
        if len(data['icon_codes']) != 4:
            return jsonify({'error': 'Icon codes must contain exactly 4 icons'}), 400
        
        # Verificar que la secuencia de iconos no esté en uso por otro usuario
        icon_codes_str = ','.join(map(str, data['icon_codes']))
        existing_code = User.query.filter_by(access_code=icon_codes_str).first()
        if existing_code and existing_code.id != user_id:
            return jsonify({'error': 'Esta secuencia de iconos ya está en uso'}), 400
        
        user.set_access_code(data['icon_codes'])
    
    if 'role' in data:
        user.role = data['role']
    
    if 'is_active' in data:
        user.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify(user.to_dict()), 200

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Desactivar usuario (soft delete) - Deprecated, usar toggle"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'User deactivated successfully'}), 200

@users_bp.route('/<int:user_id>/toggle-active', methods=['POST'])
@admin_required
def toggle_user_active(user_id):
    """Activar o desactivar un usuario"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.is_active = not user.is_active
    db.session.commit()
    
    status = 'activado' if user.is_active else 'desactivado'
    return jsonify({
        'message': f'Usuario {status} exitosamente',
        'is_active': user.is_active
    }), 200

@users_bp.route('/<int:user_id>/history', methods=['GET'])
@jwt_required()
def get_user_history(user_id):
    """
    Obtener historial completo de un usuario:
    - Tareas completadas
    - Validaciones
    - Créditos ganados/perdidos
    - Premios canjeados
    """
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Solo admin o el propio usuario puede ver el historial
    if current_user.role != 'admin' and current_user_id != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    from models import TaskCompletion, RewardRedemption, Bonus
    
    # Tareas completadas
    completions = TaskCompletion.query.filter_by(user_id=user_id).order_by(TaskCompletion.completed_at.desc()).all()
    
    # Premios canjeados
    redemptions = RewardRedemption.query.filter_by(user_id=user_id).order_by(RewardRedemption.redeemed_at.desc()).all()
    
    # Bonuses recibidos
    bonuses = Bonus.query.filter_by(user_id=user_id).order_by(Bonus.created_at.desc()).all()
    
    return jsonify({
        'user': user.to_dict(),
        'task_completions': [c.to_dict() for c in completions],
        'reward_redemptions': [r.to_dict() for r in redemptions],
        'bonuses': [b.to_dict() for b in bonuses]
    }), 200
