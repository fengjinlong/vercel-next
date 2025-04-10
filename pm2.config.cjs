module.exports = {
  apps: [
    {
      name: "next-app",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        DATABASE_URL:
          "postgresql://neondb_owner:npg_3hkLEV5KJUFQ@ep-steep-moon-a5l1c4y7-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
      },
      exec_mode: "cluster", // 启用集群模式
      instances: "max", // 根据 CPU 核心数自动分配实例
      watch: [".next"], // 仅监听 .next 目录的变化
      watch_delay: 5000, // 文件变化后延迟1秒重启
      autorestart: true, // 自动重启
      // max_memory_restart: "1.5G", // 内存超限自动重启
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
