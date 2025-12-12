"""
Script para inicializar datos de prueba en CrediKids
Ejecutar después de crear la base de datos
"""

from app import create_app, db
from models import User, Task, Reward, TaskType, TaskFrequency

def seed_data():
    app = create_app()
    
    with app.app_context():
        print("🌱 Iniciando seed de datos...")
        
        # 1. Crear usuarios
        print("\n👥 Creando usuarios...")
        
        admin = User(nick='admin', figure='👨‍💼', role='admin', score=0)
        admin.set_access_code([1, 2, 3, 4])  # Pato, Ancla, Vaso, Dinosaurio
        db.session.add(admin)
        print("  ✅ Admin creado: nick='admin', iconos=[1,2,3,4]")
        
        user1 = User(nick='juan', figure='👦', role='user', score=100)
        user1.set_access_code([5, 6, 7, 8])  # Estrella, Corazón, Árbol, Pelota
        db.session.add(user1)
        print("  ✅ Usuario creado: nick='juan', iconos=[5,6,7,8]")
        
        user2 = User(nick='maria', figure='👧', role='user', score=150)
        user2.set_access_code([9, 10, 11, 12])  # Guitarra, Cohete, Pizza, Helado
        db.session.add(user2)
        print("  ✅ Usuario creado: nick='maria', iconos=[9,10,11,12]")
        
        db.session.flush()
        
        # 2. Crear tareas de ejemplo
        print("\n📋 Creando tareas de ejemplo...")
        
        # Tarea obligatoria
        task1 = Task(
            title='Ordenar tu cuarto',
            description='Hacer la cama, recoger juguetes y ropa',
            task_type=TaskType.OBLIGATORY,
            frequency=TaskFrequency.DAILY,
            base_value=50,
            created_by_id=admin.id
        )
        db.session.add(task1)
        print("  ✅ Tarea obligatoria: Ordenar tu cuarto (50 créditos de penalización)")
        
        # Tarea especial
        task2 = Task(
            title='Ayudar con la cena',
            description='Poner la mesa y ayudar a cocinar',
            task_type=TaskType.SPECIAL,
            frequency=TaskFrequency.WEEKLY,
            base_value=100,
            created_by_id=admin.id
        )
        db.session.add(task2)
        print("  ✅ Tarea especial: Ayudar con la cena (100 créditos)")
        
        task3 = Task(
            title='Hacer deberes',
            description='Completar todas las tareas escolares',
            task_type=TaskType.OBLIGATORY,
            frequency=TaskFrequency.DAILY,
            base_value=30,
            created_by_id=admin.id
        )
        db.session.add(task3)
        print("  ✅ Tarea obligatoria: Hacer deberes (30 créditos de penalización)")
        
        task4 = Task(
            title='Leer 30 minutos',
            description='Leer un libro o cómic durante 30 minutos',
            task_type=TaskType.SPECIAL,
            frequency=TaskFrequency.DAILY,
            base_value=80,
            created_by_id=admin.id
        )
        db.session.add(task4)
        print("  ✅ Tarea especial: Leer 30 minutos (80 créditos)")
        
        # 3. Crear premios de ejemplo
        print("\n🎁 Creando premios de ejemplo...")
        
        reward1 = Reward(
            name='1 hora de videojuegos',
            description='Tiempo extra para jugar a tus juegos favoritos',
            icon='🎮',
            credit_cost=200,
            created_by_id=admin.id
        )
        db.session.add(reward1)
        print("  ✅ Premio: 1 hora de videojuegos (200 créditos)")
        
        reward2 = Reward(
            name='Película en familia',
            description='Elegir la película para ver en familia',
            icon='🍿',
            credit_cost=150,
            created_by_id=admin.id
        )
        db.session.add(reward2)
        print("  ✅ Premio: Película en familia (150 créditos)")
        
        reward3 = Reward(
            name='Postre especial',
            description='Tu postre favorito después de cenar',
            icon='🍰',
            credit_cost=80,
            created_by_id=admin.id
        )
        db.session.add(reward3)
        print("  ✅ Premio: Postre especial (80 créditos)")
        
        reward4 = Reward(
            name='Salida al parque',
            description='Ir al parque de juegos el fin de semana',
            icon='🎪',
            credit_cost=300,
            created_by_id=admin.id
        )
        db.session.add(reward4)
        print("  ✅ Premio: Salida al parque (300 créditos)")
        
        reward5 = Reward(
            name='Juguete nuevo',
            description='Un juguete nuevo de hasta 20€',
            icon='🎁',
            credit_cost=500,
            stock=3,
            created_by_id=admin.id
        )
        db.session.add(reward5)
        print("  ✅ Premio: Juguete nuevo (500 créditos, stock: 3)")
        
        # Guardar todo
        db.session.commit()
        
        print("\n✨ ¡Seed completado exitosamente!")
        print("\n" + "="*50)
        print("USUARIOS CREADOS:")
        print("="*50)
        print("👨‍💼 Admin:")
        print("   Nick: 'admin'")
        print("   Iconos: [1, 2, 3, 4] (Pato, Ancla, Vaso, Dinosaurio)")
        print("\n👦 Usuario Juan:")
        print("   Nick: 'juan'")
        print("   Iconos: [5, 6, 7, 8] (Estrella, Corazón, Árbol, Pelota)")
        print("   Créditos: 100")
        print("\n👧 Usuario María:")
        print("   Nick: 'maria'")
        print("   Iconos: [9, 10, 11, 12] (Guitarra, Cohete, Pizza, Helado)")
        print("   Créditos: 150")
        print("\n" + "="*50)
        print("TAREAS CREADAS:")
        print("="*50)
        print("📋 2 tareas obligatorias (penalizan si no se hacen)")
        print("📋 2 tareas especiales (dan créditos)")
        print("\n" + "="*50)
        print("PREMIOS CREADOS:")
        print("="*50)
        print("🎁 5 premios disponibles (80 - 500 créditos)")
        print("\n" + "="*50)
        print("\n🚀 Ya puedes iniciar sesión en http://localhost:3000")
        print("   Usa 'admin' con iconos [1,2,3,4] o")
        print("   'juan' con iconos [5,6,7,8]")

if __name__ == '__main__':
    try:
        seed_data()
    except Exception as e:
        print(f"\n❌ Error durante el seed: {e}")
        print("Asegúrate de que:")
        print("  1. La base de datos existe")
        print("  2. El archivo .env está configurado")
        print("  3. Los iconos están inicializados (POST /api/icons/seed)")
