#!/bin/bash
# Script de verificación rápida del backend en producción

echo "🔍 Verificando endpoints de CrediKids..."
echo ""

# Base URL del backend
BASE_URL="http://localhost:5001/api"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar endpoint
check_endpoint() {
    local endpoint=$1
    local expected_code=$2
    local description=$3
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    
    if [ "$response" == "$expected_code" ]; then
        echo -e "${GREEN}✓${NC} $description - Status: $response"
    else
        echo -e "${RED}✗${NC} $description - Expected: $expected_code, Got: $response"
    fi
}

# Verificar endpoints públicos (sin autenticación)
echo "📡 Endpoints públicos:"
check_endpoint "/icons" "200" "GET /icons"
echo ""

# Verificar endpoints que requieren auth (esperamos 401)
echo "🔐 Endpoints protegidos (deben dar 401 sin token):"
check_endpoint "/tasks/completions/pending-validation" "401" "GET /tasks/completions/pending-validation"
check_endpoint "/tasks/assignments/cancelled" "401" "GET /tasks/assignments/cancelled"
check_endpoint "/calendar/user/1/cancelled?limit=30" "401" "GET /calendar/user/1/cancelled"
check_endpoint "/calendar/user/1/pending" "401" "GET /calendar/user/1/pending"
check_endpoint "/calendar/user/1/completed?limit=30" "401" "GET /calendar/user/1/completed"
echo ""

# Verificar servicio está corriendo
echo "🚀 Estado del servicio:"
if systemctl is-active --quiet credikids-backend; then
    echo -e "${GREEN}✓${NC} Backend service está corriendo"
else
    echo -e "${RED}✗${NC} Backend service NO está corriendo"
    echo "   Inicia con: sudo systemctl start credikids-backend"
fi

# Verificar puerto está escuchando
if netstat -tuln | grep -q ":5001"; then
    echo -e "${GREEN}✓${NC} Puerto 5001 está escuchando"
else
    echo -e "${RED}✗${NC} Puerto 5001 NO está escuchando"
fi

echo ""
echo "📋 Para ver logs del backend:"
echo "   sudo journalctl -u credikids-backend -n 50 --no-pager"
echo ""
echo "📋 Para ver logs de Apache:"
echo "   sudo tail -50 /var/log/apache2/credikids-error.log"
