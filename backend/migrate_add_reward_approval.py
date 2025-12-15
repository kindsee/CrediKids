"""
Migración: Agregar sistema de aprobación a reward_redemptions
Fecha: 2025-12-15
"""
import sys
import os

# Agregar el directorio backend al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from sqlalchemy import text

def migrate():
    """Agregar campos de aprobación a reward_redemptions"""
    app = create_app()
    
    with app.app_context():
        try:
            # Verificar si ya existen los campos
            result = db.session.execute(text("SHOW COLUMNS FROM reward_redemptions LIKE 'status'"))
            if result.fetchone():
                print("⚠️  Los campos ya existen, saltando migración")
                return
            
            print("📝 Agregando campos de aprobación a reward_redemptions...")
            
            # Agregar columnas
            db.session.execute(text("""
                ALTER TABLE reward_redemptions
                ADD COLUMN status VARCHAR(20) DEFAULT 'pending' AFTER notes,
                ADD COLUMN approved_by_id INT NULL AFTER status,
                ADD COLUMN approved_at DATETIME NULL AFTER approved_by_id,
                ADD COLUMN rejection_reason TEXT NULL AFTER approved_at,
                ADD FOREIGN KEY (approved_by_id) REFERENCES users(id)
            """))
            
            db.session.commit()
            print("✅ Campos agregados exitosamente")
            
            # Actualizar registros existentes a 'approved' 
            print("📝 Actualizando registros existentes a 'approved'...")
            db.session.execute(text("""
                UPDATE reward_redemptions 
                SET status = 'approved'
                WHERE status = 'pending'
            """))
            db.session.commit()
            print("✅ Registros actualizados")
            
        except Exception as e:
            print(f"❌ Error en migración: {str(e)}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    migrate()
    print("\n✅ Migración completada exitosamente")
