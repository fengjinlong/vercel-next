import { backupDatabase } from "./backup-db";
import { CronJob } from "cron";

// 创建定时任务
// 每天凌晨 2 点执行备份
const backupJob = new CronJob("0 2 * * *", async () => {
  console.log("Starting scheduled backup...");
  try {
    await backupDatabase();
    console.log("Scheduled backup completed successfully");
  } catch (error) {
    console.error("Scheduled backup failed:", error);
  }
});

// 启动定时任务
backupJob.start();
console.log("Backup scheduler started. Next backup at:", backupJob.nextDates());
