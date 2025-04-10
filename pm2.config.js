module.exports = {
  apps: [
    {
      name: "next-app",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "/root/next-app",
      watch: [".next"],
      ignore_watch: ["node_modules", ".git"],
      watch_options: {
        followSymlinks: false,
        usePolling: true,
      },
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
