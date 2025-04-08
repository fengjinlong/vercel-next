"use client";

import { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import styles from "./styles.module.css";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);

      // 调用登录API
      const response = await axios.post("/api/login", values);

      if (response.data.success) {
        // 设置登录Cookie，有效期为1天
        Cookies.set("token", response.data.token, { expires: 1 });

        message.success("登录成功");

        // 跳转到首页
        router.push("/");
      }
    } catch (error: any) {
      console.error("登录失败:", error);
      message.error(error.response?.data?.message || "登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      {/* 渐变背景 */}
      <div className={styles.gradientBackground}></div>

      {/* 浮动元素 */}
      <div className={styles.floatingElements}>
        <div className={`${styles.floatingElement} ${styles.bubble1}`}></div>
        <div className={`${styles.floatingElement} ${styles.bubble2}`}></div>
        <div className={`${styles.floatingElement} ${styles.bubble3}`}></div>
        <div className={`${styles.floatingElement} ${styles.bubble4}`}></div>
        <div className={`${styles.floatingElement} ${styles.bubble5}`}></div>
        <div className={`${styles.floatingElement} ${styles.bubble6}`}></div>

        {/* 花瓣元素 */}
        <div className={`${styles.floatingElement} ${styles.petal1}`}></div>
        <div className={`${styles.floatingElement} ${styles.petal2}`}></div>
        <div className={`${styles.floatingElement} ${styles.petal3}`}></div>
      </div>

      {/* 登录表单卡片 */}
      <div className={styles.formCard}>
        <h1 className={styles.formTitle}>系统登录</h1>

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "请输入用户名!" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              style={{ height: "45px", borderRadius: "6px" }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入密码!" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              style={{ height: "45px", borderRadius: "6px" }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className={styles.loginButton}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
