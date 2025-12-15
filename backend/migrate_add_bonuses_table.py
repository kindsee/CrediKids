"""
Script de migración para crear tabla de bonuses
"""
from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Creando tabla bonuses...")
    
    try:
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS bonuses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                credits INT NOT NULL,
                description TEXT,
                assigned_by_id INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (assigned_by_id) REFERENCES users(id)
            )
        """))
        
        db.session.commit()
        print("✓ Tabla bonuses creada exitosamente")
        
    except Exception as e:
        print(f"Error durante la migración: {e}")
        db.session.rollback()
