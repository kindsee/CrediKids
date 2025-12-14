"""
Script de migración para agregar campos de cancelación a task_assignments
"""
from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Agregando campos is_cancelled y cancelled_at a task_assignments...")
    
    try:
        # Agregar columna is_cancelled
        db.session.execute(text(
            "ALTER TABLE task_assignments ADD COLUMN is_cancelled BOOLEAN DEFAULT FALSE AFTER is_validated"
        ))
        print("✓ Columna is_cancelled agregada")
        
        # Agregar columna cancelled_at
        db.session.execute(text(
            "ALTER TABLE task_assignments ADD COLUMN cancelled_at DATETIME AFTER is_cancelled"
        ))
        print("✓ Columna cancelled_at agregada")
        
        db.session.commit()
        print("✓ Migración completada exitosamente")
        
    except Exception as e:
        print(f"Error durante la migración: {e}")
        db.session.rollback()
