# 腾讯云服务器部署指南

本文档提供了在腾讯云服务器上部署和启动Next.js应用的操作步骤。

## 自动部署流程

当您推送代码到main分支时，GitHub Actions将自动：

1. 构建Next.js应用
2. 将构建文件上传到腾讯云服务器
3. 安装依赖
4. 设置脚本执行权限

## 手动启动/重启应用

代码部署完成后，需要手动执行以下步骤来启动或重启应用：

### 方法1: 使用restart.sh脚本

```bash
# 登录到腾讯云服务器
ssh root@服务器IP

# 进入应用目录
cd /root/next-app

# 运行重启脚本
./restart.sh
```

这个脚本会自动加载环境变量并使用PM2重启应用。

### 方法2: 使用tencent-setup.sh脚本

如果需要重新设置环境变量或检查数据库连接状态，可以运行：

```bash
# 登录到腾讯云服务器
ssh root@服务器IP

# 进入应用目录
cd /root/next-app

# 运行环境检查和设置脚本
./tencent-setup.sh
```

根据提示输入数据库连接信息，然后再运行restart.sh脚本。

### 方法3: 直接使用PM2

```bash
# 登录到腾讯云服务器
ssh root@服务器IP

# 进入应用目录
cd /root/next-app

# 使用PM2启动或重启应用
pm2 restart next-app || pm2 start pm2.config.cjs

# 查看应用状态
pm2 status
```

## 检查日志

启动后，可以查看应用日志检查是否正常运行：

```bash
pm2 logs next-app
```

## 检查数据库连接

如果需要检查数据库连接是否正常，可以访问：

```
http://服务器IP:3000/api/targets
```

如果返回正常的JSON数据或空数组，说明数据库连接正常。

## 注意事项

- 首次部署后，确保数据库连接设置正确
- 如果PM2启动失败，检查日志中的错误信息
- 确保服务器防火墙允许3000端口(或您设置的其他端口)访问 