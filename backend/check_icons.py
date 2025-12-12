"""Script para verificar si los iconos están inicializados en la base de datos"""
from app import create_app, db
from models import Icon

app = create_app()

with app.app_context():
    icons = Icon.query.all()
    
    if not icons:
        print("❌ No hay iconos en la base de datos")
        print("\nPara inicializar los iconos, ejecuta:")
        print("  curl -X POST http://localhost:5001/api/icons/seed")
        print("\nO desde Python:")
        print("  from app import create_app")
        print("  from routes.icons import seed_icons_data")
        print("  app = create_app()")
        print("  with app.app_context():")
        print("    seed_icons_data()")
    else:
        print(f"✅ Hay {len(icons)} iconos en la base de datos:")
        print("\nID | Nombre     | Ícono")
        print("-" * 35)
        for icon in icons:
            print(f"{icon.id:2d} | {icon.name:10s} | {icon.icon_path}")
