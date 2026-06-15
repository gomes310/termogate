# Instruções de Instalação e Uso - Termogate

## 📋 Pré-requisitos

- **Node.js** v16+ (download em [nodejs.org](https://nodejs.org))
- **Python** 3.6+ (para a ponte Serial)
- **Arduino IDE** (para fazer upload do código)
- **Porta USB** para comunicação com Arduino

## 🚀 Instalação Rápida

### 1. Clonar o Repositório

```bash
git clone https://github.com/gomes310/Termogate.git
cd Termogate
```

### 2. Instalar Dependências do Backend

```bash
npm install
```

### 3. Instalar Dependências Python

```bash
pip install pyserial requests
```

### 4. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Editar `.env` conforme necessário:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/termogate
```

## 🔌 Configuração do Hardware

### Conexões do Arduino

Consulte o arquivo `ARDUINO_INTEGRATION.md` para detalhes completos.

Resumo de pinos:
- **Sensor 1**: CLK=6, CS=5, DO=4
- **Sensor 2**: CLK=9, CS=8, DO=7
- **Sensor 3**: CLK=12, CS=11, DO=10
- **Sensor 4**: CLK=A0, CS=A1, DO=A2
- **Sensor 5**: CLK=A3, CS=A4, DO=A5

### Upload do Código Arduino

1. Abrir Arduino IDE
2. Instalar biblioteca: `Max6675` (Sketch → Include Library → Manage Libraries)
3. Abrir arquivo: `arduino/NexusTempMonitor.ino`
4. Selecionar placa e porta COM
5. Fazer upload (Ctrl+U)

## ▶️ Executar o Termogate

### Terminal 1: Backend

```bash
npm run server
```

Saída esperada:
```
✅ Servidor rodando em http://localhost:5000
📊 API disponível em http://localhost:5000/api
```

### Terminal 2: Serial Bridge (Python)

```bash
# Linux/Mac
python3 arduino/serial_bridge.py -p /dev/ttyUSB0

# Windows
python3 arduino/serial_bridge.py -p COM3
```

### Terminal 3: Frontend

```bash
npm run client
```

Acesse: **http://localhost:3000**

## 🎮 Uso do Dashboard

### Dashboard
Veja estatísticas em tempo real:
- Temperatura média
- Temperatura máxima
- Temperatura mínima
- Total de leituras

### Tabela de Dados
Visualize todos os registros com:
- Ordenação por coluna
- Código de cores (Frio/Normal/Quente)
- Exportar como CSV

### Gráficos
Visualize e exporte dados:
- Gráficos de linha ou barra
- Salvar como PNG
- Exportar como PDF
- Gerar relatório completo

### Filtros
Aplique filtros para refinar dados:
- Por período (data/hora)
- Por ID do sensor
- Por faixa de temperatura
- Limpar todos os filtros

## 🧪 Testando a Integração

### 1. Verificar Health Check

```bash
curl http://localhost:5000/api/health
```

Resposta esperada:
```json
{
  "status": "OK",
  "message": "Servidor Termogate rodando normalmente",
  "timestamp": "2024-01-01T12:34:56.789Z",
  "dataPoints": 0,
  "uptime": 123.456
}
```

### 2. Enviar Dados Manualmente (teste)

```bash
curl -X POST http://localhost:5000/api/sensors/data \
  -H "Content-Type: application/json" \
  -d '{
    "sensorId": "SENSOR-001",
    "temperature": 25.5,
    "humidity": 45
  }'
```

### 3. Buscar Dados

```bash
curl http://localhost:5000/api/sensors/data
```

### 4. Buscar Estatísticas

```bash
curl http://localhost:5000/api/sensors/stats
```

## 🔍 Troubleshooting

### Problema: "Erro ao conectar na porta serial"

**Solução:**
```bash
# Linux - listar portas
ls /dev/tty*

# Dar permissão de acesso
sudo chmod 666 /dev/ttyUSB0

# Windows - verificar no Device Manager
```

### Problema: "Connection refused" ao acessar API

**Solução:**
- Verificar se Backend está rodando: `npm run server`
- Confirmar PORT em `.env` (padrão: 5000)
- Confirmar URL no Serial Bridge

### Problema: "Sensores não aparecem no Dashboard"

**Solução:**
1. Verificar Arduino está enviando dados (verificar Serial Monitor)
2. Confirmar que Serial Bridge está rodando
3. Verificar console do Backend para erros
4. Testar curl manualmente

### Problema: "Dados não são salvos"

**Solução:**
- Dados são armazenados em memória
- Para persistência, configurar MongoDB
- Editar `server/server.js` para adicionar banco de dados

## 📊 Estrutura do Projeto

```
Termogate/
├── arduino/
│   ├── NexusTempMonitor.ino      # Código Arduino
│   ├── serial_bridge.py           # Bridge Python
│   └── max6675_config.h           # Configurações
├── server/
│   └── server.js                  # Backend Node.js
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── SensorTable.jsx
│   │   ├── ChartViewer.jsx
│   │   └── FilterPanel.jsx
│   ├── App.jsx
│   └── main.jsx
├── public/
├── index.html
├── vite.config.js
├── package.json
├── .env.example
└── README.md
```

## 🚀 Deploy (Produção)

### Opção 1: Heroku

```bash
heroku create seu-app-name
git push heroku main
```

### Opção 2: DigitalOcean/AWS

```bash
npm run build
npm start
```

### Opção 3: Docker

```bash
docker build -t termogate .
docker run -p 5000:5000 -p 3000:3000 termogate
```

## 📚 Documentação Adicional

- **ARDUINO_INTEGRATION.md** - Detalhes de integração com Arduino
- **FEATURES.md** - Lista de funcionalidades
- **README.md** - Visão geral do projeto

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

MIT

## 👤 Autor

**gomes310**

---

**Versão**: 2.0.0 | **Status**: Em produção com integração Arduino ✅
