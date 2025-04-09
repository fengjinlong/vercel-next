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
import AppLayout from "./components/AppLayout";

export default function Home() {
  const [form] = Form.useForm();
  const [transactionForm] = Form.useForm();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [buyLoading, setBuyLoading] = useState<number | null>(null);
  const [sellLoading, setSellLoading] = useState<number | null>(null);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [transactionType, setTransactionType] = useState<"buy" | "sell">("buy");
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>(
    []
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewingTarget, setViewingTarget] = useState<Target | null>(null);

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
    setAddLoading(true);
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
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    message.warning("联系管理员删除");
    return;
    setDeleteLoading(id);
    try {
      await fetch(`/api/targets?id=${id}`, { method: "DELETE" });
      message.success("Target deleted successfully");
      fetchTargets();
    } catch (error) {
      message.error("Failed to delete target");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleTransaction = async (values: {
    quantity: number;
    price: number;
  }) => {
    if (!selectedTarget) return;
    setTransactionLoading(true);

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
        const errorData = await response.json();

        if (errorData.code === "INSUFFICIENT_ASSETS") {
          message.error(errorData.details);
        } else {
          message.error(errorData.error || "操作失败");
        }
        return;
      }

      message.success("Transaction created successfully");
      transactionForm.resetFields();
      setTransactionModalVisible(false);
      fetchTargets();
    } catch (error) {
      message.error("网络错误，请稍后重试");
    } finally {
      setTransactionLoading(false);
    }
  };

  const fetchTransactionHistory = async (
    targetId: number,
    targetName: string
  ) => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/transactions?targetId=${targetId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch transaction history");
      }
      const data = await response.json();
      setTransactionHistory(data);
      setViewingTarget({ id: targetId, name: targetName } as Target);
      setHistoryModalVisible(true);
    } catch (error) {
      message.error("Failed to fetch transaction history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openBuyModal = (record: Target) => {
    setBuyLoading(record.id);
    setSelectedTarget(record);
    setTransactionType("buy");
    setTransactionModalVisible(true);
    setBuyLoading(null);
  };

  const openSellModal = (record: Target) => {
    setSellLoading(record.id);
    setSelectedTarget(record);
    setTransactionType("sell");
    setTransactionModalVisible(true);
    setSellLoading(null);
  };

  const openHistoryModal = (record: Target) => {
    fetchTransactionHistory(record.id, record.name);
  };

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "总买入金额",
      dataIndex: "total_buy_amount",
      key: "total_buy_amount",
      render: (value: any) => {
        const numValue = typeof value === "string" ? parseFloat(value) : value;
        return (
          <span style={{ color: "#1890ff" }}>
            ${!isNaN(numValue) ? numValue.toFixed(2) : "0.00"}
          </span>
        );
      },
    },
    {
      title: "总卖出金额",
      dataIndex: "total_sell_amount",
      key: "total_sell_amount",
      render: (value: any) => {
        const numValue = typeof value === "string" ? parseFloat(value) : value;
        return (
          <span style={{ color: "#52c41a" }}>
            ${!isNaN(numValue) ? numValue.toFixed(2) : "0.00"}
          </span>
        );
      },
    },
    {
      title: "持仓数量",
      dataIndex: "total_assets",
      key: "total_assets",
      render: (value: any) => {
        const numValue = typeof value === "string" ? parseFloat(value) : value;
        return (
          <span style={{ fontWeight: "bold" }}>
            {!isNaN(numValue) ? numValue.toFixed(2) : "0.00"}
          </span>
        );
      },
    },
    {
      title: "平均成本",
      dataIndex: "average_cost",
      key: "average_cost",
      render: (value: any) => {
        const numValue = typeof value === "string" ? parseFloat(value) : value;
        return (
          <span style={{ color: "#722ed1" }}>
            ${!isNaN(numValue) ? numValue.toFixed(2) : "0.00"}
          </span>
        );
      },
    },
    {
      title: "盈亏",
      dataIndex: "profit_loss",
      key: "profit_loss",
      render: (value: any) => {
        const numValue = typeof value === "string" ? parseFloat(value) : value;
        return (
          <span
            style={{
              color: !isNaN(numValue) && numValue >= 0 ? "#52c41a" : "#f5222d",
            }}
          >
            ${!isNaN(numValue) ? numValue.toFixed(2) : "0.00"}
          </span>
        );
      },
    },
    {
      title: "盈亏比例",
      dataIndex: "profit_loss_ratio",
      key: "profit_loss_ratio",
      render: (value: any) => {
        const numValue = typeof value === "string" ? parseFloat(value) : value;
        return (
          <Tag color={!isNaN(numValue) && numValue >= 0 ? "success" : "error"}>
            {!isNaN(numValue) ? numValue.toFixed(2) : "0.00"}%
          </Tag>
        );
      },
    },
    {
      title: "操作",
      key: "actions",
      render: (_: any, record: Target) => (
        <>
          <Button
            type="primary"
            icon={<DollarOutlined />}
            onClick={() => openBuyModal(record)}
            style={{ marginRight: 8 }}
            loading={buyLoading === record.id}
          >
            买入
          </Button>
          <Button
            type="primary"
            icon={<DollarOutlined />}
            onClick={() => openSellModal(record)}
            style={{ marginRight: 8 }}
            loading={sellLoading === record.id}
          >
            卖出
          </Button>
          <Button
            type="primary"
            icon={<DollarOutlined />}
            style={{ marginRight: 8 }}
            onClick={() => openHistoryModal(record)}
            loading={historyLoading && viewingTarget?.id === record.id}
          >
            查看记录
          </Button>
          <Popconfirm
            title="确定要删除这个目标吗？"
            onConfirm={() => handleDelete(record.id)}
            icon={<ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />}
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              loading={deleteLoading === record.id}
            >
              删除
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Target Management</h1>

        <div className="mb-6">
          <Form form={form} layout="inline" onFinish={handleAddTarget}>
            <Form.Item
              name="name"
              rules={[
                { required: true, message: "Please input target name!" },
                {
                  max: 50,
                  message: "Name cannot be longer than 50 characters!",
                },
              ]}
            >
              <Input placeholder="Target Name" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<PlusOutlined />}
                loading={addLoading}
              >
                Add Target
              </Button>
            </Form.Item>
            <Button type="primary" icon={<PlusOutlined />} loading={addLoading}>
              资产占比
            </Button>
          </Form>
        </div>

        {/* <div className="mb-4">
          <Input.Search
            placeholder="Search targets"
            onSearch={(value) => setSearch(value)}
            style={{ width: 300 }}
          />
        </div> */}

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
          <Form
            form={transactionForm}
            onFinish={handleTransaction}
            layout="vertical"
          >
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
              <Button
                type="primary"
                htmlType="submit"
                loading={transactionLoading}
              >
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={`${viewingTarget?.name || ""} 交易记录`}
          open={historyModalVisible}
          onCancel={() => setHistoryModalVisible(false)}
          footer={null}
          width={800}
        >
          <Table
            loading={historyLoading}
            dataSource={transactionHistory}
            rowKey="id"
            pagination={{ pageSize: 100 }}
            columns={[
              {
                title: "类型",
                dataIndex: "type",
                key: "type",
                render: (type: string) => (
                  <Tag color={type === "buy" ? "blue" : "green"}>
                    {type === "buy" ? "买入" : "卖出"}
                  </Tag>
                ),
              },
              {
                title: "数量",
                dataIndex: "quantity",
                key: "quantity",
                render: (value: any) => Number(value).toFixed(2),
              },
              {
                title: "价格",
                dataIndex: "price",
                key: "price",
                render: (value: any) => `$${Number(value).toFixed(2)}`,
              },
              {
                title: "金额",
                key: "amount",
                render: (_, record: Transaction) =>
                  `$${(Number(record.quantity) * Number(record.price)).toFixed(
                    2
                  )}`,
              },
              {
                title: "日期",
                dataIndex: "created_at",
                key: "created_at",
                render: (date: string) => new Date(date).toLocaleString(),
              },
            ]}
            summary={(pageData) => {
              const totalBuyQuantity = pageData
                .filter((item: Transaction) => item.type === "buy")
                .reduce(
                  (prev: number, curr: Transaction) =>
                    prev + Number(curr.quantity),
                  0
                );

              const totalBuyAmount = pageData
                .filter((item: Transaction) => item.type === "buy")
                .reduce(
                  (prev: number, curr: Transaction) =>
                    prev + Number(curr.quantity) * Number(curr.price),
                  0
                );

              const totalSellQuantity = pageData
                .filter((item: Transaction) => item.type === "sell")
                .reduce(
                  (prev: number, curr: Transaction) =>
                    prev + Number(curr.quantity),
                  0
                );

              const totalSellAmount = pageData
                .filter((item: Transaction) => item.type === "sell")
                .reduce(
                  (prev: number, curr: Transaction) =>
                    prev + Number(curr.quantity) * Number(curr.price),
                  0
                );

              return (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <strong>总买入</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      {totalBuyQuantity.toFixed(2)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} colSpan={2}>
                      <span style={{ color: "#1890ff" }}>
                        ${totalBuyAmount.toFixed(2)}
                      </span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <strong>总卖出</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      {totalSellQuantity.toFixed(2)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} colSpan={2}>
                      <span style={{ color: "#52c41a" }}>
                        ${totalSellAmount.toFixed(2)}
                      </span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              );
            }}
          />
        </Modal>
      </div>
    </AppLayout>
  );
}
