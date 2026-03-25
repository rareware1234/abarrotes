FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
ARG JAR=target/app.jar
COPY target/*.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
