# The following five lines of boilerplate have to be in your project's
# CMakeLists in this exact order for cmake to work correctly
#Biolerplate obligatorio para que CMake y ESP-IDF coopere perfectamente
cmake_minimum_required(VERSION 3.22)

include(FetchContent)

FetchContent_Declare(
    espidflib
    GIT_REPOSITORY https://github.com/UncleRus/esp-idf-lib.git
)

#Descargar el contenido en tiempo de configuracion
FetchContent_MakeAvailable(espidflib)

#Donde estaran los componentes descargados
set(EXTRA_COMPONENT_DIRS
    "components"
    "${espidflib_SOURCE_DIR}/components/wiegand"
    "${espidflib_SOURCE_DIR}/components/esp_idf_lib_helpers"
)

#Se carga en el sistema de compilacion nativo del ESP32
include($ENV{IDF_PATH}/tools/cmake/project.cmake)
project(Cabinet)