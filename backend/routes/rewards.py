from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Reward, RewardRedemption
from datetime import datetime, timedelta
from sqlalchemy import and_, or_

rewards_bp = Blueprint('rewards', __name__)

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

@rewards_bp.route('', methods=['GET'])
@jwt_required()
def get_rewards():
    """Obtener lista de premios"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    # Admin ve todos, usuarios solo los activos
    if user.role == 'admin':
        rewards = Reward.query.all()
    else:
        rewards = Reward.query.filter_by(is_active=True).all()
    
    return jsonify([reward.to_dict() for reward in rewards]), 200

@rewards_bp.route('/<int:reward_id>', methods=['GET'])
@jwt_required()
def get_reward(reward_id):
    """Obtener información de un premio específico"""
    reward = Reward.query.get(reward_id)
    if not reward:
        return jsonify({'error': 'Reward not found'}), 404
    
    return jsonify(reward.to_dict()), 200

@rewards_bp.route('', methods=['POST'])
@admin_required
def create_reward():
    """
    Crear nuevo premio (solo admin)
    Body: {
        "name": "...",
        "description": "...",
        "icon": "icon.png",
        "credit_cost": 500,
        "stock": null|100
    }
    """
    data = request.get_json()
    admin_id = int(get_jwt_identity())
    
    required_fields = ['name', 'credit_cost']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    reward = Reward(
        name=data['name'],
        description=data.get('description', ''),
        icon=data.get('icon', ''),
        credit_cost=data['credit_cost'],
        stock=data.get('stock'),
        created_by_id=admin_id
    )
    
    db.session.add(reward)
    db.session.commit()
    
    return jsonify(reward.to_dict()), 201

@rewards_bp.route('/<int:reward_id>', methods=['PUT'])
@admin_required
def update_reward(reward_id):
    """Actualizar premio (solo admin)"""
    reward = Reward.query.get(reward_id)
    if not reward:
        return jsonify({'error': 'Reward not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        reward.name = data['name']
    if 'description' in data:
        reward.description = data['description']
    if 'icon' in data:
        reward.icon = data['icon']
    if 'credit_cost' in data:
        reward.credit_cost = data['credit_cost']
    if 'is_active' in data:
        reward.is_active = data['is_active']
    if 'stock' in data:
        reward.stock = data['stock']
    
    db.session.commit()
    
    return jsonify(reward.to_dict()), 200

@rewards_bp.route('/<int:reward_id>', methods=['DELETE'])
@admin_required
def delete_reward(reward_id):
    """Desactivar premio (solo admin)"""
    reward = Reward.query.get(reward_id)
    if not reward:
        return jsonify({'error': 'Reward not found'}), 404
    
    reward.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'Reward deactivated successfully'}), 200

@rewards_bp.route('/<int:reward_id>/redeem', methods=['POST'])
@jwt_required()
def redeem_reward(reward_id):
    """
    Canjear premio por créditos
    Body: { "notes": "..." }  // opcional
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    reward = Reward.query.get(reward_id)
    if not reward:
        return jsonify({'error': 'Reward not found'}), 404
    
    if not reward.is_active:
        return jsonify({'error': 'Reward is not available'}), 400
    
    # Verificar stock disponible (considerando solicitudes pendientes)
    available_stock = reward.get_available_stock()
    if available_stock is not None and available_stock <= 0:
        return jsonify({'error': 'Reward out of stock'}), 400
    
    # Calcular créditos disponibles (restando solicitudes pendientes)
    pending_redemptions = RewardRedemption.query.filter_by(
        user_id=user_id,
        status='pending'
    ).all()
    pending_credits = sum(r.credits_spent for r in pending_redemptions)
    available_credits = user.score - pending_credits
    
    # Verificar créditos disponibles
    if available_credits < reward.credit_cost:
        return jsonify({
            'error': 'Insufficient available credits',
            'total_credits': user.score,
            'pending_credits': pending_credits,
            'available_credits': available_credits,
            'required': reward.credit_cost
        }), 400
    
    # Crear redención pendiente (NO restar créditos aún)
    data = request.get_json() or {}
    redemption = RewardRedemption(
        reward_id=reward_id,
        user_id=user_id,
        credits_spent=reward.credit_cost,
        notes=data.get('notes', ''),
        status='pending'
    )
    
    db.session.add(redemption)
    db.session.commit()
    
    return jsonify({
        'message': 'Redemption request created successfully',
        'redemption': redemption.to_dict(),
        'user_score': user.score
    }), 201

