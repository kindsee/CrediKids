from flask import Blueprint, jsonify
from models import db, Icon

icons_bp = Blueprint('icons', __name__)

@icons_bp.route('', methods=['GET'])
def get_icons():
    """Obtener lista de iconos disponibles para códigos de acceso"""
    icons = Icon.query.order_by(Icon.display_order).all()
    return jsonify([icon.to_dict() for icon in icons]), 200

@icons_bp.route('/seed', methods=['POST'])
def seed_icons():
    """Inicializar 25 iconos por defecto (solo para desarrollo)"""
    # Verificar si ya existen iconos
    if Icon.query.count() > 0:
        return jsonify({'message': 'Icons already seeded'}), 200
    
    # 25 emojis/iconos por defecto
    default_icons = [
        ('Pato', '🦆'),
        ('Ancla', '⚓'),
        ('Vaso', '🥤'),
        ('Dinosaurio', '🦕'),
        ('Estrella', '⭐'),
        ('Corazón', '❤️'),
        ('Árbol', '🌳'),
        ('Pelota', '⚽'),
        ('Guitarra', '🎸'),
        ('Cohete', '🚀'),
        ('Pizza', '🍕'),
        ('Helado', '🍦'),
        ('Libro', '📚'),
        ('Bicicleta', '🚲'),
        ('Avión', '✈️'),
        ('Gato', '🐱'),
        ('Perro', '🐶'),
        ('Luna', '🌙'),
        ('Sol', '☀️'),
        ('Nube', '☁️'),
        ('Paraguas', '☂️'),
        ('Llave', '🔑'),
        ('Corona', '👑'),
        ('Trofeo', '🏆'),
        ('Diamante', '💎')
    ]
    
    for i, (name, emoji) in enumerate(default_icons, start=1):
        icon = Icon(
            name=name,
            icon_path=emoji,
            display_order=i
        )
        db.session.add(icon)
    
    db.session.commit()
    
    return jsonify({'message': f'{len(default_icons)} icons seeded successfully'}), 201
