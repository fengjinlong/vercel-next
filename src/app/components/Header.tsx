"use client";

import { Layout, Typography, Space } from "antd";
import LogoutButton from "./LogoutButton";

const { Header: AntHeader } = Layout;
const { Title } = Typography;

export default function Header() {
  return (
    <AntHeader
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#fff",
        padding: "0 20px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Title level={4} style={{ margin: 0 }}>
        用户管理系统
      </Title>
      <Space>
        <LogoutButton />
      </Space>
    </AntHeader>
  );
}
