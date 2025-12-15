"""
Script de prueba para verificar endpoints de validación de tareas
Ejecutar desde: python test_endpoints.py
"""
import requests
import json

BASE_URL = 'http://localhost:5000/api'

def test_login():
    """Login como admin para obtener token"""
    response = requests.post(f'{BASE_URL}/auth/login', json={
        'nick': 'admin',
        'icon_codes': [1, 2, 3, 4]
    })
    if response.status_code == 200:
        token = response.json().get('access_token')
        print('✅ Login exitoso')
        return token
    else:
        print(f'❌ Login falló: {response.status_code}')
        print(response.text)
        return None

def test_pending_validations(token):
    """Probar endpoint de validaciones pendientes"""
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{BASE_URL}/tasks/completions/pending-validation', headers=headers)
    
    print(f'\n📋 Pendientes de validación: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        print(f'✅ {data["count"]} tareas pendientes')
    else:
        print(f'❌ Error: {response.text}')

def test_cancelled_assignments(token):
    """Probar endpoint de tareas canceladas"""
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{BASE_URL}/tasks/assignments/cancelled', headers=headers)
    
    print(f'\n🚫 Tareas canceladas: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        print(f'✅ {data["count"]} tareas canceladas')
    else:
        print(f'❌ Error: {response.text}')

def test_assign_bonus(token, user_id=2):
    """Probar endpoint de asignación de bonus"""
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.post(
        f'{BASE_URL}/tasks/users/{user_id}/bonus',
        headers=headers,
        json={
            'credits': 50,
            'description': 'Bonus de prueba'
        }
    )
    
    print(f'\n🎁 Asignar bonus: {response.status_code}')
    if response.status_code == 200:
        print('✅ Bonus asignado correctamente')
    else:
        print(f'❌ Error: {response.text}')

if __name__ == '__main__':
    print('🧪 Probando endpoints de validación de tareas...\n')
    
    token = test_login()
    if token:
        test_pending_validations(token)
        test_cancelled_assignments(token)
        # test_assign_bonus(token)  # Comentado para no asignar bonus en cada prueba
        
        print('\n✅ Pruebas completadas!')
    else:
        print('\n❌ No se pudo obtener token, verifica que el backend esté corriendo')
