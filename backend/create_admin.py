"""
Script para crear usuario administrador inicial
"""
from app import create_app, db
from models import User

app = create_app()

with app.app_context():
    # Verificar si ya existe el admin
    existing_admin = User.query.filter_by(nick='admin').first()
    if existing_admin:
        print("❌ El usuario 'admin' ya existe!")
        print(f"   Nick: {existing_admin.nick}")
        print(f"   Role: {existing_admin.role}")
        print(f"   Créditos: {existing_admin.score}")
    else:
        # Crear usuario administrador
        admin = User(
            nick='admin',
            figure='👨‍💼',
            role='admin',
            score=0
        )
        admin.set_access_code([1, 2, 3, 4])  # Pato, Ancla, Vaso, Dinosaurio
        db.session.add(admin)
        
        # Crear usuario de prueba
        user = User(
            nick='usuario1',
            figure='👦',
            role='user',
            score=100
        )
        user.set_access_code([5, 6, 7, 8])  # Estrella, Corazón, Árbol, Pelota
        db.session.add(user)
        
        # Guardar en base de datos
        db.session.commit()
        
        print("✅ ¡Usuarios creados correctamente!")
        print("\n" + "="*50)
        print("ADMIN:")
        print("  Nick: admin")
        print("  Iconos: 1=🦆 Pato, 2=⚓ Ancla, 3=🥤 Vaso, 4=🦕 Dinosaurio")
        print("  Créditos: 0")
        print("="*50)
        print("USUARIO DE PRUEBA:")
        print("  Nick: usuario1")
        print("  Iconos: 5=⭐ Estrella, 6=❤️ Corazón, 7=🌲 Árbol, 8=⚽ Pelota")
        print("  Créditos: 100")
        print("="*50)
        print("\n🎯 Ahora puedes iniciar sesión en http://localhost:3000")
        print("   1. Ingresa nick: admin")
        print("   2. Selecciona en orden: Pato → Ancla → Vaso → Dinosaurio")
