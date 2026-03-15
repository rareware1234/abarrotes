# Abarrotes Efficient System - Microservices

Este proyecto implementa una arquitectura de microservicios para una tienda de abarrotes digital enfocada en la eficiencia operativa y la reducción de merma.

## Estructura del Proyecto

- **api-gateway**: Punto de entrada único (Puerto 8080).
- **product-service**: Gestión de catálogo de productos (Puerto 8081).
- **inventory-service**: Gestión de inventario y optimización de stock (Puerto 8082).
- **order-service**: Procesamiento de pedidos (Puerto 8083).

## Tecnologías

- Java 21
- Spring Boot 3.3
- Spring Cloud Gateway
- Spring Cloud OpenFeign
- MySQL
- Docker

## Ejecución

1.  **Clonar el repositorio** (si aplica).
2.  **Compilar el proyecto**:
    ```bash
    cd microservices
    mvn clean install
    ```
3.  **Iniciar bases de datos** (Docker):
    ```bash
    docker-compose up -d
    ```
4.  **Ejecutar servicios**:
    Puedes ejecutar cada servicio individualmente usando el comando `java -jar` o usando tu IDE.

## Características de Eficiencia

- **Inventario FIFO**: El `InventoryService` prioriza el uso de lotes más antiguos para reducir la merma.
- **Trazabilidad**: Registro de lotes y fechas de caducidad.
- **Diseño para IA**: La entidad `InventoryItem` incluye un campo `freshnessScore` para futuros algoritmos de predicción.

## APIs Disponibles

- **Productos**: `GET /api/products`
- **Inventario**: `GET /api/inventory/stock/{productId}`
- **Pedidos**: `POST /api/orders`

## Configuración

Cada servicio tiene su propio `application.yml` configurado para usar puertos y bases de datos específicos. Consulta la documentación interna de cada servicio para más detalles.