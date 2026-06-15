@echo off
REM ================================================
REM Script de inicialização do Termogate (Windows)
REM Inicia Backend, Frontend e Serial Bridge
REM ================================================

echo ======================================================
echo   TERMOGATE - Inicializacao Completa (Windows)
echo ======================================================
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js encontrado

REM Verificar se Python está instalado
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Python nao encontrado. Instale Python.
    pause
    exit /b 1
else
    echo [OK] Python encontrado
fi

REM Instalar dependências Node.js se necessário
if not exist "node_modules" (
    echo [INFO] Instalando dependências Node.js...
    call npm install
    echo [OK] Dependências Node.js instaladas
)

REM Criar arquivo .env se não existir
if not exist ".env" (
    echo [INFO] Criando arquivo .env...
    copy .env.example .env
    echo [OK] Arquivo .env criado
)

echo.
echo ======================================================
echo   Iniciando componentes do Termogate...
echo ======================================================
echo.

REM Iniciar Backend
echo [INFO] Iniciando Backend (Node.js)...
start "Termogate Backend" cmd /k npm run server
timeout /t 3 /nobreak
echo [OK] Backend iniciado

REM Iniciar Frontend
echo [INFO] Iniciando Frontend (Vite + React)...
start "Termogate Frontend" cmd /k npm run client
timeout /t 3 /nobreak
echo [OK] Frontend iniciado

echo.
echo ======================================================
echo   TERMOGATE INICIADO COM SUCESSO!
echo ======================================================
echo.
echo [OK] Frontend: http://localhost:3000
echo [OK] Backend API: http://localhost:5000/api
echo [OK] Health Check: http://localhost:5000/api/health
echo.
echo [INFO] Para usar Arduino, execute em outro terminal:
echo   python serial_bridge.py -p COM3
echo.
echo [INFO] Pressione qualquer tecla para fechar...
pause
