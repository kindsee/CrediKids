#!/bin/bash
# Script de actualización rápida en el servidor

echo "🔄 Actualizando CrediKids..."

# Pull cambios de GitHub
git pull origin main

# Backend
echo "📦 Actualizando backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-prod.txt
cd ..

# Frontend
echo "🎨 Compilando frontend..."
cd frontend
npm install
npm run build
cd ..

# Reiniciar servicios
echo "🔄 Reiniciando servicios..."
sudo systemctl restart credikids-backend
sudo systemctl reload nginx

echo "✅ Actualización completada!"
echo "📊 Estado de los servicios:"
sudo systemctl status credikids-backend --no-pager -l
