#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}重启 Next.js 应用...${NC}"

# 确保.env文件存在
if [ ! -f .env ]; then
  echo -e "${RED}警告: .env 文件不存在，请先运行 ./tencent-setup.sh 脚本设置环境${NC}"
  exit 1
fi

# 显示当前数据库连接信息(隐藏密码)
db_url=$(grep DATABASE_URL .env | cut -d "'" -f 2)
if [ -n "$db_url" ]; then
  masked_url=$(echo $db_url | sed -E 's/postgresql:\/\/([^:]+):([^@]+)@/postgresql:\/\/\1:********@/')
  echo -e "当前数据库连接: ${GREEN}$masked_url${NC}"
else
  echo -e "${RED}警告: 未找到有效的数据库连接字符串${NC}"
fi

# 检查 dotenv 模块是否已安装
if ! npm list dotenv | grep -q dotenv; then
  echo "安装 dotenv 模块..."
  npm install dotenv --save
fi

# 确保日志目录存在
echo "确保日志目录存在..."
mkdir -p logs

# 停止当前运行的应用
echo "停止当前运行的 PM2 应用..."
pm2 stop next-app 2>/dev/null || true

# 确保环境变量加载脚本存在
DOTENV_SCRIPT="load-env.js"
cat > $DOTENV_SCRIPT << 'EOF'
require('dotenv').config();
console.log('环境变量已加载');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');

// 测试解析连接字符串
if (process.env.DATABASE_URL) {
  try {
    const match = process.env.DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):?([0-9]*)?\/([^?]+)/);
    if (match) {
      console.log('数据库连接信息:', {
        user: match[1],
        host: match[3],
        database: match[5],
        port: match[4] || 5432
      });
    }
  } catch (e) {
    console.log('无法解析连接字符串');
  }
}
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
echo "可以使用以下命令查看应用状态和日志:"
echo -e "  ${YELLOW}pm2 status${NC} - 查看应用状态"
echo -e "  ${YELLOW}pm2 logs next-app${NC} - 查看应用日志"
echo -e "  ${YELLOW}cat logs/err.log${NC} - 查看错误日志"

# 建议使用API接口测试连接
echo -e "\n${YELLOW}测试数据库连接:${NC}"
echo -e "访问 ${GREEN}http://服务器IP:3000/api/targets${NC} 检查API是否正常返回数据" 