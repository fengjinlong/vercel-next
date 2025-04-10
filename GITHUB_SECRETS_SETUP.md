# GitHub Secrets 设置指南

为了确保自动部署能够正确设置数据库连接，您需要在GitHub仓库中配置`DATABASE_URL`密钥。下面是设置步骤：

## 设置 DATABASE_URL 密钥

1. 打开您的GitHub仓库页面
2. 点击顶部菜单的 **Settings** (设置)
3. 在左侧菜单找到 **Secrets and variables** 并点击
4. 选择 **Actions**
5. 点击 **New repository secret** 按钮
6. 名称填写：`DATABASE_URL`
7. 值填写您的数据库连接字符串，例如：
   ```
   postgresql://username:password@hostname:port/database_name?sslmode=require
   ```
8. 点击 **Add secret** 保存

## 验证设置

设置完成后，当您向`main`分支推送代码时，GitHub Actions将自动：

1. 构建Next.js应用
2. 将构建文件和脚本上传到服务器
3. 使用您配置的DATABASE_URL创建或更新.env文件
4. 执行restart.sh脚本重启应用

## 其他可选密钥

您也可以考虑将以下信息配置为GitHub Secrets：

- `SERVER_HOST`: 服务器IP地址
- `SERVER_USERNAME`: 服务器用户名
- `SERVER_PASSWORD`: 服务器密码

这样可以避免将敏感信息直接硬编码在工作流文件中。

## 注意事项

- 确保密钥值不包含多余的空格或引号
- 设置后的密钥值将不再显示，如需修改，请删除并重新创建
- 密钥对大小写敏感 