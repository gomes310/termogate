// ========================================================
// NEXUS TEMP MONITOR - 5x MAX6675 (K-type)
// Versão 2 - Otimizada e corrigida
// Integrada ao Termogate Dashboard
// ========================================================

#include "max6675.h"

// ==================== PINOS ====================
const uint8_t CLK_PINS[5] = {6, 9, 12, A0, A3};
const uint8_t CS_PINS[5]  = {5, 8, 11, A1, A4};
const uint8_t DO_PINS[5]  = {4, 7, 10, A2, A5};

MAX6675* sensores[5];

// ==================== CONFIGURAÇÃO ====================
const float ALFA_FILTRO = 0.25;           // Filtro exponencial
const unsigned long INTERVALO_LEITURA = 300;   // ms entre leituras
const unsigned long INTERVALO_EXIBICAO = 1000; // ms entre envios de dados

// IDs dos sensores para identificação
const char* SENSOR_IDS[5] = {"SENSOR-001", "SENSOR-002", "SENSOR-003", "SENSOR-004", "SENSOR-005"};

struct SensorData {
  bool conectado = false;
  float tempCrua = 0.0;
  float tempFiltrada = 0.0;
  float umidade = 0.0;  // Para expansão futura
  unsigned long ultimaLeituraValida = 0;
};

SensorData dados[5];

unsigned long ultimaExibicao = 0;
unsigned long ultimaLeitura = 0;

// ==================== SETUP ====================
void setup() {
  Serial.begin(9600);
  while (!Serial) delay(10);

  Serial.println(F("\n========================================="));
  Serial.println(F("   NEXUS TEMP MONITOR - 5x MAX6675   "));
  Serial.println(F("   Integrado ao Termogate Dashboard"));
  Serial.println(F("=========================================\n"));

  // Cria os objetos dos sensores
  for (int i = 0; i < 5; i++) {
    sensores[i] = new MAX6675(CLK_PINS[i], CS_PINS[i], DO_PINS[i]);
    dados[i].conectado = false;
    dados[i].tempFiltrada = 0.0;
  }

  Serial.println(F("Aguardando estabilização dos MAX6675..."));
  delay(800);

  // Teste inicial
  Serial.println(F("Detectando sensores..."));
  for (int i = 0; i < 5; i++) {
    delay(300);
    float t = sensores[i]->readCelsius();

    if (t > -10 && t < 1350) {
      dados[i].conectado = true;
      dados[i].tempFiltrada = t;
      Serial.print(F("Sensor "));
      Serial.print(i+1);
      Serial.print(F(": CONECTADO ("));
      Serial.print(SENSOR_IDS[i]);
      Serial.print(F(") → "));
      Serial.print(t, 2);
      Serial.println(F(" °C"));
    } else {
      Serial.print(F("Sensor "));
      Serial.print(i+1);
      Serial.println(F(": DESCONECTADO ou falha"));
    }
  }

  Serial.println(F("\nSistema iniciado! Enviando dados em formato JSON para Termogate..."));
  Serial.println(F("=========================================\n"));
}

// ==================== LOOP ====================
void loop() {
  unsigned long agora = millis();

  // Leitura periódica (não bloqueante)
  if (agora - ultimaLeitura >= INTERVALO_LEITURA) {
    lerTodosSensores();
    ultimaLeitura = agora;
  }

  // Envio de dados em JSON para o backend
  if (agora - ultimaExibicao >= INTERVALO_EXIBICAO) {
    enviarDadosJSON();
    ultimaExibicao = agora;
  }
}

// ==================== FUNÇÕES ====================
void lerTodosSensores() {
  for (int i = 0; i < 5; i++) {
    float leitura = sensores[i]->readCelsius();

    if (leitura > -10 && leitura < 1350) {
      dados[i].conectado = true;
      dados[i].tempCrua = leitura;
      dados[i].ultimaLeituraValida = millis();

      // Filtro exponencial
      if (dados[i].tempFiltrada == 0.0) {
        dados[i].tempFiltrada = leitura;
      } else {
        dados[i].tempFiltrada = ALFA_FILTRO * leitura + (1 - ALFA_FILTRO) * dados[i].tempFiltrada;
      }
    } else {
      dados[i].conectado = false;
      dados[i].tempFiltrada = 0.0;
    }

    delay(10);
  }
}

void enviarDadosJSON() {
  int conectados = 0;
  for (int i = 0; i < 5; i++) if (dados[i].conectado) conectados++;

  // Exibição em tabela
  Serial.println(F("\n========================================="));
  Serial.print(F(">>> LEITURA @ "));
  exibirTempoDecorrido();
  Serial.println(F(" <<<"));

  Serial.println(F("Sensor | ID         | Status     | Temperatura"));
  Serial.println(F("-------+------------+------------+-------------"));

  for (int i = 0; i < 5; i++) {
    Serial.print(F("  "));
    Serial.print(i+1);
    Serial.print(F("   | "));
    Serial.print(SENSOR_IDS[i]);
    Serial.print(F(" | "));

    if (dados[i].conectado) {
      Serial.print(F("CONECTADO  | "));
      Serial.print(dados[i].tempFiltrada, 2);
      Serial.print(F(" °C  "));
    } else {
      Serial.print(F("ERRO       | "));
      Serial.print(F("---.-- °C"));
    }
    Serial.println();
  }

  Serial.println(F("-----------------------------------------"));
  Serial.print(F("Status: "));
  Serial.print(conectados);
  Serial.println(F(" / 5 sensores ONLINE"));

  // Envio em JSON para o backend
  Serial.print(F("JSON:"));
  enviarJSON();
  Serial.println(F("========================================="));
}

void enviarJSON() {
  Serial.print(F("{"));
  Serial.print(F("\"timestamp\":\"")); Serial.print(millis()); Serial.print(F("\","));
  Serial.print(F("\"sensores\":[")); 
  
  for (int i = 0; i < 5; i++) {
    Serial.print(F("{"));
    Serial.print(F("\"id\":\"")); Serial.print(SENSOR_IDS[i]); Serial.print(F("\","));
    Serial.print(F("\"conectado\":"));
    Serial.print(dados[i].conectado ? F("true") : F("false"));
    Serial.print(F(",\"temperatura\":"));
    Serial.print(dados[i].tempFiltrada, 2);
    Serial.print(F(",\"timestamp\":\"2024-01-01T"));
    obterTimestamp();
    Serial.print(F("\"}"));
    
    if (i < 4) Serial.print(F(","));
  }
  
  Serial.println(F("]}"));
}

// Gera timestamp em formato ISO 8601
void obterTimestamp() {
  unsigned long ms = millis();
  unsigned long s = ms / 1000;
  int h = (s / 3600) % 24;
  int m = (s % 3600) / 60;
  int seg = s % 60;
  
  if (h < 10) Serial.print(F("0"));
  Serial.print(h);
  Serial.print(F(":"));
  if (m < 10) Serial.print(F("0"));
  Serial.print(m);
  Serial.print(F(":"));
  if (seg < 10) Serial.print(F("0"));
  Serial.print(seg);
}

void exibirTempoDecorrido() {
  unsigned long s = millis() / 1000;
  int h = s / 3600;
  int m = (s % 3600) / 60;
  int seg = s % 60;

  if (h) { Serial.print(h); Serial.print(F("h ")); }
  if (m || h) { Serial.print(m); Serial.print(F("m ")); }
  Serial.print(seg); Serial.print(F("s"));
}