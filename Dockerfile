# ──────────────────────────────────────────────────────────────
# 多阶段构建：前端(Node) → 后端(Maven) → 运行时(JRE)
# 在云服务器上执行: docker compose up -d --build
# ──────────────────────────────────────────────────────────────

# ── 阶段 1：构建前端 ──
FROM node:20-alpine AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
# 国内镜像源加速
RUN npm config set registry https://registry.npmmirror.com && npm ci
COPY frontend/ ./
RUN npm run build

# ── 阶段 2：构建后端 ──
FROM maven:3.9-eclipse-temurin-23 AS backend-build
WORKDIR /build
# 阿里云 Maven 镜像加速
RUN mkdir -p /root/.m2 && cat > /root/.m2/settings.xml <<'EOF'
<settings>
  <mirrors>
    <mirror>
      <id>aliyun</id>
      <mirrorOf>central</mirrorOf>
      <url>https://maven.aliyun.com/repository/central</url>
    </mirror>
  </mirrors>
</settings>
EOF
COPY backend/pom.xml ./
RUN mvn -q dependency:go-offline || true
COPY backend/src ./src
RUN mvn -q package -DskipTests

# ── 阶段 3：运行时 ──
FROM eclipse-temurin:23-jre
WORKDIR /app
COPY --from=backend-build /build/target/*.jar app.jar
COPY --from=frontend-build /build/dist /app/dist
RUN mkdir -p /app/uploads
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080
ENTRYPOINT ["java", "-Xms256m", "-Xmx768m", "-jar", "app.jar"]
