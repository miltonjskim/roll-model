FROM openjdk:17-alpine
WORKDIR /app

ENV TZ=Asia/Seoul
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

COPY build/libs/roll_model-0.0.1-SNAPSHOT.jar app.jar

RUN mkdir -p /app/logs

EXPOSE 8080
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]