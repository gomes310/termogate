#!/bin/bash

# ================================================
# Script de inicialização do Termogate
# Inicia Backend, Frontend e Serial Bridge
# ================================================

echo "======================================================"
echo "  🌡️  TERMOGATE - Inicialização Completa"
echo "======================================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para exibir mensagens
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    print_error "Node.js não encontrado. Instale em https://nodejs.org"
    exit 1
fi
print_status "Node.js encontrado: $(node -v)"

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 não encontrado. Instale Python."
    exit 1
fi
print_status "Python encontrado: $(python3 --version)"

# Instalar dependências Node.js se necessário
if [ ! -d "node_modules" ]; then
    print_info "Instalando dependências Node.js..."
    npm install
    print_status "Dependências Node.js instaladas"
fi

# Verificar dependências Python
print_info "Verificando dependências Python..."
python3 -c "import serial" 2>/dev/null
if [ $? -ne 0 ]; then
    print_info "Instalando pyserial..."
    pip install pyserial requests
    print_status "Dependências Python instaladas"
fi

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    print_info "Criando arquivo .env..."
    cp .env.example .env
    print_status "Arquivo .env criado"
fi

echo ""
echo "======================================================"
echo "  Iniciando componentes do Termogate..."
echo "======================================================"
echo ""

# Função para limpeza ao sair
cleanup() {
    echo ""
    print_info "Encerrando Termogate..."
    kill $BACKEND_PID $FRONTEND_PID $BRIDGE_PID 2>/dev/null
    print_status "Aplicação encerrada"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar Backend
print_info "Iniciando Backend (Node.js)..."
npm run server &
BACKEND_PID=$!
sleep 2
print_status "Backend iniciado (PID: $BACKEND_PID)"

# Aguardar disponibilidade do servidor
echo "Aguardando Backend ficar pronto..."
while ! curl -s http://localhost:5000/api/health > /dev/null; do
    sleep 1
done
print_status "Backend disponível"

# Iniciar Frontend
print_info "Iniciando Frontend (Vite + React)..."
npm run client &
FRONTEND_PID=$!
sleep 3
print_status "Frontend iniciado (PID: $FRONTEND_PID)"

echo ""
echo "======================================================"
echo "  Configuração da Serial Bridge"
echo "======================================================"
echo ""

# Detectar porta serial do Arduino
print_info "Procurando Arduino..."
if [ "$OSTYPE" == "darwin"* ]; then
    # macOS
    SERIAL_PORT=$(ls /dev/tty.usbserial* 2>/dev/null | head -1)
    if [ -z "$SERIAL_PORT" ]; then
        SERIAL_PORT=$(ls /dev/tty.usbmodem* 2>/dev/null | head -1)
    fi
elif [ "$OSTYPE" == "linux-gnu"* ]; then
    # Linux
    SERIAL_PORT=$(ls /dev/ttyUSB* 2>/dev/null | head -1)
    if [ -z "$SERIAL_PORT" ]; then
        SERIAL_PORT=$(ls /dev/ttyACM* 2>/dev/null | head -1)
    fi
fi

if [ -z "$SERIAL_PORT" ]; then
    print_error "Arduino não encontrado. Verifique conexão USB."
    print_info "Você pode conectar o Arduino e executar:"
    print_info "python3 arduino/serial_bridge.py -p /caminho/porta"
else
    print_status "Arduino encontrado em: $SERIAL_PORT"
    
    # Iniciar Serial Bridge
    print_info "Iniciando Serial Bridge (Python)..."
    python3 arduino/serial_bridge.py -p $SERIAL_PORT &
    BRIDGE_PID=$!
    print_status "Serial Bridge iniciado (PID: $BRIDGE_PID)"
fi

echo ""
echo "======================================================"
echo "  🌡️  TERMOGATE INICIADO COM SUCESSO!"
echo "======================================================"
echo ""
print_status "Frontend: http://localhost:3000"
print_status "Backend API: http://localhost:5000/api"
print_status "Health Check: http://localhost:5000/api/health"
echo ""
print_info "Pressione Ctrl+C para encerrar"
echo ""

# Manter script rodando
wait
