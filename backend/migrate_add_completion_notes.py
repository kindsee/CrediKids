"""
Script para agregar la columna completion_notes a task_completions
Ejecutar con: python migrate_add_completion_notes.py
"""
from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        # Verificar si la columna ya existe
        result = db.session.execute(text(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() "
            "AND TABLE_NAME = 'task_completions' "
            "AND COLUMN_NAME = 'completion_notes'"
        ))
        exists = result.scalar() > 0
        
        if exists:
            print("✅ La columna 'completion_notes' ya existe en la tabla 'task_completions'")
        else:
            print("⏳ Agregando columna 'completion_notes' a la tabla 'task_completions'...")
            db.session.execute(text(
                "ALTER TABLE task_completions "
                "ADD COLUMN completion_notes TEXT AFTER completed_at"
            ))
            db.session.commit()
            print("✅ Columna 'completion_notes' agregada exitosamente!")
            
        # Mostrar estructura de la tabla
        print("\n📋 Estructura actual de task_completions:")
        result = db.session.execute(text("DESCRIBE task_completions"))
        for row in result:
            print(f"  - {row[0]}: {row[1]}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        db.session.rollback()
