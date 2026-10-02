FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

COPY gradle gradle
COPY gradlew build.gradle settings.gradle ./
RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon

COPY src src
COPY index.html sub3.html ./
COPY static static
COPY templates templates
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/build/libs/*.jar app.jar

EXPOSE 10000
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
