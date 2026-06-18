#include <stdio.h>
#include "esp_log.h"
#include "RFID.h" // Inclusión directa de tu componente local

void app_main(void) {
    ESP_LOGI("MAIN", "Inicializando Banco de Pruebas de Hardware Local...");
    
    // Dispara el hilo de ejecución de las lecturas RFID
    rfid_test_init();
}
