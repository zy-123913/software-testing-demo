# ====== 阶段 1：编译 ======
FROM maven:3.8-jdk-8 AS builder
WORKDIR /app

# 先复制 pom.xml 预下载依赖（利用 Docker 层缓存，加速后续构建）
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 复制源码并编译 main + test（不执行测试，加速构建）
COPY src ./src
RUN mvn clean compile test-compile -DskipTests -B

# 收集所有依赖 jar 到 target/libs
RUN mvn dependency:copy-dependencies -DoutputDirectory=target/libs -B

# ====== 阶段 2：运行 ======
FROM openjdk:8-jre-slim
WORKDIR /app

COPY --from=builder /app/target/classes ./classes
COPY --from=builder /app/target/test-classes ./test-classes
COPY --from=builder /app/target/libs ./libs

# Render 通过 PORT 环境变量指定端口
ENV PORT=8080
EXPOSE 8080

# classpath 包含 main 类、test 类、所有依赖 jar
CMD java -Dfile.encoding=UTF-8 -cp "classes:test-classes:libs/*" com.example.web.WebApplication
