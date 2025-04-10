#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}腾讯云 Next.js 应用部署环境检查脚本${NC}"
echo "============================================"

# 检查环境变量
echo -e "${YELLOW}[1] 检查环境变量${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}已发现 .env 文件${NC}"
    
    # 检查DATABASE_URL是否存在于.env文件中
    if grep -q "DATABASE_URL" .env; then
        echo -e "${GREEN}DATABASE_URL 已在 .env 文件中配置${NC}"
        # 提取配置值并显示部分信息
        db_url=$(grep DATABASE_URL .env | cut -d "'" -f 2)
        masked_url=$(echo $db_url | sed -E 's/postgresql:\/\/([^:]+):([^@]+)@/postgresql:\/\/\1:********@/')
        echo -e "当前连接字符串: ${YELLOW}$masked_url${NC}"
        
        # 询问是否修改
        echo -e "${YELLOW}是否需要修改DATABASE_URL? (y/n)${NC}"
        read -p "> " change_db_url
        
        if [ "$change_db_url" = "y" ] || [ "$change_db_url" = "Y" ]; then
            echo -e "${YELLOW}请输入新的 DATABASE_URL 数据库连接字符串:${NC}"
            read -p "> " database_url
            
            if [ -n "$database_url" ]; then
                # 备份原始.env文件
                cp .env .env.backup
                # 更新DATABASE_URL
                sed -i "/DATABASE_URL/c\\DATABASE_URL='$database_url'" .env
                echo -e "${GREEN}已更新 DATABASE_URL 配置${NC}"
            else
                echo -e "${RED}未提供有效的DATABASE_URL，保持原有配置${NC}"
            fi
        fi
    else
        echo -e "${RED}警告: .env 文件中未找到 DATABASE_URL${NC}"
        
        # 提示用户输入DATABASE_URL
        echo -e "${YELLOW}请输入 DATABASE_URL 数据库连接字符串:${NC}"
        read -p "> " database_url
        
        if [ -n "$database_url" ]; then
            echo "DATABASE_URL='$database_url'" >> .env
            echo -e "${GREEN}已将 DATABASE_URL 添加到 .env 文件${NC}"
        else
            echo -e "${RED}未提供 DATABASE_URL，将使用默认值${NC}"
            echo "DATABASE_URL='postgresql://postgres:postgres@localhost:5432/postgres'" >> .env
            echo -e "${YELLOW}已使用本地默认值配置 .env 文件${NC}"
            echo -e "${RED}警告: 默认值使用的是本地数据库连接，可能无法正常工作！${NC}"
        fi
    fi
else
    echo -e "${YELLOW}未找到 .env 文件，正在创建...${NC}"
    
    # 提示用户输入DATABASE_URL
    echo -e "${YELLOW}请输入 DATABASE_URL 数据库连接字符串:${NC}"
    read -p "> " database_url
    
    if [ -n "$database_url" ]; then
        echo "DATABASE_URL='$database_url'" > .env
        echo -e "${GREEN}已创建 .env 文件并添加 DATABASE_URL${NC}"
    else
        echo -e "${RED}未提供 DATABASE_URL，将使用本地默认值${NC}"
        echo "DATABASE_URL='postgresql://postgres:postgres@localhost:5432/postgres'" > .env
        echo -e "${YELLOW}已使用本地默认值配置 .env 文件${NC}"
        echo -e "${RED}警告: 默认值使用的是本地数据库连接，可能无法正常工作！${NC}"
    fi
fi

# 检查PM2配置
echo -e "\n${YELLOW}[2] 检查 PM2 配置${NC}"
if [ -f pm2.config.cjs ]; then
    echo -e "${GREEN}已发现 pm2.config.cjs 文件${NC}"
    # 检查dotenv配置
    if grep -q "require('dotenv').config()" pm2.config.cjs; then
        echo -e "${GREEN}PM2 配置已包含 dotenv 导入${NC}"
    else
        echo -e "${RED}PM2 配置未正确导入环境变量${NC}"
        
        # 询问是否自动修复
        echo -e "${YELLOW}是否自动修复PM2配置文件? (y/n)${NC}"
        read -p "> " fix_pm2
        
        if [ "$fix_pm2" = "y" ] || [ "$fix_pm2" = "Y" ]; then
            # 备份原始配置
            cp pm2.config.cjs pm2.config.cjs.backup
            # 插入dotenv配置到文件顶部
            sed -i '1s/^/require("dotenv").config();\n\n/' pm2.config.cjs
            echo -e "${GREEN}已添加 dotenv 配置到 pm2.config.cjs${NC}"
        else
            echo -e "${YELLOW}请手动添加 require('dotenv').config(); 到 pm2.config.cjs 的顶部${NC}"
        fi
    fi
