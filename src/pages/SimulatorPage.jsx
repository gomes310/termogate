import { useState, useEffect } from 'react'
import './SimulatorPage.css'

export default function SimulatorPage() {
  const [simulatorRunning, setSimulatorRunning] = useState(false)
  const [simulatorData, setSimulatorData] = useState([])
  const [stats, setStats] = useState({
    avgTemp: 0,
    maxTemp: 0,
    minTemp: 0,
    totalReadings: 0
  })
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const [showChart, setShowChart] = useState(true)
  const [alerts, setAlerts] = useState([])

  // IDs dos sensores e seus padrões
  const sensors = [
    { id: 'SENSOR-001', name: 'Câmara Fria', minTemp: 8, maxTemp: 12, normal: 10 },
    { id: 'SENSOR-002', name: 'Congelador', minTemp: -18, maxTemp: -15, normal: -18 },
    { id: 'SENSOR-003', name: 'Cozinha', minTemp: 20, maxTemp: 28, normal: 24 },
    { id: 'SENSOR-004', name: 'Estufa', minTemp: 28, maxTemp: 35, normal: 32 },
    { id: 'SENSOR-005', name: 'Exterior', minTemp: 15, maxTemp: 30, normal: 22 }
  ]

  // Gerar leitura realista com variação
  const generateReading = (sensor) => {
    const variance = (Math.random() - 0.5) * 2
    const temp = sensor.normal + variance
    return {
      sensorId: sensor.id,
      sensorName: sensor.name,
      temperature: parseFloat(temp.toFixed(2)),
      humidity: parseFloat((45 + Math.random() * 30).toFixed(1)),
      timestamp: new Date().toISOString()
    }
  }

  // Iniciar/Parar simulação
  useEffect(() => {
    if (!simulatorRunning) return

    const interval = setInterval(() => {
      // Gerar dados para todos os sensores
      const newReadings = sensors.map(sensor => generateReading(sensor))
      
      setSimulatorData(prev => {
        const updated = [...prev, ...newReadings]
        // Manter apenas últimas 300 leituras
        return updated.slice(-300)
      })

      // Atualizar estatísticas
      const allTemps = simulatorData.map(d => d.temperature)
      if (allTemps.length > 0) {
        setStats({
          avgTemp: parseFloat((allTemps.reduce((a, b) => a + b, 0) / allTemps.length).toFixed(2)),
          maxTemp: Math.max(...allTemps),
          minTemp: Math.min(...allTemps),
          totalReadings: simulatorData.length
        })
      }

      // Verificar alertas
      checkAlerts(newReadings)
    }, 2000 / simulationSpeed)

    return () => clearInterval(interval)
  }, [simulatorRunning, simulatorData, simulationSpeed])

  // Verificar alertas de temperatura
  const checkAlerts = (readings) => {
    const newAlerts = []
    
    readings.forEach(reading => {
      const sensor = sensors.find(s => s.id === reading.sensorId)
      if (!sensor) return

      if (reading.temperature < sensor.minTemp) {
        newAlerts.push({
          id: Date.now() + Math.random(),
          type: 'cold',
          message: `⚠️ ${sensor.name}: Temperatura BAIXA (${reading.temperature}°C)`,
          sensor: reading.sensorId,
          time: new Date().toLocaleTimeString('pt-BR')
        })
      } else if (reading.temperature > sensor.maxTemp) {
        newAlerts.push({
          id: Date.now() + Math.random(),
          type: 'hot',
          message: `🔥 ${sensor.name}: Temperatura ALTA (${reading.temperature}°C)`,
          sensor: reading.sensorId,
          time: new Date().toLocaleTimeString('pt-BR')
        })
      }
    })

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts].slice(-10))
    }
  }

  // Limpar dados
  const handleClearData = () => {
    setSimulatorData([])
    setAlerts([])
    setStats({
      avgTemp: 0,
      maxTemp: 0,
      minTemp: 0,
      totalReadings: 0
    })
  }

  // Obter última leitura por sensor
  const getLatestBySensor = (sensorId) => {
    const readings = simulatorData.filter(d => d.sensorId === sensorId)
    return readings.length > 0 ? readings[readings.length - 1] : null
  }

  // Gráfico simples
  const renderChart = () => {
    if (!showChart || simulatorData.length === 0) return null

    const recentData = simulatorData.slice(-50)
    const maxTemp = Math.max(...simulatorData.map(d => d.temperature))
    const minTemp = Math.min(...simulatorData.map(d => d.temperature))
    const range = maxTemp - minTemp || 1

    return (
      <div className="chart-container">
        <h3>📈 Gráfico de Temperatura (Últimas 50 leituras)</h3>
        <svg viewBox="0 0 800 300" className="chart-svg">
          {/* Grade de fundo */}
          {Array.from({ length: 10 }).map((_, i) => (
            <line
              key={`grid-${i}`}
              x1="50"
              y1={30 + i * 24}
              x2="750"
              y2={30 + i * 24}
              stroke="#eee"
              strokeWidth="1"
            />
          ))}

          {/* Eixos */}
          <line x1="50" y1="30" x2="50" y2="270" stroke="black" strokeWidth="2" />
          <line x1="50" y1="270" x2="750" y2="270" stroke="black" strokeWidth="2" />

          {/* Linhas por sensor */}
          {sensors.map((sensor, sensorIdx) => {
            const sensorData = recentData.filter(d => d.sensorId === sensor.id)
            if (sensorData.length === 0) return null

            const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6']
            const color = colors[sensorIdx]

            return (
              <g key={sensor.id}>
                {sensorData.map((reading, idx) => {
                  const x = 50 + (idx * 700) / Math.max(50, recentData.length)
                  const y = 270 - ((reading.temperature - minTemp) / range) * 240
                  return (
                    <circle key={`${sensor.id}-${idx}`} cx={x} cy={y} r="3" fill={color} />
                  )
                })}

                {/* Linha conectando pontos */}
                {sensorData.length > 1 && (
                  <polyline
                    points={sensorData
                      .map((reading, idx) => {
                        const x = 50 + (idx * 700) / Math.max(50, recentData.length)
                        const y = 270 - ((reading.temperature - minTemp) / range) * 240
                        return `${x},${y}`
                      })
                      .join(' ')}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    opacity="0.7"
                  />
                )}
              </g>
            )
          })}
        </svg>

        <div className="chart-legend">
          {sensors.map((sensor, idx) => {
            const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6']
            return (
              <div key={sensor.id} className="legend-item">
                <span style={{ backgroundColor: colors[idx] }} className="legend-color"></span>
                {sensor.name}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="simulator-page">
      <header className="simulator-header">
        <h1>🎮 Simulador Termogate</h1>
        <p>Simule o funcionamento do sistema com dados realistas</p>
      </header>

      <div className="simulator-container">
        {/* Controles */}
        <div className="simulator-controls">
          <div className="control-group">
            <label>Estado da Simulação:</label>
            <button
              className={`control-btn ${simulatorRunning ? 'stop' : 'start'}`}
              onClick={() => setSimulatorRunning(!simulatorRunning)}
            >
              {simulatorRunning ? '⏸️ Pausar' : '▶️ Iniciar'}
            </button>
          </div>

          <div className="control-group">
            <label>Velocidade:</label>
            <select
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(Number(e.target.value))}
              className="control-select"
            >
              <option value={0.5}>0.5x (Lento)</option>
              <option value={1}>1x (Normal)</option>
              <option value={2}>2x (Rápido)</option>
              <option value={5}>5x (Muito Rápido)</option>
            </select>
          </div>

          <div className="control-group">
            <label>Visualização:</label>
            <button
              className={`control-btn ${showChart ? 'active' : ''}`}
              onClick={() => setShowChart(!showChart)}
            >
              {showChart ? '📉 Esconder Gráfico' : '📊 Mostrar Gráfico'}
            </button>
          </div>

          <button className="control-btn danger" onClick={handleClearData}>
            🗑️ Limpar Dados
          </button>
        </div>

        {/* Estatísticas */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Temperatura Média</h3>
              <p className="stat-value">{stats.avgTemp}°C</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔺</div>
            <div className="stat-content">
              <h3>Temperatura Máxima</h3>
              <p className="stat-value">{stats.maxTemp}°C</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔻</div>
            <div className="stat-content">
              <h3>Temperatura Mínima</h3>
              <p className="stat-value">{stats.minTemp}°C</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>Total de Leituras</h3>
              <p className="stat-value">{stats.totalReadings}</p>
            </div>
          </div>
        </div>

        {/* Sensores em tempo real */}
        <div className="sensors-section">
          <h2>🌡️ Status dos Sensores em Tempo Real</h2>
          <div className="sensors-grid">
            {sensors.map((sensor, idx) => {
              const reading = getLatestBySensor(sensor.id)
              const isAlert =
                reading &&
                (reading.temperature < sensor.minTemp || reading.temperature > sensor.maxTemp)

              return (
                <div
                  key={sensor.id}
                  className={`sensor-card ${isAlert ? 'alert' : ''}`}
                >
                  <div className="sensor-header">
                    <h3>{sensor.name}</h3>
                    <span className="sensor-id">{sensor.id}</span>
                  </div>

                  {reading ? (
                    <div className="sensor-data">
                      <div className="temp-display">
                        <span className="temp-value">{reading.temperature.toFixed(2)}°C</span>
                        <span className="temp-range">
                          ({sensor.minTemp}°C - {sensor.maxTemp}°C)
                        </span>
                      </div>

                      <div className="temp-bar">
                        <div className="temp-bar-fill" style={{ width: `${Math.min(100, Math.max(0, ((reading.temperature - sensor.minTemp) / (sensor.maxTemp - sensor.minTemp)) * 100))}%` }}></div>
                      </div>

                      <div className="sensor-info">
                        <p>💧 Umidade: {reading.humidity.toFixed(1)}%</p>
                        <p>⏰ {new Date(reading.timestamp).toLocaleTimeString('pt-BR')}</p>
                      </div>

                      {isAlert && (
                        <div className="alert-badge">
                          {reading.temperature < sensor.minTemp ? '❄️ MUITO FRIO' : '🔥 MUITO QUENTE'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="no-data">
                      <p>Aguardando dados...</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Gráfico */}
        {renderChart()}

        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="alerts-section">
            <h2>⚠️ Alertas ({alerts.length})</h2>
            <div className="alerts-list">
              {alerts.map((alert) => (
                <div key={alert.id} className={`alert-item alert-${alert.type}`}>
                  <span className="alert-time">{alert.time}</span>
                  <span className="alert-message">{alert.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informações */}
        <div className="info-section">
          <h2>📌 Informações da Simulação</h2>
          <div className="info-box">
            <h3>✨ Recursos da Simulação</h3>
            <ul>
              <li>✓ 5 sensores simulados com padrões realistas</li>
              <li>✓ Variação de temperatura natural</li>
              <li>✓ Sistema de alertas para temperaturas fora do range</li>
              <li>✓ Gráfico em tempo real</li>
              <li>✓ Histórico de até 300 leituras</li>
              <li>✓ Controle de velocidade de simulação</li>
            </ul>

            <h3 style={{ marginTop: '1.5rem' }}>💡 Melhorias Sugeridas</h3>
            <ul>
              <li>📊 Exportar gráficos em alta resolução</li>
              <li>🔔 Notificações push para alertas críticos</li>
              <li>📝 Relatórios automáticos diários/semanais</li>
              <li>🔐 Autenticação de usuários</li>
              <li>📱 App mobile responsivo</li>
              <li>🌙 Modo escuro</li>
              <li>📍 Geolocalização dos sensores</li>
              <li>🤖 Previsão com IA/ML</li>
              <li>🔄 Sincronização em tempo real com WebSocket</li>
              <li>📊 Dashboard customizável</li>
            </ul>

            <h3 style={{ marginTop: '1.5rem' }}>🎯 Casos de Uso</h3>
            <ul>
              <li>🏪 Monitoramento de câmaras frigoríficas em supermercados</li>
              <li>🏥 Controle de temperatura em farmácias</li>
              <li>🏭 Monitoramento em indústrias</li>
              <li>🏠 Controle de temperatura residencial</li>
              <li>🌱 Monitoramento de estufas agrícolas</li>
              <li>🧊 Congeladores e refrigeradores comerciais</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
