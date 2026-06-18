#pragma once

#include "RFID.h"
#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "driver/gpio.h"
#include "esp_log.h"
#include "wiegand.h" // Driver de UncleRus

static const char *TAG = "RFID_COMP";

#define GPIO_WIEGAND_D0   18   // Ajusta según tus conexiones físicas
#define GPIO_WIEGAND_D1   19   
#define GPIO_RELAY       18   
#define WIEGAND_BUF_SIZE 32

typedef struct {
    uint8_t bits;
    uint8_t data[WIEGAND_BUF_SIZE];
} data_packet_t;

static QueueHandle_t rfid_queue = NULL;
static wiegand_reader_t reader;

static void gpio_init();
static void reader_callback(wiegand_reader_t* r);
static void wiegand_test_task(void* arg);
void rfid_test_init(void);