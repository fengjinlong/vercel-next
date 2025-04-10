#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}重启 Next.js 应用...${NC}"

# 确保.env文件存在
if [ ! -f .env ]; then
  echo "警告: .env 文件不存在，请先运行 ./tencent-setup.sh 脚本设置环境"
  exit 1
fi

# 检查 dotenv 模块是否已安装
if ! npm list dotenv | grep -q dotenv; then
  echo "安装 dotenv 模块..."
  npm install dotenv --save
fi

# 停止当前运行的应用
echo "停止当前运行的 PM2 应用..."
pm2 stop next-app 2>/dev/null || true

# 确保环境变量加载脚本存在
DOTENV_SCRIPT="load-env.js"
cat > $DOTENV_SCRIPT << 'EOF'
require('dotenv').config();
console.log('环境变量已加载');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');
EOF

# 加载环境变量
echo "加载环境变量..."
node $DOTENV_SCRIPT

# 启动应用
echo "启动应用..."
pm2 start pm2.config.cjs

# 保存PM2配置
echo "保存 PM2 配置..."
pm2 save

# 清理临时文件
rm $DOTENV_SCRIPT

echo -e "${GREEN}应用已重启!${NC}"
echo "可以使用 'pm2 logs next-app' 查看日志" 