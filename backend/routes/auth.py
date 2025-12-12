from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login solo con código de iconos
    Body: { "icon_codes": [1, 5, 12, 8] }
    """
    data = request.get_json()
    
    if not data or 'icon_codes' not in data:
        return jsonify({'error': 'icon_codes are required'}), 400
    
    icon_codes = data['icon_codes']
    
    if len(icon_codes) != 4:
        return jsonify({'error': 'Icon codes must contain exactly 4 icons'}), 400
    
    # Buscar usuario por código de iconos
    icon_string = ','.join(map(str, icon_codes))
    user = User.query.filter_by(access_code=icon_string, is_active=True).first()
    
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Crear token JWT (identity debe ser string)
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Obtener información del usuario actual"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh():
    """Refrescar información del usuario (obtener score actualizado)"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': user.to_dict()
    }), 200

@auth_bp.route('/change-pin', methods=['POST'])
@jwt_required()
def change_pin():
    """
    Cambiar PIN de iconos
    Body: { "old_icon_codes": [1,2,3,4], "new_icon_codes": [5,6,7,8] }
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if not data or 'old_icon_codes' not in data or 'new_icon_codes' not in data:
        return jsonify({'error': 'old_icon_codes and new_icon_codes are required'}), 400
    
    old_codes = data['old_icon_codes']
    new_codes = data['new_icon_codes']
    
    # Debug logs
    print(f"DEBUG - User: {user.nick}")
    print(f"DEBUG - Current access_code: {user.access_code}")
    print(f"DEBUG - Old codes received: {old_codes}")
    print(f"DEBUG - Old codes type: {type(old_codes)}")
    print(f"DEBUG - New codes received: {new_codes}")
    
    if len(old_codes) != 4 or len(new_codes) != 4:
        return jsonify({'error': 'Icon codes must contain exactly 4 icons'}), 400
    
    # Verificar PIN actual
    if not user.verify_access_code(old_codes):
        print(f"DEBUG - PIN verification failed!")
        print(f"DEBUG - Expected: {user.access_code}")
        provided_code = ','.join(map(str, old_codes))
        print(f"DEBUG - Provided: {provided_code}")
        return jsonify({'error': 'Current PIN is incorrect'}), 401
    
    # Establecer nuevo PIN
    user.set_access_code(new_codes)
    db.session.commit()
    
    print(f"DEBUG - PIN changed successfully to: {user.access_code}")
    
    return jsonify({
        'message': 'PIN changed successfully',
        'user': user.to_dict()
    }), 200
