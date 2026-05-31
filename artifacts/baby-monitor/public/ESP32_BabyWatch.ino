/*
  ESP32 BabyWatch — Sketch de conexão com o painel web
  =====================================================
  Preencha as constantes abaixo antes de fazer o upload.

  Dependências (instale pelo Library Manager):
    - ArduinoJson  (Benoit Blanchon) v7+
    - ESP32 board package da Espressif

  Endpoints utilizados:
    POST /api/esp32/telemetry  — envia temperatura, umidade e sinal Wi-Fi
    POST /api/esp32/alert      — envia alerta de IA (movimento, choro, etc.)
    POST /api/esp32/event      — registra evento de ciclo de vida
    GET  /api/esp32/config     — lê configurações do painel
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ─── CONFIGURE AQUI ──────────────────────────────────────────────
const char* WIFI_SSID     = "SEU_WIFI";
const char* WIFI_PASSWORD = "SUA_SENHA_WIFI";
const char* SERVER_URL    = "https://SEU-APP.replit.app/api";
const char* API_KEY       = "SUA_ESP32_API_KEY";
// ─────────────────────────────────────────────────────────────────

// Intervalo de envio de telemetria (em milissegundos)
const unsigned long TELEMETRY_INTERVAL = 15000;  // 15 segundos
const unsigned long CONFIG_INTERVAL    = 60000;  // 1 minuto

unsigned long lastTelemetry = 0;
unsigned long lastConfig    = 0;

// ─── SIMULAÇÃO de sensores ────────────────────────────────────────
// Substitua por leitura real do DHT22/DS18B20/etc.
float lerTemperatura() { return 22.5 + (random(-20, 30) / 10.0); }
float lerUmidade()     { return 55.0 + (random(-50, 50) / 10.0); }

// ─── UTILITÁRIO: faz POST com JSON ───────────────────────────────
int postJson(const String& path, const String& body) {
  if (WiFi.status() != WL_CONNECTED) return -1;
  HTTPClient http;
  http.begin(String(SERVER_URL) + path);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);
  http.setTimeout(8000);
  int code = http.POST(body);
  if (code > 0) {
    String resp = http.getString();
    Serial.printf("[POST %s] %d: %s\n", path.c_str(), code, resp.substring(0, 120).c_str());
  } else {
    Serial.printf("[POST %s] Erro: %s\n", path.c_str(), http.errorToString(code).c_str());
  }
  http.end();
  return code;
}

// ─── UTILITÁRIO: faz GET ─────────────────────────────────────────
int getJson(const String& path) {
  if (WiFi.status() != WL_CONNECTED) return -1;
  HTTPClient http;
  http.begin(String(SERVER_URL) + path);
  http.addHeader("x-api-key", API_KEY);
  http.setTimeout(8000);
  int code = http.GET();
  if (code > 0) {
    String resp = http.getString();
    Serial.printf("[GET %s] %d: %s\n", path.c_str(), code, resp.substring(0, 200).c_str());
  }
  http.end();
  return code;
}

// ─── ENVIA TELEMETRIA ─────────────────────────────────────────────
void enviarTelemetria() {
  float temp = lerTemperatura();
  float hum  = lerUmidade();
  int rssi   = WiFi.RSSI();

  JsonDocument doc;
  doc["temperature"] = temp;
  doc["humidity"]    = hum;
  doc["wifiSignal"]  = rssi;
  doc["online"]      = true;

  String body;
  serializeJson(doc, body);
  postJson("/esp32/telemetry", body);
}

// ─── ENVIA ALERTA DE IA ───────────────────────────────────────────
// Chame esta função quando seu modelo de IA detectar algo.
// type: "motion" | "crying" | "temperature" | "sound" | "offline" | "online"
// severity: "low" | "medium" | "high" | "critical"
void enviarAlerta(const char* type, const char* severity, const char* message, float confidence = -1) {
  JsonDocument doc;
  doc["type"]     = type;
  doc["severity"] = severity;
  doc["message"]  = message;
  if (confidence >= 0) doc["confidence"] = confidence;

  String body;
  serializeJson(doc, body);
  postJson("/esp32/alert", body);
}

// ─── ENVIA EVENTO ─────────────────────────────────────────────────
// type: "motion_detected" | "baby_crying" | "temperature_alert" |
//       "device_online" | "device_offline" | "night_mode_on" |
//       "night_mode_off" | "sound_detected"
void enviarEvento(const char* type, const char* description) {
  JsonDocument doc;
  doc["type"]        = type;
  doc["description"] = description;

  JsonObject meta = doc["metadata"].to<JsonObject>();
  meta["ip"]   = WiFi.localIP().toString();
  meta["rssi"] = WiFi.RSSI();

  String body;
  serializeJson(doc, body);
  postJson("/esp32/event", body);
}

// ─── LÊ CONFIGURAÇÕES DO PAINEL ───────────────────────────────────
void lerConfiguracoes() {
  getJson("/esp32/config");
  // Resposta: { ok: true, config: { sensitivityLevel, nightModeEnabled, name } }
  // Parse aqui se quiser usar os valores no ESP32.
}

// ─── SETUP ────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== ESP32 BabyWatch iniciando ===");

  // Conecta ao Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando ao Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\nConectado! IP: %s | RSSI: %d dBm\n",
    WiFi.localIP().toString().c_str(), WiFi.RSSI());

  // Avisa o painel que o dispositivo está online
  enviarEvento("device_online", "ESP32 BabyWatch conectado com sucesso");
  enviarAlerta("online", "low", "Dispositivo ESP32 online e pronto");

  // Primeira telemetria imediata
  enviarTelemetria();
  lerConfiguracoes();
}

// ─── LOOP ─────────────────────────────────────────────────────────
void loop() {
  unsigned long agora = millis();

  // Reconexão automática Wi-Fi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi desconectado, reconectando...");
    WiFi.reconnect();
    delay(5000);
    return;
  }

  // Envia telemetria periodicamente
  if (agora - lastTelemetry >= TELEMETRY_INTERVAL) {
    lastTelemetry = agora;
    enviarTelemetria();
  }

  // Lê configurações periodicamente
  if (agora - lastConfig >= CONFIG_INTERVAL) {
    lastConfig = agora;
    lerConfiguracoes();
  }

  // ── EXEMPLOS: chame estas funções quando seu sensor/IA detectar algo ──
  //
  // Movimento detectado:
  //   enviarAlerta("motion", "medium", "Movimento detectado no berco", 0.85);
  //   enviarEvento("motion_detected", "Camera captou movimento");
  //
  // Choro detectado:
  //   enviarAlerta("crying", "high", "Choro detectado pelo bebe", 0.92);
  //   enviarEvento("baby_crying", "Choro detectado pelo microfone");
  //
  // Temperatura alta:
  //   enviarAlerta("temperature", "critical", "Temperatura acima de 28 graus");
  //   enviarEvento("temperature_alert", "Temperatura critica no quarto");

  delay(1000);
}
