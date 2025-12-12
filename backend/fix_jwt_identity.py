"""Script para actualizar todos los get_jwt_identity() en los archivos de rutas"""
import os
import re

# Archivos a actualizar
files = [
    'routes/users.py',
    'routes/tasks.py',
    'routes/rewards.py',
    'routes/calendar.py'
]

for file in files:
    filepath = os.path.join(os.path.dirname(__file__), file)
    
    if not os.path.exists(filepath):
        print(f"❌ No encontrado: {file}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Reemplazar todas las instancias de "= get_jwt_identity()" con "= int(get_jwt_identity())"
    # pero solo si no están ya envueltas en int()
    original_content = content
    
    # Patrón: captura variable_name = get_jwt_identity() (sin int ya presente)
    pattern = r'(\w+)\s*=\s*get_jwt_identity\(\)'
    
    def replace_func(match):
        var_name = match.group(1)
        return f"{var_name} = int(get_jwt_identity())"
    
    content = re.sub(pattern, replace_func, content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        changes = content.count('int(get_jwt_identity())') - original_content.count('int(get_jwt_identity())')
        print(f"✅ {file}: {changes} cambios realizados")
    else:
        print(f"ℹ️  {file}: Sin cambios necesarios")

print("\n✅ Actualización completada!")
