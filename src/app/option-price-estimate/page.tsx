"use client";

import { useState } from "react";
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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import AppLayout from "../components/AppLayout";

const { Title, Text } = Typography;

interface EstimateFormValues {
  S: number; // 标的资产当前价格
  IV: number; // 隐含波动率
  T: number; // 到期时间(天数)
}

interface PriceEstimateResult {
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
    const { S, IV, T } = values;

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

    // Calculate dates
    const currentDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(currentDate.getDate() + T);

    setResult({
      lowerBound,
      upperBound,
      lowerBound95,
      upperBound95,
      currentDate: currentDate.toISOString().split("T")[0],
      expiryDate: expiryDate.toISOString().split("T")[0],
    });
  };

  const handleRecord = () => {
    if (result) {
      const newRecord: RecordItem = {
        ...result,
        id: Date.now().toString(),
      };
      setRecords([newRecord, ...records]);
    }
  };

  const handleDelete = (id: string) => {
    setRecords(records.filter((record) => record.id !== id));
  };

  const columns: ColumnsType<RecordItem> = [
    {
      title: "当前日期",
      dataIndex: "currentDate",
      key: "currentDate",
    },
    {
      title: "到期日期",
      dataIndex: "expiryDate",
      key: "expiryDate",
    },
    {
      title: "价格范围(1个标准差)",
      key: "range68",
      render: (_: unknown, record: RecordItem) =>
        `[${record.lowerBound.toFixed(2)} - ${record.upperBound.toFixed(2)}]`,
    },
    {
      title: "价格范围(2个标准差)",
      key: "range95",
      render: (_: unknown, record: RecordItem) =>
        `[${record.lowerBound95.toFixed(2)} - ${record.upperBound95.toFixed(
          2
        )}]`,
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: RecordItem) => (
        <Popconfirm
          title="确定要删除这条记录吗？"
          onConfirm={() => handleDelete(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="p-8 pt-1">
        {/* <Title level={4}>期权价格估算</Title> */}
        {/* <h2 className="text-1xl">期权价格估算</h2> */}

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
                label={<>到期时间 (T，天数)</>}
                name="T"
                validateFirst={true}
                rules={[
                  { required: true, message: "请输入到期时间" },
                  { validator: validatePositiveNumber },
                ]}
                help="天数必须大于0"
              >
                <Input placeholder="例如: 30" />
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

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  <Text>当前日期: {result.currentDate}</Text>
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

                <Button type="primary" onClick={handleRecord}>
                  记录结果
                </Button>
              </div>
            )}
          </Card>

          {/* 右侧历史记录表格 */}
          <Card style={{ flex: "2", marginTop: 24, minWidth: "800px" }}>
            <Title level={4} style={{ marginBottom: 16 }}>
              历史记录
            </Title>
            <Table
              columns={columns}
              dataSource={records}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              scroll={{ y: 400, x: 800 }}
            />
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
