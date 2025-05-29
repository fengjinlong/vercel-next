import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

const execAsync = promisify(exec);

const BACKUP_DIR = path.join(process.cwd(), "backups");

async function restoreDatabase(backupFile?: string) {
  try {
    // 如果没有指定备份文件，使用最新的备份
    if (!backupFile) {
      const files = fs
        .readdirSync(BACKUP_DIR)
        .filter((file) => file.startsWith("backup-") && file.endsWith(".sql"))
        .map((file) => path.join(BACKUP_DIR, file))
        .sort(
          (a, b) =>
            fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime()
        );

      if (files.length === 0) {
        throw new Error("No backup files found");
      }

      backupFile = files[0];
    }

    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    // 从 DATABASE_URL 解析连接信息
    const dbUrl = new URL(process.env.DATABASE_URL || "");
    const database = dbUrl.pathname.slice(1);
    const username = dbUrl.username;
    const password = dbUrl.password;
    const host = dbUrl.hostname;
    const port = dbUrl.port;

    // 设置环境变量用于 psql
    const env = {
      ...process.env,
      PGPASSWORD: password,
    };

    // 执行恢复命令
    const { stdout, stderr } = await execAsync(
      `psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${backupFile}"`,
      { env }
    );

    console.log("Database restored successfully");
    console.log("Restore output:", stdout);

    if (stderr) {
      console.warn("Restore warnings:", stderr);
    }
  } catch (error) {
    console.error("Restore failed:", error);
    process.exit(1);
  }
}

// 如果直接运行脚本则执行恢复
if (require.main === module) {
  const backupFile = process.argv[2]; // 可以通过命令行参数指定备份文件
  restoreDatabase(backupFile);
}

export { restoreDatabase };
