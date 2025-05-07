"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  List,
  Card,
  InputNumber,
  message,
  Radio,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";

interface AlertItem {
  id: number;
  coin: string;
  direction: "above" | "below";
  target_price: number;
  email: string;
  interval: number;
  last_checked: string | null;
  last_triggered: string | null;
  paused: boolean;
  created_at: string;
  updated_at: string;
}

const COINS = [
  { label: "Bitcoin", value: "BTC" },
  { label: "Solana", value: "SOL" },
];

const INTERVALS = [
  { label: "1 minutes", value: 1 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hours", value: 60 },
  { label: "4 hours", value: 240 },
  { label: "8 hours", value: 480 },
  { label: "12 hours", value: 720 },
  { label: "1 day", value: 1440 },
];

const PriceAlert: React.FC = () => {
  const [form] = Form.useForm();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 加载提醒列表
  const fetchAlerts = async () => {
    if (isUpdating) return;
    try {
      const response = await axios.get("/api/price-alerts");
      setAlerts(response.data);
    } catch (error) {
      message.error("Failed to fetch alerts");
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // 获取币价
  const fetchPrice = async (coin: string) => {
    try {
      const response = await axios.get(
        `https://min-api.cryptocompare.com/data/price?fsym=${coin}&tsyms=USD`
      );
      return response.data.USD;
    } catch (error) {
      console.error("Error fetching price:", error);
      return null;
    }
  };

  // 添加新提醒
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await axios.post("/api/price-alerts", {
        ...values,
        targetPrice: values.target_price,
      });
      await fetchAlerts();
      form.resetFields();
      message.success("Alert added successfully");
    } catch (error) {
      message.error("Failed to add alert");
    } finally {
      setLoading(false);
    }
  };

  // 暂停/恢复提醒
  const handleTogglePause = async (id: number, currentPaused: boolean) => {
    try {
      await axios.put(`/api/price-alerts`, {
        id,
        paused: !currentPaused,
      });
      await fetchAlerts();
      message.success("Alert status updated");
    } catch (error) {
      message.error("Failed to update alert status");
    }
  };

  // 删除提醒
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/price-alerts`, { data: { id } });
      await fetchAlerts();
      message.success("Alert removed");
    } catch (error) {
      message.error("Failed to delete alert");
    }
  };

  // 检查价格并触发提醒
  const checkPriceAndAlert = useCallback(async (alert: AlertItem) => {
    if (alert.paused || isUpdating) return;
    setIsUpdating(true);

    try {
      const currentPrice = await fetchPrice(alert.coin);
      if (!currentPrice) {
        setIsUpdating(false);
        return;
      }

      const shouldTrigger =
        (alert.direction === "above" && currentPrice >= alert.target_price) ||
        (alert.direction === "below" && currentPrice <= alert.target_price);

      if (
        shouldTrigger &&
        (!alert.last_triggered ||
          dayjs().diff(dayjs(alert.last_triggered), "minute") >= alert.interval)
      ) {
        await axios.post("/api/send-alert-email", {
          coin: alert.coin,
          currentPrice,
          targetPrice: alert.target_price,
          direction: alert.direction,
          email: alert.email,
        });

        const updatedAlert = await axios.put(`/api/price-alerts`, {
          id: alert.id,
          last_triggered: dayjs().format(),
        });

        // Update the specific alert in the state instead of refetching all alerts
        setAlerts((prevAlerts) =>
          prevAlerts.map((a) =>
            a.id === alert.id ? { ...a, ...updatedAlert.data } : a
          )
        );

        message.success(`Alert sent for ${alert.coin}`);
      }
    } catch (error) {
      message.error("Failed to process alert");
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // 设置定时检查
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    alerts.forEach((alert) => {
      const interval = setInterval(() => {
        checkPriceAndAlert(alert);
      }, alert.interval * 60 * 1000);
      intervals.push(interval);
    });

    return () => intervals.forEach(clearInterval);
  }, [alerts, checkPriceAndAlert]);

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <h1 className="text-2xl font-bold mb-6">Crypto Price Alerts</h1>

      <Card
        title="Add New Alert"
        className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border-0"
      >
        <Form
          form={form}
          onFinish={onFinish}
          layout="vertical"
          initialValues={{ email: "18618166564@163.com" }}
        >
          <Form.Item
            name="coin"
            label="Cryptocurrency"
            rules={[{ required: true }]}
          >
            <Select options={COINS} />
          </Form.Item>

          <Form.Item
            name="direction"
            label="Alert Direction"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio.Button value="above">Above</Radio.Button>
              <Radio.Button value="below">Below</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="target_price"
            label="Target Price (USD)"
            rules={[{ required: true }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              precision={2}
              placeholder="Enter target price"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="Enter your email" />
          </Form.Item>

          <Form.Item
            name="interval"
            label="Check Interval (minutes)"
            rules={[{ required: true }]}
          >
            <Select options={INTERVALS} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Add Alert
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="Active Alerts"
        className="bg-gradient-to-r from-purple-50 to-pink-50 shadow-sm border-0"
      >
        <List
          dataSource={alerts}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="pause"
                  type={item.paused ? "default" : "primary"}
                  onClick={() => handleTogglePause(item.id, item.paused)}
                >
                  {item.paused ? "Resume" : "Pause"}
                </Button>,
                <Button
                  key="delete"
                  danger
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <span>
                    {item.coin} {item.direction} {item.target_price} USD
                    {item.paused && (
                      <span className="ml-2 text-gray-500">(Paused)</span>
                    )}
                  </span>
                }
                description={
                  <>
                    <div>Email: {item.email}</div>
                    <div>Check Interval: {item.interval} minutes</div>
                    {item.last_triggered && (
                      <div>
                        Last Triggered:{" "}
                        {dayjs(item.last_triggered).format(
                          "YYYY-MM-DD HH:mm:ss"
                        )}
                      </div>
                    )}
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default PriceAlert;
