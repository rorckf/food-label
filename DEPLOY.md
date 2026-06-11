# 部署手册

目标：让任何人用手机扫码即可访问本系统。

## 一、买服务器（约 5 分钟）

推荐 **腾讯云轻量应用服务器** 或 **阿里云轻量应用服务器**：

- 配置：**2核 4G** 起步（MySQL + Spring Boot 同机跑，2G 内存会很勉强）
- 系统镜像：选 **Ubuntu 22.04** 或自带 Docker 的"宝塔/Docker"应用镜像
- 地域：选离你近的国内节点（广州/上海/北京均可）
- 时长：先买 3 个月（覆盖比赛周期 6月→9月）
- 价格参考：新用户活动价通常 ¥50-120/3个月

> 不需要买域名、不需要备案——直接用 `http://服务器IP` 访问即可。

买完后在控制台：
1. 记下 **公网 IP**
2. 防火墙/安全组放行 **80 端口**（TCP）
3. 重置/设置 root 密码，确认能 SSH 登录

## 二、装 Docker（约 3 分钟）

SSH 登录服务器后执行：

```bash
# 国内服务器用阿里云脚本装 Docker
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
systemctl enable --now docker

# 配置镜像加速（解决 Docker Hub 拉取慢/失败）
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.net"
  ]
}
EOF
systemctl restart docker
```

## 三、上传项目（二选一）

**方式 A：Git（推荐，开源后用这个）**
```bash
git clone <你的仓库地址> food && cd food
```

**方式 B：直接传压缩包**

本地把项目目录打 zip（排除 `node_modules/`、`backend/target/`、`frontend/dist/`），
用 `scp` 或宝塔面板传上去解压。

## 四、配置并启动（约 10 分钟，多数时间在构建）

```bash
cd food
cp .env.example .env
nano .env        # 填写 5 个变量，FILE_BASE_URL 填 http://你的公网IP/uploads

docker compose up -d --build
```

首次构建约 5-10 分钟（下载依赖）。完成后：

```bash
docker compose ps          # 两个服务都应为 running/healthy
docker compose logs -f app # 看到 "Started FoodlabelApplication" 即成功
```

浏览器打开 `http://你的公网IP` 验证。

## 五、生成手机访问二维码

任意二维码生成网站（如草料二维码 cli.im）输入 `http://你的公网IP`，
下载二维码图片 → 视频里展示"扫码即用"。

## 常见问题

| 现象 | 处理 |
|------|------|
| 拉镜像超时 | 确认第二步的 registry-mirrors 已配置并重启 docker |
| 80 端口打不开 | 云控制台安全组没放行 80；`docker compose ps` 确认 app 在跑 |
| 数据库初始化失败 | `docker compose down -v` 清掉数据卷后重新 `up -d --build` |
| 改了代码要更新 | `git pull && docker compose up -d --build` |
| 识别功能报错 | `.env` 里 QWEN_API_KEY 没填对；`docker compose logs app` 看具体报错 |

## 安全注意

- `.env` 永远不进 git（已在 .gitignore）
- 管理后台密码 = `ADMIN_SEED_PASSWORD`，公网部署必须设强密码
- 比赛结束后如不再续费服务器，记得导出 MySQL 数据卷备份
