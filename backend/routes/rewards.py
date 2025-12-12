from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Reward, RewardRedemption
from datetime import datetime

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
    
    # Verificar stock
    if reward.stock is not None and reward.stock <= 0:
        return jsonify({'error': 'Reward out of stock'}), 400
    
    # Verificar créditos del usuario
    if user.score < reward.credit_cost:
        return jsonify({'error': 'Insufficient credits'}), 400
    
    # Crear redención
    data = request.get_json() or {}
    redemption = RewardRedemption(
        reward_id=reward_id,
        user_id=user_id,
        credits_spent=reward.credit_cost,
        notes=data.get('notes', '')
    )
    
    # Restar créditos del usuario
    user.subtract_credits(reward.credit_cost)
    
    # Actualizar stock si existe
    if reward.stock is not None:
        reward.stock -= 1
    
    db.session.add(redemption)
    db.session.commit()
    
    return jsonify({
        'redemption': redemption.to_dict(),
        'user_score': user.score
    }), 201

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
