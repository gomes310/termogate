#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Termogate Serial Bridge
Lê dados do Arduino e envia para o backend Termogate

Dependências:
    pip install pyserial requests
"""

import serial
import json
import requests
import time
from datetime import datetime
import argparse
import sys

class TermogateSerialBridge:
    def __init__(self, port='/dev/ttyUSB0', baudrate=9600, api_url='http://localhost:5000/api/sensors/data'):
        """
        Inicializa a ponte serial
        
        Args:
            port: Porta serial do Arduino (ex: COM3 no Windows, /dev/ttyUSB0 no Linux)
            baudrate: Velocidade de comunicação
            api_url: URL da API do Termogate
        """
        self.port = port
        self.baudrate = baudrate
        self.api_url = api_url
        self.ser = None
        self.running = False
        
    def conectar(self):
        """Conecta à porta serial do Arduino"""
        try:
            self.ser = serial.Serial(self.port, self.baudrate, timeout=1)
            print(f"✓ Conectado em {self.port} @ {self.baudrate} baud")
            time.sleep(2)  # Aguarda a inicialização do Arduino
            return True
        except serial.SerialException as e:
            print(f"✗ Erro ao conectar: {e}")
            return False
    
    def desconectar(self):
        """Desconecta da porta serial"""
        if self.ser and self.ser.is_open:
            self.ser.close()
            print("✓ Desconectado")
    
    def processar_linha(self, linha):
        """Processa uma linha recebida do Arduino"""
        linha = linha.strip()
        
        if not linha or linha.startswith('>>>') or linha.startswith('---') or linha.startswith('Sensor') or linha.startswith('Aguard'):
            return None
        
        # Procura por dados JSON
        if linha.startswith('JSON:'):
            try:
                json_str = linha[5:]  # Remove o prefixo "JSON:"
                dados = json.loads(json_str)
                return dados
            except json.JSONDecodeError as e:
                print(f"✗ Erro ao parsear JSON: {e}")
                return None
        
        return None
    
    def enviar_para_api(self, dados_json):
        """Envia dados para a API do Termogate"""
        try:
            if 'sensores' not in dados_json:
                return False
            
            # Processa cada sensor
            for sensor in dados_json['sensores']:
                if sensor['conectado']:
                    payload = {
                        'sensorId': sensor['id'],
                        'temperature': sensor['temperatura'],
                        'humidity': 0,  # Expandir conforme necessário
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    response = requests.post(self.api_url, json=payload, timeout=5)
                    
                    if response.status_code == 201:
                        print(f"✓ {sensor['id']}: {sensor['temperatura']:.2f}°C enviado para API")
                    else:
                        print(f"✗ Erro ao enviar {sensor['id']}: {response.status_code}")
            
            return True
        except requests.exceptions.RequestException as e:
            print(f"✗ Erro de conexão com API: {e}")
            return False
        except Exception as e:
            print(f"✗ Erro ao enviar dados: {e}")
            return False
    
    def iniciar(self):
        """Inicia o loop de leitura"""
        if not self.conectar():
            return
        
        self.running = True
        print("\n📊 Aguardando dados do Arduino...\n")
        
        try:
            while self.running:
                if self.ser.in_waiting:
                    try:
                        linha = self.ser.readline().decode('utf-8', errors='ignore')
                        dados = self.processar_linha(linha)
                        
                        if dados:
                            print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Dados recebidos:")
                            print(json.dumps(dados, indent=2))
                            self.enviar_para_api(dados)
                    
                    except Exception as e:
                        print(f"✗ Erro ao processar dados: {e}")
                
                time.sleep(0.1)
        
        except KeyboardInterrupt:
            print("\n\n⚠ Interrompido pelo usuário")
        
        finally:
            self.desconectar()
            print("Aplicação encerrada.")

def main():
    parser = argparse.ArgumentParser(
        description='Termogate Serial Bridge - Conecta Arduino ao Dashboard'
    )
    parser.add_argument(
        '-p', '--port',
        default='/dev/ttyUSB0',
        help='Porta serial do Arduino (padrão: /dev/ttyUSB0)'
    )
    parser.add_argument(
        '-b', '--baud',
        type=int,
        default=9600,
        help='Velocidade da porta serial (padrão: 9600)'
    )
    parser.add_argument(
        '-u', '--url',
        default='http://localhost:5000/api/sensors/data',
        help='URL da API do Termogate'
    )
    
    args = parser.parse_args()
    
    print("\n" + "="*50)
    print("   TERMOGATE SERIAL BRIDGE")
    print("   Arduino → Backend Integration")
    print("="*50)
    print(f"\nConfigurações:")
    print(f"  Porta Serial: {args.port}")
    print(f"  Baudrate: {args.baud}")
    print(f"  API URL: {args.url}")
    print("="*50 + "\n")
    
    bridge = TermogateSerialBridge(
        port=args.port,
        baudrate=args.baud,
        api_url=args.url
    )
    
    bridge.iniciar()

if __name__ == '__main__':
    main()