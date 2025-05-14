"use client";

import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Divider,
  Table,
  Space,
  Popconfirm,
  message,
  DatePicker,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import AppLayout from "../components/AppLayout";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface EstimateFormValues {
  name: string; // 标的名称
  S: number; // 标的资产当前价格
  IV: number; // 隐含波动率
  expiryDate: string; // 到期日期
}

interface PriceEstimateResult {
  name: string;
  currentPrice: number;
  lowerBound: number;
  upperBound: number;
  lowerBound95: number;
  upperBound95: number;
  currentDate: string;
  expiryDate: string;
}

interface RecordItem extends PriceEstimateResult {
  id: string;
}

export default function OptionPriceEstimate() {
  const [form] = Form.useForm();
  const [result, setResult] = useState<PriceEstimateResult | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/option-estimates");
      if (!response.ok) {
        throw new Error("Failed to fetch records");
      }
      const data = await response.json();
      setRecords(
        data.map((record: any) => ({
          id: record.id.toString(),
          name: record.name,
          currentPrice: Number(record.current_price),
          currentDate: record.estimate_date,
          expiryDate: record.expiry_date,
          lowerBound: Number(record.lower_bound),
          upperBound: Number(record.upper_bound),
          lowerBound95: Number(record.lower_bound_95),
          upperBound95: Number(record.upper_bound_95),
        }))
      );
    } catch (error) {
      console.error("Error fetching records:", error);
      message.error("获取记录失败");
    } finally {
      setLoading(false);
    }
  };

  const validatePositiveNumber = (_: any, value: string) => {
    const num = Number(value);
    if (isNaN(num)) {
      return Promise.reject("请输入有效的数字");
    }
    if (num <= 0) {
      return Promise.reject("数值必须大于0");
    }
    return Promise.resolve();
  };

  const calculatePriceRange = (values: EstimateFormValues) => {
    const { name, S, IV, expiryDate } = values;

    // 计算天数差
    const today = dayjs();
    const expiry = dayjs(expiryDate);
    const T = expiry.diff(today, "day");

    // Convert IV from percentage to decimal (e.g., 20% -> 0.2)
    const ivDecimal = IV / 100;

    // Convert T from days to years
    const tYears = T / 365;

    // Calculate the range based on the formula
    const factor = ivDecimal * Math.sqrt(tYears);
    const lowerBound = S * Math.exp(-factor);
    const upperBound = S * Math.exp(factor);

    // Calculate 95% confidence interval (2 standard deviations)
    const factor95 = 2 * factor;
    const lowerBound95 = S * Math.exp(-factor95);
    const upperBound95 = S * Math.exp(factor95);

    // Get today's date in YYYY-MM-DD format
    const currentDate = today.format("YYYY-MM-DD");
    const formattedExpiryDate = expiry.format("YYYY-MM-DD");

    setResult({
      name,
      currentPrice: S,
      lowerBound,
      upperBound,
      lowerBound95,
      upperBound95,
      currentDate,
      expiryDate: formattedExpiryDate,
    });
  };

  const handleRecord = async () => {
    if (!result) return;

    try {
      setSaving(true);
      const response = await fetch("/api/option-estimates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: result.name,
          currentPrice: result.currentPrice,
          currentDate: result.currentDate,
          expiryDate: result.expiryDate,
          lowerBound: result.lowerBound,
          upperBound: result.upperBound,
          lowerBound95: result.lowerBound95,
          upperBound95: result.upperBound95,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Error response:", {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        });
        throw new Error(
          `Failed to save record: ${response.status} ${response.statusText}`
        );
      }

      message.success("记录保存成功");
      fetchRecords(); // Refresh the records
    } catch (error) {
      console.error("Error saving record:", error);
      message.error(
        `保存记录失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      const response = await fetch(`/api/option-estimates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete record");
      }

      message.success("记录删除成功");
      fetchRecords(); // Refresh the records
    } catch (error) {
      console.error("Error deleting record:", error);
      message.error("删除记录失败");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return dateString.split("T")[0];
  };

  const columns: ColumnsType<RecordItem> = [
    {
      title: "标的",
      dataIndex: "name",
      key: "name",
      width: 80,
      align: "center",
    },
    {
      title: "当前价格",
      dataIndex: "currentPrice",
      key: "currentPrice",
      width: 110,
      render: (price: number) => price.toFixed(2),
      align: "center",
    },
    {
      title: "计算日期",
      dataIndex: "currentDate",
      key: "currentDate",
      width: 120,
      render: (date: string) => formatDate(date),
      align: "center",
    },
    {
      title: "到期日期",
      dataIndex: "expiryDate",
      key: "expiryDate",
      width: 120,
      render: (date: string) => formatDate(date),
      align: "center",
    },
    {
      title: "价格范围(1个标准差)",
      key: "range68",
      render: (_: unknown, record: RecordItem) =>
        `[${record.lowerBound.toFixed(2)} - ${record.upperBound.toFixed(2)}]`,
      align: "center",
    },
    {
      title: "价格范围(2个标准差)",
      key: "range95",
      render: (_: unknown, record: RecordItem) =>
        `[${record.lowerBound95.toFixed(2)} - ${record.upperBound95.toFixed(
          2
        )}]`,
      align: "center",
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      render: (_: unknown, record: RecordItem) => (
        <Popconfirm
          title="确定要删除这条记录吗？"
          onConfirm={() => handleDelete(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger loading={deleting === record.id}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // 禁用今天之前的日期
  const disabledDate = (current: dayjs.Dayjs) => {
    return current && current < dayjs().startOf("day");
  };

  return (
    <AppLayout>
      <div className="p-8 pt-1">
        <div style={{ display: "flex", gap: "24px" }}>
          {/* 左侧计算区域 */}
          <Card style={{ flex: "1", marginTop: 24, minWidth: "400px" }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={calculatePriceRange}
              validateTrigger={["onChange", "onBlur"]}
            >
              <Form.Item
                label={<>标的名称</>}
                name="name"
                validateFirst={true}
                rules={[
                  { required: true, message: "请输入标的名称" },
                  { max: 50, message: "名称不能超过50个字符" },
                ]}
              >
                <Input placeholder="例如: BTC" />
              </Form.Item>

              <Form.Item
                label={<>标的资产当前价格 (S)</>}
                name="S"
                validateFirst={true}
                rules={[
                  { required: true, message: "请输入标的资产当前价格" },
                  { validator: validatePositiveNumber },
                ]}
                help="价格必须大于0"
              >
                <Input placeholder="例如: 100" />
              </Form.Item>

              <Form.Item
                label={<>隐含波动率 (IV %)</>}
                name="IV"
                validateFirst={true}
                rules={[
                  { required: true, message: "请输入隐含波动率" },
                  { validator: validatePositiveNumber },
                ]}
                help="输入百分比数值，例如20表示20%"
              >
                <Input placeholder="例如: 20" />
              </Form.Item>

              <Form.Item
                label={<>到期日期</>}
                name="expiryDate"
                validateFirst={true}
                rules={[{ required: true, message: "请选择到期日期" }]}
                help="选择期权到期日期"
              >
                <DatePicker
                  style={{ width: "100%" }}
                  disabledDate={disabledDate}
                  placeholder="选择到期日期"
                  format="YYYY-MM-DD"
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit">
                  计算价格区间
                </Button>
              </Form.Item>
            </Form>

            {result && (
              <div style={{ marginTop: 24 }}>
                <Title level={3} style={{ marginBottom: 24 }}>
                  价格区间预测结果
                </Title>

                <div style={{ marginBottom: 20 }}>
                  <Text strong>标的名称: {result.name}</Text>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  <Text>计算日期: {result.currentDate}</Text>
                  <Text>到期日期: {result.expiryDate}</Text>
                </div>

                <Divider />

                <div style={{ marginBottom: 32 }}>
                  <Title
                    level={4}
                    style={{ color: "#1890ff", marginBottom: 16 }}
                  >
                    68% 置信区间 (1个标准差):
                  </Title>
                  <Text style={{ fontSize: 16 }}>
                    价格区间: [{result.lowerBound.toFixed(2)} -{" "}
                    {result.upperBound.toFixed(2)}]
                  </Text>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <Title
                    level={4}
                    style={{ color: "#1890ff", marginBottom: 16 }}
                  >
                    95% 置信区间 (2个标准差):
                  </Title>
                  <Text style={{ fontSize: 16 }}>
                    价格区间: [{result.lowerBound95.toFixed(2)} -{" "}
                    {result.upperBound95.toFixed(2)}]
                  </Text>
                </div>

                <Button type="primary" onClick={handleRecord} loading={saving}>
                  记录结果
                </Button>
              </div>
            )}
          </Card>

          {/* 右侧历史记录表格 */}
          <Card style={{ flex: "3", marginTop: 24, minWidth: "800px" }}>
            <Title level={4} style={{ marginBottom: 16 }}>
              历史记录
            </Title>
            <Table
              columns={columns}
              dataSource={records}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              scroll={{ y: 400, x: 800 }}
              loading={loading}
            />
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
