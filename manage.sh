#!/bin/bash

# 抖音下载器服务管理脚本
SERVICE_NAME="douyin-downloader"
PORT=3003
LOG_FILE="/tmp/douyin-log.txt"

case "$1" in
    start)
        echo "正在启动 $SERVICE_NAME 服务..."
        # 检查端口是否被占用
        if lsof -ti:$PORT > /dev/null; then
            echo "端口 $PORT 已被占用，正在停止现有服务..."
            sudo lsof -ti:$PORT | xargs -r sudo kill -9
            sleep 2
        fi
        
        # 启动服务
        nohup npm start > $LOG_FILE 2>&1 &
        PID=$!
        echo "服务已启动，PID: $PID"
        echo "访问地址: http://localhost:$PORT"
        echo "日志文件: $LOG_FILE"
        ;;
    
    stop)
        echo "正在停止 $SERVICE_NAME 服务..."
        # 停止所有相关进程
        sudo pkill -f "node.*server.js" || true
        sudo pkill -f "npm.*start" || true
        sudo lsof -ti:$PORT | xargs -r sudo kill -9
        echo "服务已停止"
        ;;
    
    restart)
        echo "正在重启 $SERVICE_NAME 服务..."
        $0 stop
        sleep 3
        $0 start
        ;;
    
    status)
        echo "检查 $SERVICE_NAME 服务状态..."
        if lsof -ti:$PORT > /dev/null; then
            PID=$(lsof -ti:$PORT)
            echo "服务正在运行，PID: $PID"
            echo "端口: $PORT"
            echo "访问地址: http://localhost:$PORT"
        else
            echo "服务未运行"
        fi
        ;;
    
    log)
        echo "查看服务日志..."
        if [ -f "$LOG_FILE" ]; then
            tail -n 50 "$LOG_FILE"
        else
            echo "日志文件不存在"
        fi
        ;;
    
    clean)
        echo "清理服务进程..."
        # 停止服务进程
        $0 stop
        
        # 清理日志文件
        if [ -f "$LOG_FILE" ]; then
            rm -f "$LOG_FILE"
            echo "已清理日志文件"
        fi
        
        echo "清理完成"
        ;;
    
    *)
        echo "使用方法: $0 {start|stop|restart|status|log|clean}"
        echo ""
        echo "命令说明:"
        echo "  start   - 启动服务"
        echo "  stop    - 停止服务"
        echo "  restart - 重启服务"
        echo "  status  - 查看服务状态"
        echo "  log     - 查看服务日志"
        echo "  clean   - 清理服务进程和日志文件"
        exit 1
        ;;
esac