import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: "smtp.163.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // 使用应用专用密码
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { coin, currentPrice, targetPrice, direction, email } = body;

    // 邮件内容
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Price Alert: ${coin} has reached your target price!`,
      html: `
        <h2>Crypto Price Alert</h2>
        <p>Your price alert for ${coin} has been triggered!</p>
        <ul>
          <li style="font-size: 16px; padding-bottom: 10px;">Current Price: $${currentPrice}</li>
          <li style="font-size: 16px; padding-bottom: 10px;">Target Price: $${targetPrice}</li>
          <li style="font-size: 16px; padding-bottom: 10px;">Condition: Price is ${direction} target</li>
          <li style="font-size: 16px; padding-bottom: 10px;">Triggered at: ${new Date().toLocaleString()}</li>
        </ul>
        <p>This is an automated message. Please do not reply.</p>
      `,
    };

    // 发送邮件
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
