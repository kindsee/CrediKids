#!/usr/bin/env python3
"""
Script de inicialización de base de datos para CrediKids
Crea todas las tablas, seed de iconos y opcionalmente un usuario admin
"""

import sys
import os
from getpass import getpass

# Agregar el directorio backend al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from models import User, Icon

def init_database():
    """Crear todas las tablas de la base de datos"""
    print("=" * 60)
    print("CrediKids - Inicialización de Base de Datos")
    print("=" * 60)
    print()
    
    app = create_app()
    
    with app.app_context():
        print("📦 Creando tablas de base de datos...")
        try:
            db.create_all()
            print("✅ Tablas creadas exitosamente")
        except Exception as e:
            print(f"❌ Error creando tablas: {e}")
            return False
        
        print()
        print("🎨 Inicializando iconos...")
        try:
            seed_icons()
            print("✅ Iconos inicializados correctamente")
        except Exception as e:
            print(f"❌ Error inicializando iconos: {e}")
            return False
        
        print()
        print("👤 ¿Deseas crear un usuario administrador? (s/n): ", end='')
        if input().lower() == 's':
            create_admin_user()
        
        print()
        print("=" * 60)
        print("✅ Inicialización completada exitosamente")
        print("=" * 60)
        print()
        print("Próximos pasos:")
        print("1. Inicia el backend: python app.py")
        print("2. Inicia el frontend: cd ../frontend && npm run dev")
        print("3. Accede a http://localhost:3000")
        print()
        
        return True

def seed_icons():
    """Insertar iconos iniciales si no existen"""
    icons_data = [
        {'code': 'pato', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f986.png'},
        {'code': 'ancla', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2693.png'},
        {'code': 'vaso', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f964.png'},
        {'code': 'dinosaurio', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f995.png'},
        {'code': 'estrella', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2b50.png'},
        {'code': 'corazon', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2764.png'},
        {'code': 'arbol', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f333.png'},
        {'code': 'pelota', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/26bd.png'},
        {'code': 'sol', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2600.png'},
        {'code': 'luna', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f319.png'},
        {'code': 'nube', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2601.png'},
        {'code': 'rayo', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/26a1.png'},
        {'code': 'fuego', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f525.png'},
        {'code': 'agua', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f4a7.png'},
        {'code': 'tierra', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f30d.png'},
        {'code': 'flor', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f33c.png'},
        {'code': 'mariposa', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f98b.png'},
        {'code': 'pez', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f41f.png'},
        {'code': 'avion', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2708.png'},
        {'code': 'cohete', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f680.png'},
        {'code': 'coche', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f697.png'},
        {'code': 'bici', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f6b2.png'},
        {'code': 'tren', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f686.png'},
        {'code': 'barco', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/26f5.png'},
        {'code': 'pizza', 'image_url': 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f355.png'},
    ]
    
    for icon_data in icons_data:
        # Verificar si ya existe
        existing = Icon.query.filter_by(code=icon_data['code']).first()
        if not existing:
            icon = Icon(**icon_data)
            db.session.add(icon)
    
    db.session.commit()
    print(f"   → {len(icons_data)} iconos disponibles")

def create_admin_user():
    """Crear usuario administrador interactivamente"""
    print()
    print("Creando usuario administrador:")
    print("-" * 40)
    
    # Solicitar nick
    while True:
        nick = input("Nick del administrador: ").strip()
        if nick:
            # Verificar si existe
            existing = User.query.filter_by(nick=nick).first()
            if existing:
                print(f"❌ El nick '{nick}' ya existe. Elige otro.")
                continue
            break
        print("❌ El nick no puede estar vacío")
    
    # Solicitar figura (emoji)
    figure = input("Figura/Emoji (default: 👨‍💼): ").strip() or '👨‍💼'
    
    # Mostrar iconos disponibles
    print()
    print("Iconos disponibles para el código de acceso:")
    icons = Icon.query.order_by(Icon.id).all()
    for i, icon in enumerate(icons, 1):
        print(f"  {i:2d}. {icon.code}")
    
    # Solicitar código de 4 iconos
    print()
    print("Selecciona 4 iconos para el código de acceso (separados por espacio)")
    print("Ejemplo: 1 2 3 4")
    
    while True:
        icon_input = input("Iconos (4 números): ").strip()
        try:
            icon_codes = [int(x) for x in icon_input.split()]
            if len(icon_codes) != 4:
                print("❌ Debes seleccionar exactamente 4 iconos")
                continue
            if any(code < 1 or code > len(icons) for code in icon_codes):
                print(f"❌ Los números deben estar entre 1 y {len(icons)}")
                continue
            break
        except ValueError:
            print("❌ Formato inválido. Usa números separados por espacio")
    
    # Crear usuario
    try:
        admin = User(
            nick=nick,
            figure=figure,
            role='admin',
            score=0
        )
        admin.set_access_code(icon_codes)
        db.session.add(admin)
        db.session.commit()
        
        print()
        print("✅ Usuario administrador creado exitosamente")
        print()
        print("Credenciales de acceso:")
        print(f"  Nick: {nick}")
        print(f"  Iconos: {', '.join([icons[i-1].code for i in icon_codes])}")
        print(f"  Códigos: {icon_codes}")
        
    except Exception as e:
        print(f"❌ Error creando usuario: {e}")
        db.session.rollback()

def create_sample_data():
    """Crear datos de ejemplo (opcional)"""
    print()
    print("🎲 ¿Deseas crear datos de ejemplo? (s/n): ", end='')
    if input().lower() != 's':
        return
    
    print("Creando datos de ejemplo...")
    
    # Crear usuario de prueba
    user = User(nick='usuario1', figure='👦', role='user', score=100)
    user.set_access_code([5, 6, 7, 8])
    db.session.add(user)
    
    # Crear tareas de ejemplo
    admin = User.query.filter_by(role='admin').first()
    if admin:
        from models import Task
        
        task1 = Task(
            title='Hacer la cama',
            description='Tender la cama al levantarse',
            task_type='obligatory',
            base_value=10,
            created_by_id=admin.id
        )
        
        task2 = Task(
            title='Ayudar en la cocina',
            description='Ayudar a preparar la comida',
            task_type='special',
            base_value=30,
            created_by_id=admin.id
        )
        
        db.session.add(task1)
        db.session.add(task2)
        
        # Crear premio de ejemplo
        from models import Reward
        
        reward = Reward(
            name='🎮 Videojuego',
            description='1 hora de videojuegos',
            icon='🎮',
            credit_cost=50,
            stock=5,
            created_by_id=admin.id
        )
        db.session.add(reward)
    
    db.session.commit()
    print("✅ Datos de ejemplo creados")

if __name__ == '__main__':
    try:
        success = init_database()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ Operación cancelada por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        sys.exit(1)
