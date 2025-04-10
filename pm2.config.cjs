require("dotenv").config();

module.exports = {
  apps: [
    {
      name: "next-app",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        DATABASE_URL: process.env.DATABASE_URL,
      },
      exec_mode: "fork",
      instances: 1,
      watch: false,
      autorestart: true,
      max_memory_restart: "1G",
      error_file: "/root/next-app/logs/err.log",
      out_file: "/root/next-app/logs/out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
