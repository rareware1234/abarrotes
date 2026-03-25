# Abarrotes Digitales - Backend

Stack: Java 21 (LTS) · Spring Boot 3.3 · Maven · MySQL 8 · Docker

## Módulos iniciales (MVP)
- Usuarios y Membresías (tipo Prime/Pass)
- Productos
- Pedidos y Detalle
- Pedidos Recurrentes
- Pagos

## Requisitos
- Java 21
- Maven 3.9+
- Docker + Docker Compose

## Ejecutar en local (sin Docker)
1. Levanta MySQL 8 (puedes usar `docker compose up db`).
2. Copia `.env.example` a `.env` y ajusta variables si lo deseas.
3. `mvn spring-boot:run` (usa `application.yml`).

## Ejecutar con Docker Compose (app + db)
```bash
docker compose up --build
```

- API base: http://localhost:8080
- Salud: GET /actuator/health
- Swagger UI: http://localhost:8080/swagger-ui/index.html

## Endpoints de prueba rápidos
- `POST /api/users` { "nombre":"Miguel", "email":"miguel@test.com" }
- `GET  /api/products`
- `POST /api/products` { "nombre":"Huevo", "precio":45.0, "stock":100 }
