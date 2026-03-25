FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
ARG JAR_FILE=target/abarrotes-backend-0.0.1-SNAPSHOT.jar
COPY ${JAR_FILE} app.jar
EXPOSE 8080
ENTRYPOINT ["java","-XX:+UseZGC","-XX:MaxRAMPercentage=75","-jar","/app/app.jar"]
