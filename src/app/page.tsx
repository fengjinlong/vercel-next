"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Form,
  Modal,
  InputNumber,
  message,
  Popconfirm,
  Tag,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { Target, Transaction } from "@/lib/db";

export default function Home() {
  const [form] = Form.useForm();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [transactionType, setTransactionType] = useState<"buy" | "sell">("buy");

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/targets?page=${page}&pageSize=${pageSize}&search=${search}`
      );
      const data = await response.json();
      setTargets(data.data);
      setTotal(data.total);
    } catch (error) {
      message.error("Failed to fetch targets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [page, pageSize, search]);

  const handleAddTarget = async (values: { name: string }) => {
    try {
      const response = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to add target");
      }

      message.success("Target added successfully");
      form.resetFields();
      fetchTargets();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to add target"
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/targets?id=${id}`, { method: "DELETE" });
      message.success("Target deleted successfully");
      fetchTargets();
    } catch (error) {
      message.error("Failed to delete target");
    }
  };

  const handleTransaction = async (values: {
    quantity: number;
    price: number;
  }) => {
    if (!selectedTarget) return;

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: selectedTarget.id,
          type: transactionType,
          ...values,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create transaction");
      }

      message.success("Transaction created successfully");
      setTransactionModalVisible(false);
      fetchTargets();
    } catch (error) {
      message.error("Failed to create transaction");
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Total Assets",
      dataIndex: "total_assets",
      key: "total_assets",
      render: (value: number) => `$${value}`,
    },
    {
      title: "Profit/Loss",
      dataIndex: "profit_loss",
      key: "profit_loss",
      render: (value: number) => (
        <span style={{ color: value >= 0 ? "#52c41a" : "#f5222d" }}>
          ${value}
        </span>
      ),
    },
    {
      title: "P/L Ratio",
      dataIndex: "profit_loss_ratio",
      key: "profit_loss_ratio",
      render: (value: number) => (
        <Tag color={value >= 0 ? "success" : "error"}>{value}%</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Target) => (
        <>
          <Button
            type="primary"
            icon={<DollarOutlined />}
            onClick={() => {
              setSelectedTarget(record);
              setTransactionType("buy");
              setTransactionModalVisible(true);
            }}
            style={{ marginRight: 8 }}
          >
            Buy
          </Button>
          <Button
            type="default"
            icon={<DollarOutlined />}
            onClick={() => {
              setSelectedTarget(record);
              setTransactionType("sell");
              setTransactionModalVisible(true);
            }}
            style={{ marginRight: 8 }}
          >
            Sell
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this target?"
            onConfirm={() => handleDelete(record.id)}
            icon={<ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />}
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Target Management</h1>

      <div className="mb-6">
        <Form form={form} layout="inline" onFinish={handleAddTarget}>
          <Form.Item
            name="name"
            rules={[
              { required: true, message: "Please input target name!" },
              { max: 50, message: "Name cannot be longer than 50 characters!" },
            ]}
          >
            <Input placeholder="Target Name" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              Add Target
            </Button>
          </Form.Item>
        </Form>
      </div>

      <div className="mb-4">
        <Input.Search
          placeholder="Search targets"
          onSearch={(value) => setSearch(value)}
          style={{ width: 300 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={targets}
        rowKey="id"
        loading={loading}
        pagination={{
          total,
          current: page,
          pageSize,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title={`${transactionType === "buy" ? "Buy" : "Sell"} ${
          selectedTarget?.name || ""
        }`}
        open={transactionModalVisible}
        onCancel={() => setTransactionModalVisible(false)}
        footer={null}
      >
        <Form onFinish={handleTransaction} layout="vertical">
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: "Please input quantity!" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: "Please input price!" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
