# Build de todos los servicios con Maven (parent POM)
En la raíz del repositorio (donde está este `pom.xml`):

```bash
mvn -T 1C -DskipTests package
```

Para construir un servicio específico:
```bash
mvn -pl product-service -am -DskipTests package
```
