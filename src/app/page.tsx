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
  PieChartOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { Target, Transaction } from "@/lib/db";
import AppLayout from "./components/AppLayout";
import ReactECharts from "echarts-for-react";
import { formatNumber } from "./utils/format";

export default function Home() {
  const [form] = Form.useForm();
  const [transactionForm] = Form.useForm();
  const [editNameForm] = Form.useForm();
  const [adminPasswordForm] = Form.useForm();
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
  const [assetAllocationVisible, setAssetAllocationVisible] = useState(false);
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [editNameLoading, setEditNameLoading] = useState(false);
  const [realTimePrices, setRealTimePrices] = useState<Record<string, number>>(
    {}
  );
  const [realTimePricesLoading, setRealTimePricesLoading] = useState(false);
  const [adminPasswordModalVisible, setAdminPasswordModalVisible] =
    useState(false);
  const [targetToDelete, setTargetToDelete] = useState<number | null>(null);

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
    setTargetToDelete(id);
    setAdminPasswordModalVisible(true);
  };

  const handleAdminPasswordSubmit = async (values: { password: string }) => {
    if (!targetToDelete) return;

    setDeleteLoading(targetToDelete);
    try {
      const response = await fetch(`/api/targets?id=${targetToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminPassword: values.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete target");
      }

      message.success("删除成功");
      setAdminPasswordModalVisible(false);
      adminPasswordForm.resetFields();
      fetchTargets();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to delete target"
      );
    } finally {
      setDeleteLoading(null);
      setTargetToDelete(null);
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

  const fetchRealTimePrices = async (targetsList: Target[]) => {
    setRealTimePricesLoading(true);
    const prices: Record<string, number> = {};

    try {
      const fetchPromises = targetsList
        .filter((target) => parseFloat(String(target.total_assets)) > 0)
        .map(async (target) => {
          try {
            const response = await fetch(
              `https://min-api.cryptocompare.com/data/price?fsym=${target.name}&tsyms=USD`
            );
            const data = await response.json();

            if (data.USD) {
              prices[target.name] = data.USD;
            } else {
              // If asset not found, use the average cost as fallback
              prices[target.name] =
                parseFloat(String(target.average_cost)) || 0;
            }
          } catch (error) {
            console.error(`Error fetching price for ${target.name}:`, error);
            // Fallback to average cost
            prices[target.name] = parseFloat(String(target.average_cost)) || 0;
          }
        });

      await Promise.all(fetchPromises);
      setRealTimePrices(prices);
    } catch (error) {
      message.error("Failed to fetch real-time prices");
      console.error("Failed to fetch real-time prices:", error);
    } finally {
      setRealTimePricesLoading(false);
    }
  };

  const handleOpenAssetAllocation = () => {
    setAssetAllocationVisible(true);
    fetchRealTimePrices(targets);
  };

  const getAssetAllocationOptions = () => {
    // Filter targets with positive assets
    const targetsWithAssets = targets.filter(
      (target) =>
        target.total_assets && parseFloat(String(target.total_assets)) > 0
    );

    // Calculate total assets
    const totalAssets = targetsWithAssets.reduce(
      (sum, target) => sum + parseFloat(String(target.total_assets)),
      0
    );

    // Prepare data for pie chart
    const pieData = targetsWithAssets.map((target) => ({
      name: target.name,
      value: parseFloat(String(target.total_assets)),
      percentage: (
        (parseFloat(String(target.total_assets)) / totalAssets) *
        100
      ).toFixed(2),
    }));

    return {
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        left: 10,
        data: pieData.map((item) => item.name),
      },
      series: [
        {
          name: "资产占比",
          type: "pie",
          // radius: ["50%", "70%"],
          radius: "60%",
          avoidLabelOverlap: false,
          label: {
            show: true,
            formatter: "{b}: {c} ({d}%)",
          },
          emphasis: {
            label: {
              show: true,
              fontSize: "16",
              fontWeight: "bold",
            },
          },
          labelLine: {
            show: true,
          },
          data: pieData,
        },
      ],
    };
  };

  const getRealTimeAssetAllocationOptions = () => {
    // Filter targets with positive assets
    const targetsWithAssets = targets.filter(
      (target) =>
        target.total_assets && parseFloat(String(target.total_assets)) > 0
    );

    // Calculate total real-time value of assets
    const pieData = targetsWithAssets.map((target) => {
      const quantity = parseFloat(String(target.total_assets));
      const price =
        realTimePrices[target.name] ||
        parseFloat(String(target.average_cost)) ||
        0;
      const value = quantity * price;

      return {
        name: target.name,
        value: value,
        realTimePrice: price,
        quantity: quantity,
      };
    });

    const totalValue = pieData.reduce((sum, item) => sum + item.value, 0);

    // Add percentage to the data
    const finalPieData = pieData.map((item) => ({
      ...item,
      percentage: ((item.value / totalValue) * 100).toFixed(2),
    }));

    return {
      tooltip: {
        trigger: "item",
        formatter: function (params: any) {
          return `${params.name}<br/>
                  价格: $${params.data.realTimePrice.toFixed(2)}<br/>
                  数量: ${params.data.quantity.toFixed(2)}<br/>
                  价值: $${params.data.value.toFixed(2)} (${params.percent}%)`;
        },
      },
      legend: {
        orient: "vertical",
        left: 10,
        data: finalPieData.map((item) => item.name),
      },
      series: [
        {
          name: "实时资产占比",
          type: "pie",
          radius: "60%",
          avoidLabelOverlap: false,
          label: {
            show: true,
            // formatter: "{b}: ${c} ({d}%)",
            formatter: function (params: any) {
              return `${params.name}: $${parseFloat(params.value).toFixed(
                2
              )} (${params.percent.toFixed(2)}%)`;
            },
          },
          emphasis: {
            label: {
              show: true,
              fontSize: "16",
              fontWeight: "bold",
            },
          },
          labelLine: {
            show: true,
          },
          data: finalPieData,
        },
      ],
    };
  };

  const handleEditName = async (values: { name: string }) => {
    if (!selectedTarget) return;
    setEditNameLoading(true);

    try {
      const response = await fetch("/api/targets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTarget.id,
          name: values.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "Failed to update target name"
        );
      }

      message.success("Target name updated successfully");
      editNameForm.resetFields();
      setEditNameModalVisible(false);
      fetchTargets();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to update target name"
      );
    } finally {
      setEditNameLoading(false);
    }
  };

  const openEditNameModal = (record: Target) => {
    setSelectedTarget(record);
    editNameForm.setFieldsValue({ name: record.name });
    setEditNameModalVisible(true);
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
            ${!isNaN(numValue) ? formatNumber(numValue) : "0"}
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
            ${!isNaN(numValue) ? formatNumber(numValue) : "0"}
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
            {!isNaN(numValue) ? formatNumber(numValue) : "0"}
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
            ${!isNaN(numValue) ? formatNumber(numValue) : "0"}
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
            ${!isNaN(numValue) ? formatNumber(numValue) : "0"}
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
            icon={<EditOutlined />}
            onClick={() => openEditNameModal(record)}
            style={{ marginRight: 8 }}
          >
            修改名称
          </Button>
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
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            loading={deleteLoading === record.id}
          >
            删除
          </Button>
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
            <Button
              type="primary"
              icon={<PieChartOutlined />}
              onClick={handleOpenAssetAllocation}
            >
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
          title="资产占比"
          open={assetAllocationVisible}
          onCancel={() => setAssetAllocationVisible(false)}
          footer={null}
          width={1450}
        >
          <div
            style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}
          >
            <div style={{ height: 400, width: "50%" }}>
              <h3 style={{ textAlign: "center", marginBottom: 16 }}>
                基于资产持仓数量分布
              </h3>
              <ReactECharts
                option={getAssetAllocationOptions()}
                style={{ height: "100%", width: "100%" }}
              />
            </div>
            <div style={{ height: 400, width: "50%" }}>
              <h3 style={{ textAlign: "center", marginBottom: 16 }}>
                基于实时资产总额分布
              </h3>
              {realTimePricesLoading ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div>加载实时数据中...</div>
                </div>
              ) : (
                <ReactECharts
                  option={getRealTimeAssetAllocationOptions()}
                  style={{ height: "100%", width: "100%" }}
                />
              )}
            </div>
          </div>
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
                render: (value: any) => formatNumber(value),
              },
              {
                title: "价格",
                dataIndex: "price",
                key: "price",
                render: (value: any) => `$${formatNumber(value)}`,
              },
              {
                title: "金额",
                key: "amount",
                render: (_, record: Transaction) =>
                  `$${formatNumber(
                    Number(record.quantity) * Number(record.price)
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
                      {formatNumber(totalBuyQuantity)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} colSpan={2}>
                      <span style={{ color: "#1890ff" }}>
                        ${formatNumber(totalBuyAmount)}
                      </span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <strong>总卖出</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      {formatNumber(totalSellQuantity)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} colSpan={2}>
                      <span style={{ color: "#52c41a" }}>
                        ${formatNumber(totalSellAmount)}
                      </span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              );
            }}
          />
        </Modal>

        <Modal
          title="修改名称"
          open={editNameModalVisible}
          onCancel={() => setEditNameModalVisible(false)}
          footer={null}
        >
          <Form form={editNameForm} onFinish={handleEditName} layout="vertical">
            <Form.Item
              name="name"
              label="名称"
              rules={[
                { required: true, message: "请输入名称!" },
                { max: 50, message: "名称不能超过50个字符!" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={editNameLoading}
              >
                保存
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="管理员验证"
          open={adminPasswordModalVisible}
          onCancel={() => {
            setAdminPasswordModalVisible(false);
            setTargetToDelete(null);
            adminPasswordForm.resetFields();
          }}
          footer={null}
        >
          <Form
            form={adminPasswordForm}
            onFinish={handleAdminPasswordSubmit}
            layout="vertical"
          >
            <Form.Item
              name="password"
              label="管理员密码"
              rules={[{ required: true, message: "请输入管理员密码!" }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={deleteLoading === targetToDelete}
              >
                确认删除
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
