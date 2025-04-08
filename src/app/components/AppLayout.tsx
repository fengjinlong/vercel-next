"use client";

import { Layout } from "antd";
import Header from "./Header";

const { Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header />
      <Content style={{ padding: "20px" }}>{children}</Content>
    </Layout>
  );
}
