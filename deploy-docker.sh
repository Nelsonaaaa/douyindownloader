#!/bin/bash

# Docker部署脚本 - 抖音下载器
set -e

echo "🐳 开始Docker部署..."

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，正在安装..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "⚠️  请重新登录后再运行此脚本"
    exit 1
fi

# 检查Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "📦 安装Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 创建环境变量文件
if [ ! -f .env ]; then
    echo "⚙️ 创建环境变量文件..."
    cp .env.example .env
    echo ""
    echo "❗ 重要: 请编辑 .env 文件，填入你的API密钥:"
    echo "   RAPIDAPI_KEY=你的密钥"
    echo "   RAPIDAPI_HOST=API主机地址"
    echo ""
    read -p "按回车键继续（确保已配置.env）..."
fi

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down 2>/dev/null || true

# 构建并启动
echo "🔨 构建Docker镜像..."
docker-compose build --no-cache

echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 显示日志
echo "📋 最近日志:"
docker-compose logs --tail=20

echo ""
echo "✅ 部署完成！"
echo "🌐 访问地址: http://你的服务器IP:3000"
echo ""
echo "📋 常用管理命令:"
echo "  查看状态: docker-compose ps"
echo "  查看日志: docker-compose logs -f"
echo "  重启服务: docker-compose restart"
echo "  停止服务: docker-compose down"
echo "  更新服务: docker-compose pull && docker-compose up -d"
echo ""
echo "🔧 如需修改配置:"
echo "  1. 编辑 .env 文件"
echo "  2. 运行: docker-compose restart"