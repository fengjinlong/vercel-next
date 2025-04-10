module.exports = {
  apps: [
    {
      name: "next-app",
      script: "server.js",
      cwd: "/root/next-app",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
