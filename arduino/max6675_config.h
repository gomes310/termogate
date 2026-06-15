// ========================================================
// Configurações do MAX6675 para Arduino
// ========================================================

#ifndef MAX6675_CONFIG_H
#define MAX6675_CONFIG_H

// Pinos do Arduino
#define SENSOR1_CLK   6
#define SENSOR1_CS    5
#define SENSOR1_DO    4

#define SENSOR2_CLK   9
#define SENSOR2_CS    8
#define SENSOR2_DO    7

#define SENSOR3_CLK   12
#define SENSOR3_CS    11
#define SENSOR3_DO    10

#define SENSOR4_CLK   A0
#define SENSOR4_CS    A1
#define SENSOR4_DO    A2

#define SENSOR5_CLK   A3
#define SENSOR5_CS    A4
#define SENSOR5_DO    A5

// Configurações de leitura
#define ALFA_FILTRO           0.25      // Filtro exponencial (0-1)
#define INTERVALO_LEITURA     300       // ms entre leituras (mínimo 250ms)
#define INTERVALO_EXIBICAO    1000      // ms entre envios de dados

// Limites de temperatura
#define TEMP_MIN              -10       // °C
#define TEMP_MAX              1350      // °C

// IDs dos sensores
#define SENSOR_ID_1  "SENSOR-001"
#define SENSOR_ID_2  "SENSOR-002"
#define SENSOR_ID_3  "SENSOR-003"
#define SENSOR_ID_4  "SENSOR-004"
#define SENSOR_ID_5  "SENSOR-005"

// Velocidade Serial
#define BAUD_RATE    9600

#endif