# Creamos un componente puente que expone los nuevos módulos de la v6
idf_component_register(
    REQUIRES esp_driver_gpio esp_timer
)