@rewards_bp.route('/redemptions/pending', methods=['GET'])
@admin_required
def get_pending_redemptions():
    """Obtener canjes pendientes de aprobación (solo admin)"""
    redemptions = RewardRedemption.query.filter_by(status='pending').order_by(RewardRedemption.redeemed_at.desc()).all()
    return jsonify([r.to_dict() for r in redemptions]), 200

@rewards_bp.route('/redemptions/<int:redemption_id>/approve', methods=['POST'])
@admin_required
def approve_redemption(redemption_id):
    """Aprobar canje de premio"""
    admin_id = int(get_jwt_identity())
    
    redemption = RewardRedemption.query.get(redemption_id)
    if not redemption:
        return jsonify({'error': 'Redemption not found'}), 404
    
    if redemption.status != 'pending':
        return jsonify({'error': 'Redemption already processed'}), 400
    
    # Verificar que el usuario aún tenga créditos suficientes
    user = User.query.get(redemption.user_id)
    if user.score < redemption.credits_spent:
        return jsonify({'error': 'User no longer has sufficient credits'}), 400
    
    # Aprobar: restar créditos y actualizar stock
    user.subtract_credits(redemption.credits_spent)
    
    reward = Reward.query.get(redemption.reward_id)
    if reward.stock is not None:
        reward.stock -= 1
    
    redemption.status = 'approved'
    redemption.approved_by_id = admin_id
    redemption.approved_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Redemption approved successfully',
        'redemption': redemption.to_dict(),
        'user_score': user.score
    }), 200

@rewards_bp.route('/redemptions/<int:redemption_id>/reject', methods=['POST'])
@admin_required
def reject_redemption(redemption_id):
    """Rechazar canje de premio"""
    admin_id = int(get_jwt_identity())
    data = request.get_json() or {}
    
    redemption = RewardRedemption.query.get(redemption_id)
    if not redemption:
        return jsonify({'error': 'Redemption not found'}), 404
    
    if redemption.status != 'pending':
        return jsonify({'error': 'Redemption already processed'}), 400
    
    # Rechazar (NO se restan créditos)
    redemption.status = 'rejected'
    redemption.approved_by_id = admin_id
    redemption.approved_at = datetime.utcnow()
    redemption.rejection_reason = data.get('reason', 'No especificado')
    
    db.session.commit()
    
    return jsonify({
        'message': 'Redemption rejected successfully',
        'redemption': redemption.to_dict()
    }), 200

@rewards_bp.route('/redemptions', methods=['GET'])
@jwt_required()
def get_redemptions():
    """Obtener historial de canjes"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.role == 'admin':
        # Admin ve todos los canjes
        redemptions = RewardRedemption.query.order_by(RewardRedemption.redeemed_at.desc()).all()
    else:
        # Usuario ve solo sus canjes
        redemptions = RewardRedemption.query.filter_by(user_id=user_id).order_by(RewardRedemption.redeemed_at.desc()).all()
    
    return jsonify([r.to_dict() for r in redemptions]), 200

@rewards_bp.route('/redemptions/history', methods=['GET'])
@admin_required
def get_redemptions_history():
    """
    Obtener historial completo de transacciones con filtros (solo admin)
    Query params:
    - user_id: int (opcional) - filtrar por usuario
    - start_date: YYYY-MM-DD (opcional) - fecha inicio, por defecto último mes
    - end_date: YYYY-MM-DD (opcional) - fecha fin, por defecto hoy
    """
    # Obtener parámetros de filtro
    user_id_filter = request.args.get('user_id', type=int)
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    # Fechas por defecto: último mes hasta hoy
    if end_date_str:
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
    else:
        end_date = datetime.utcnow()
    
    if start_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0)
    else:
        start_date = end_date - timedelta(days=30)
    
    # Construir query
    query = RewardRedemption.query
    
    # Filtro por usuario
    if user_id_filter:
        query = query.filter(RewardRedemption.user_id == user_id_filter)
    
    # Filtro por rango de fechas
    query = query.filter(
        and_(
            RewardRedemption.redeemed_at >= start_date,
            RewardRedemption.redeemed_at <= end_date
        )
    )
    
    # Ordenar por fecha descendente
    redemptions = query.order_by(RewardRedemption.redeemed_at.desc()).all()
    
    # Obtener lista de usuarios para el filtro
    users = User.query.filter_by(role='user').order_by(User.nick).all()
    
    return jsonify({
        'redemptions': [r.to_dict() for r in redemptions],
        'filters': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'user_id': user_id_filter
        },
        'users': [{'id': u.id, 'nick': u.nick, 'figure': u.figure} for u in users]
    }), 200
