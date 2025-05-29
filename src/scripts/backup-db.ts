import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

const execAsync = promisify(exec);

// 确保备份目录存在
const BACKUP_DIR = path.join(process.cwd(), "backups");
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);

    // 从 DATABASE_URL 解析连接信息
    const dbUrl = new URL(process.env.DATABASE_URL || "");
    const database = dbUrl.pathname.slice(1);
    const username = dbUrl.username;
    const password = dbUrl.password;
    const host = dbUrl.hostname;
    const port = dbUrl.port;

    // 设置环境变量用于 pg_dump
    const env = {
      ...process.env,
      PGPASSWORD: password,
    };

    // 执行备份命令
    const { stdout, stderr } = await execAsync(
      `pg_dump -h ${host} -p ${port} -U ${username} -F p -b -v -f "${backupPath}" ${database}`,
      { env }
    );

    // 保留最近的 5 个备份
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((file) => file.startsWith("backup-") && file.endsWith(".sql"))
      .map((file) => path.join(BACKUP_DIR, file))
      .sort(
        (a, b) =>
          fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime()
      );

    // 删除旧的备份
    const MAX_BACKUPS = 5;
    if (files.length > MAX_BACKUPS) {
      files.slice(MAX_BACKUPS).forEach((file) => {
        fs.unlinkSync(file);
      });
    }

    // console.log(`Backup completed successfully: ${backupPath}`);
    // console.log("Backup output:", stdout);

    if (stderr) {
      console.warn("Backup warnings:", stderr);
    }
  } catch (error) {
    console.error("Backup failed:", error);
    process.exit(1);
  }
}

// 如果直接运行脚本则执行备份
if (require.main === module) {
  backupDatabase();
}

export { backupDatabase };