else
    echo -e "${RED}未找到 pm2.config.cjs 文件${NC}"
    echo -e "${YELLOW}您需要创建 PM2 配置文件${NC}"
fi

# 检查数据库连接
echo -e "\n${YELLOW}[3] 测试数据库连接${NC}"
echo -e "${YELLOW}正在使用 Node.js 测试数据库连接...${NC}"

# 创建临时测试脚本
cat > test-db-connection.cjs << 'EOF'
require('dotenv').config();
const { Pool } = require('pg');

// 显示连接信息（隐藏密码）
const connectionString = process.env.DATABASE_URL || '';
console.log('数据库连接字符串:', connectionString.replace(/postgresql:\/\/([^:]+):([^@]+)@/, 'postgresql://$1:********@'));

// 尝试解析连接字符串
let dbConfig = {};
try {
  if (connectionString) {
    const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):?([0-9]*)?\/([^?]+)/);
    if (match) {
      dbConfig = {
        user: match[1],
        host: match[3],
        database: match[5],
        port: match[4] || 5432
      };
      console.log('解析的连接信息:', {
        user: dbConfig.user,
        host: dbConfig.host,
        database: dbConfig.database,
        port: dbConfig.port
      });
    }
  }
} catch (e) {
  console.log('无法解析连接字符串:', e.message);
}

// 禁止SSL证书验证，只用于测试目的
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  console.log('尝试连接到数据库...');
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time');
    console.log('✅ 数据库连接成功!');
    console.log('服务器时间:', result.rows[0].time);
    
    // 检查表是否存在
    const tableCheck = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'targets')");
    if (tableCheck.rows[0].exists) {
      console.log('✅ targets 表已存在');
      
      // 获取记录数
      const countResult = await client.query('SELECT COUNT(*) FROM targets');
      console.log(`   表中有 ${countResult.rows[0].count} 条记录`);
    } else {
      console.log('❌ targets 表不存在');
      console.log('   将在首次API请求时自动创建');
    }
    
    client.release();
  } catch (err) {
    console.error('❌ 数据库连接失败:', err.message);
    console.error('详细错误信息:', err);
    
    if (err.message.includes('password authentication')) {
      console.log('👉 可能原因: 用户名或密码错误');
    } else if (err.message.includes('connect ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
      console.log('👉 可能原因: 网络连接超时或被拒绝，请检查:');
      console.log('   1. 防火墙设置');
      console.log('   2. 数据库服务器是否允许远程连接');
      console.log('   3. 连接地址和端口是否正确');
      console.log('   4. 如果使用localhost，确认数据库服务器已在本地安装并运行');
    } else if (err.message.includes('does not exist')) {
      console.log('👉 可能原因: 数据库不存在，请检查数据库名称');
    } else if (err.message.includes('no pg_hba.conf entry')) {
      console.log('👉 可能原因: 数据库服务器拒绝连接，需要在pg_hba.conf中添加允许访问的配置');
    } else if (err.message.includes('certificate')) {
      console.log('👉 可能原因: SSL证书问题，尝试在连接URL后添加 ?sslmode=require 或 ?sslmode=no-verify');
    }
  } finally {
    await pool.end();
  }
}

testConnection();
EOF

# 运行测试脚本
node test-db-connection.cjs

# 删除临时测试脚本
rm test-db-connection.cjs

# 提供后续步骤建议
echo -e "\n${YELLOW}[4] 后续步骤${NC}"
echo "1. 确保已安装必要的依赖: npm install"
echo "2. 构建应用: npm run build"
echo "3. 使用PM2启动应用: pm2 start pm2.config.cjs"
echo "4. 使用PM2保存配置: pm2 save"
echo "5. 设置PM2开机自启: pm2 startup"
echo "6. 检查应用状态: pm2 status"
echo "7. 查看应用日志: pm2 logs next-app"

echo -e "\n${GREEN}环境检查和设置完成!${NC}" 