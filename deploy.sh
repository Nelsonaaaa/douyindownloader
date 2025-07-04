#!/bin/bash

# 抖音下载器部署脚本
echo "🚀 开始部署抖音视频下载器..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，正在安装..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 检查PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装PM2进程管理器..."
    sudo npm install -g pm2
fi

# 安装依赖
echo "📦 安装项目依赖..."
npm install --production

# 配置环境变量
if [ ! -f .env ]; then
    echo "⚙️ 配置环境变量..."
    cat > .env << EOF
RAPIDAPI_KEY=${RAPIDAPI_KEY:-your_rapidapi_key_here}
RAPIDAPI_HOST=${RAPIDAPI_HOST:-douyin-media-downloader.p.rapidapi.com}
PORT=3000
NODE_ENV=production
EOF
    echo "请编辑 .env 文件填入你的API密钥"
fi

# 启动服务
echo "🎯 启动服务..."
pm2 start server.js --name "douyin-downloader"
pm2 save
pm2 startup

# 配置Nginx反向代理 (可选)
if command -v nginx &> /dev/null; then
    echo "🌐 配置Nginx..."
    sudo tee /etc/nginx/sites-available/douyin-downloader << EOF
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    sudo ln -sf /etc/nginx/sites-available/douyin-downloader /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
fi

echo "✅ 部署完成！"
echo "🌐 访问地址: http://your-server-ip:3000"
echo "📋 管理命令:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs douyin-downloader"
echo "  重启服务: pm2 restart douyin-downloader"
echo "  停止服务: pm2 stop douyin-downloader"