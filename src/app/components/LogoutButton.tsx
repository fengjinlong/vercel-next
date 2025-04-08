"use client";

import { Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { logout } from "@/lib/auth";

interface LogoutButtonProps {
  style?: React.CSSProperties;
}

export default function LogoutButton({ style }: LogoutButtonProps) {
  return (
    <Button
      type="link"
      icon={<LogoutOutlined />}
      onClick={logout}
      style={style}
    >
      退出登录
    </Button>
  );
}
