#include "RFID.h"

static const char *TAG = "RFID_COMP"; //Tiene que estar en el C, ya que solo debe de acceder en este archivo no afuera
QueueHandle_t rfid_queue = NULL;
wiegand_reader_t reader;

void gpio_init() {
    gpio_config_t io_conf = {
        .pin_bit_mask = (1ULL << GPIO_RELAY),
        .mode = GPIO_MODE_OUTPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE,
    };
    gpio_config(&io_conf);
    gpio_set_level(GPIO_RELAY, 0);
}

void reader_callback(wiegand_reader_t* r) {
    data_packet_t p;
    p.bits = r->bits;
    memcpy(p.data, r->buf, WIEGAND_BUF_SIZE);
    xQueueSendToBackFromISR(rfid_queue, &p, NULL);
}

void wiegand_test_task(void* arg) {
    rfid_queue = xQueueCreate(5, sizeof(data_packet_t));
    if (!rfid_queue) {
        ESP_LOGE(TAG, "No se pudo crear la cola FreeRTOS");
        vTaskDelete(NULL);
    }

    ESP_ERROR_CHECK(wiegand_reader_init(
        &reader, GPIO_WIEGAND_D0, GPIO_WIEGAND_D1, true,
        WIEGAND_BUF_SIZE, reader_callback, WIEGAND_MSB_FIRST, WIEGAND_LSB_FIRST
    ));

    ESP_LOGI(TAG, "Componente RFID listo. Esperando tarjeta Steren...");

    data_packet_t packet;
    while (1) {
        if (xQueueReceive(rfid_queue, &packet, portMAX_DELAY)) {
            uint64_t value = 0;
            int bytes = (packet.bits + 7) / 8;
            for (int i = 0; i < bytes; i++) {
                value = (value << 8) | packet.data[i];
            }
            value = value >> (bytes * 8 - packet.bits);
            uint32_t raw = (uint32_t)value;

            if (packet.bits == 26) {
                uint8_t facility = (raw >> 17) & 0xFF;
                uint16_t card_id = (raw >> 1) & 0xFFFF;
                uint32_t full_id = ((uint32_t)facility << 16) | card_id;

                ESP_LOGW(TAG, "===============================================");
                ESP_LOGW(TAG, "Tarejeta leida");
                ESP_LOGW(TAG, "ID: %lu", (unsigned long)full_id);
                ESP_LOGW(TAG, "===============================================");

                // Simulación de apertura física de cajón
                gpio_set_level(GPIO_RELAY, 1);
                vTaskDelay(2000 / portTICK_PERIOD_MS); 
                gpio_set_level(GPIO_RELAY, 0);
            } else {
                ESP_LOGE(TAG, "Ruido o formato no soportado detectado: %d bits", packet.bits);
            }
        }
    }
}

void rfid_test_init(void) {
    gpio_init();
    xTaskCreate(wiegand_test_task, "wiegand_test_task", 4096, NULL, 5, NULL);
}