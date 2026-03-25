# Abarrotes Microservices (scaffold)
Java 21 · Spring Boot 3.3 · Docker Compose

Servicios:
- api-gateway (reverse proxy simple con Spring Web)
- user-service (usuarios)
- product-service (productos + promociones)
- membership-service (membresías)
- order-service (pedidos + recurrentes)
- payment-service (pagos)

## Levantar
```bash
docker compose up --build
```
- Gateway expone: http://localhost:8081
- Cada servicio expone `/actuator/health` y `/api/hello`
