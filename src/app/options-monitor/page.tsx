"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

// 类型定义
interface OptionTarget {
  id: number;
  name: string;
  strategy: string[];
  createdAt: string;
}

interface OptionIndicator {
  id: number;
  optionId: number;
  time: string;
  currentPrice: number;
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  createdAt: string;
}

// 主组件
export default function OptionsMonitor() {
  // 状态管理
  const [targets, setTargets] = useState<OptionTarget[]>([]);
  const [indicators, setIndicators] = useState<OptionIndicator[]>([]);
  const [targetModalVisible, setTargetModalVisible] = useState(false);
  const [indicatorModalVisible, setIndicatorModalVisible] = useState(false);
  const [editingTarget, setEditingTarget] = useState<OptionTarget | null>(null);
  const [targetForm] = Form.useForm();
  const [indicatorForm] = Form.useForm();

  // 加载数据
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [targetsRes, indicatorsRes] = await Promise.all([
        fetch("/api/option"),
        fetch("/api/indicator"),
      ]);
      const targetsData = await targetsRes.json();
      const indicatorsData = await indicatorsRes.json();

      // Ensure targets and indicators are arrays
      setTargets(Array.isArray(targetsData) ? targetsData : []);
      setIndicators(Array.isArray(indicatorsData) ? indicatorsData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("加载数据失败");
      // Initialize with empty arrays on error
      setTargets([]);
      setIndicators([]);
    }
  };

  // 格式化时间
  const formatDateTime = (dateTimeStr: string) => {
    return dayjs(dateTimeStr).format("YYYY-MM-DD HH:mm:ss");
  };

  // 格式化时间为 UTC
  const formatDateTimeToUTC = (date: dayjs.Dayjs) => {
    return date.utc().format();
  };

  // 格式化 UTC 时间为本地时间
  const formatUTCToLocal = (dateTimeStr: string) => {
    return dayjs(dateTimeStr).local().format("YYYY-MM-DD HH:mm:ss");
  };

  // 标的相关操作
  const handleAddTarget = () => {
    setEditingTarget(null);
    targetForm.resetFields();
    setTargetModalVisible(true);
  };

  const handleEditTarget = (record: OptionTarget) => {
    setEditingTarget(record);
    targetForm.setFieldsValue({
      ...record,
      strategy: record.strategy.join("\n"),
    });
    setTargetModalVisible(true);
  };

  const handleDeleteTarget = (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "删除标的将同时删除其所有指标记录，是否继续？",
      onOk: async () => {
        try {
          await fetch(`/api/option/${id}`, { method: "DELETE" });
          message.success("删除成功");
          fetchData();
        } catch (error) {
          message.error("删除失败");
        }
      },
    });
  };

  const handleTargetSubmit = async () => {
    try {
      const values = await targetForm.validateFields();
      const strategy = values.strategy.split("\n").filter(Boolean);
      const method = editingTarget ? "PUT" : "POST";
      const url = editingTarget
        ? `/api/option/${editingTarget.id}`
        : "/api/option";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, strategy }),
      });

      message.success(`${editingTarget ? "更新" : "添加"}成功`);
      setTargetModalVisible(false);
      fetchData();
    } catch (error) {
      message.error("提交失败");
    }
  };

  // 指标相关操作
  const handleAddIndicator = () => {
    indicatorForm.resetFields();
    setIndicatorModalVisible(true);
  };

  const handleDeleteIndicator = (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这条指标记录吗？",
      onOk: async () => {
        try {
          await fetch(`/api/indicator/${id}`, { method: "DELETE" });
          message.success("删除成功");
          fetchData();
        } catch (error) {
          message.error("删除失败");
        }
      },
    });
  };

  const handleIndicatorSubmit = async () => {
    try {
      const values = await indicatorForm.validateFields();
      await fetch("/api/indicator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          time: formatDateTimeToUTC(values.time),
        }),
      });

      message.success("添加成功");
      setIndicatorModalVisible(false);
      fetchData();
    } catch (error) {
      message.error("提交失败");
    }
  };

  // 表格列定义
  const targetColumns = [
    { title: "标的名称", dataIndex: "name" },
    {
      title: "策略列表",
      dataIndex: "strategy",
      render: (strategy: string[]) => strategy.join(", "),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      render: (text: string) => formatUTCToLocal(text),
    },
    {
      title: "操作",
      render: (_: any, record: OptionTarget) => (
        <>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditTarget(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTarget(record.id)}
          >
            删除
          </Button>
        </>
      ),
    },
  ];

  const indicatorColumns = [
    {
      title: "时间",
      dataIndex: "time",
      render: (text: string) => formatUTCToLocal(text),
    },
    {
      title: "实时价格(ATM)",
      dataIndex: "currentPrice",
      render: (value: number | null) =>
        value != null ? Number(value).toFixed(2) : "-",
    },
    { title: "IV", dataIndex: "iv" },
    { title: "Delta", dataIndex: "delta" },
    { title: "Gamma", dataIndex: "gamma" },
    { title: "Theta", dataIndex: "theta" },
    { title: "Vega", dataIndex: "vega" },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      render: (text: string) => formatUTCToLocal(text),
    },
    {
      title: "操作",
      render: (_: any, record: OptionIndicator) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteIndicator(record.id)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-4 flex justify-between">
        <div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddTarget}
            className="mr-2"
          >
            添加标的
          </Button>
          <Button icon={<PlusOutlined />} onClick={handleAddIndicator}>
            添加指标
          </Button>
        </div>
      </div>

      {/* 标的列表 */}
      <Table
        title={() => <h2 className="text-lg font-medium">期权标的列表</h2>}
        columns={targetColumns}
        dataSource={targets}
        rowKey="id"
        className="mb-8"
      />

      {/* 指标记录（按标的分组） */}
      {targets.map((target) => (
        <div key={target.id} className="mb-8">
          <h3 className="text-lg font-medium mb-4">{target.name} - 指标记录</h3>
          <Table
            columns={indicatorColumns}
            dataSource={indicators.filter((i) => i.optionId === target.id)}
            rowKey="id"
          />
        </div>
      ))}

      {/* 添加/编辑标的弹窗 */}
      <Modal
        title={editingTarget ? "编辑标的" : "添加标的"}
        open={targetModalVisible}
        onOk={handleTargetSubmit}
        onCancel={() => setTargetModalVisible(false)}
      >
        <Form form={targetForm} layout="vertical">
          <Form.Item
            name="name"
            label="标的名称"
            rules={[{ required: true, message: "请输入标的名称" }]}
          >
            <Input placeholder="如：5月30看涨BTC" />
          </Form.Item>
          <Form.Item
            name="strategy"
            label="策略列表"
            rules={[{ required: true, message: "请输入策略列表" }]}
            help="每行一个策略"
          >
            <Input.TextArea
              placeholder="L-btc-30MAY25-120000-C&#10;S-btc-30MAY25-150000-C"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加指标弹窗 */}
      <Modal
        title="添加指标"
        open={indicatorModalVisible}
        onOk={handleIndicatorSubmit}
        onCancel={() => setIndicatorModalVisible(false)}
      >
        <Form form={indicatorForm} layout="vertical">
          <Form.Item
            name="optionId"
            label="所属标的"
            rules={[{ required: true, message: "请选择所属标的" }]}
          >
            <Select>
              {targets.map((target) => (
                <Select.Option key={target.id} value={target.id}>
                  {target.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="time"
            label="时间"
            rules={[{ required: true, message: "请选择时间" }]}
          >
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="currentPrice"
            label="实时价格(ATM)"
            rules={[{ required: true, message: "请输入实时价格" }]}
          >
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item
            name="iv"
            label="IV (隐含波动率)"
            rules={[{ required: true, message: "请输入IV" }]}
          >
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item
            name="delta"
            label="Delta"
            rules={[{ required: true, message: "请输入Delta" }]}
          >
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item
            name="gamma"
            label="Gamma"
            rules={[{ required: true, message: "请输入Gamma" }]}
          >
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item
            name="theta"
            label="Theta"
            rules={[{ required: true, message: "请输入Theta" }]}
          >
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item
            name="vega"
            label="Vega"
            rules={[{ required: true, message: "请输入Vega" }]}
          >
            <Input type="number" step="0.01" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
