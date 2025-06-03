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
  Card,
  Typography,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const { Title, Text, Paragraph } = Typography;

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
  callDelta: number;
  putDelta: number;
  keyLegOI: number;
  gamma: number;
  theta: number;
  vega: number;
  dvol: number;
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
  const [editingIndicator, setEditingIndicator] =
    useState<OptionIndicator | null>(null);
  const [targetForm] = Form.useForm();
  const [indicatorForm] = Form.useForm();
  const [targetLoading, setTargetLoading] = useState(false);
  const [indicatorLoading, setIndicatorLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

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
          setDeleteLoading(id);
          await fetch(`/api/option/${id}`, { method: "DELETE" });
          message.success("删除成功");
          fetchData();
        } catch (error) {
          message.error("删除失败");
        } finally {
          setDeleteLoading(null);
        }
      },
    });
  };

  const handleTargetSubmit = async () => {
    try {
      setTargetLoading(true);
      const values = await targetForm.validateFields();
      const strategy = values.strategy.split("\n").filter(Boolean);

      const payload = {
        ...values,
        strategy,
      };

      // 如果是编辑，添加id到payload
      if (editingTarget) {
        payload.id = editingTarget.id;
      }

      await fetch("/api/option", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      message.success(`${editingTarget ? "更新" : "添加"}成功`);
      setTargetModalVisible(false);
      fetchData();
    } catch (error) {
      message.error("提交失败");
    } finally {
      setTargetLoading(false);
    }
  };

  // 指标相关操作
  const handleAddIndicator = () => {
    setEditingIndicator(null);
    indicatorForm.resetFields();
    setIndicatorModalVisible(true);
  };

  const handleEditIndicator = (record: OptionIndicator) => {
    setEditingIndicator(record);
    indicatorForm.setFieldsValue({
      ...record,
      time: dayjs(record.time),
    });
    setIndicatorModalVisible(true);
  };

  const handleDeleteIndicator = (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这条指标记录吗？",
      onOk: async () => {
        try {
          setDeleteLoading(id);
          await fetch(`/api/indicator/${id}`, { method: "DELETE" });
          message.success("删除成功");
          fetchData();
        } catch (error) {
          message.error("删除失败");
        } finally {
          setDeleteLoading(null);
        }
      },
    });
  };

  const handleIndicatorSubmit = async () => {
    try {
      setIndicatorLoading(true);
      const values = await indicatorForm.validateFields();

      const payload = {
        ...values,
        time: formatDateTimeToUTC(values.time),
      };

      // 根据是否是编辑操作使用不同的端点
      const url = editingIndicator
        ? `/api/indicator/${editingIndicator.id}`
        : "/api/indicator";

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || "保存失败");
      }

      const data = await response.json();
      message.success(`${editingIndicator ? "更新" : "添加"}成功`);
      setIndicatorModalVisible(false);
      setEditingIndicator(null);
      fetchData();
    } catch (error) {
      console.error("Submit error:", error);
      message.error(error instanceof Error ? error.message : "提交失败");
    } finally {
      setIndicatorLoading(false);
    }
  };

  // 取消编辑或关闭弹窗时重置状态
  const handleIndicatorModalCancel = () => {
    setIndicatorModalVisible(false);
    setEditingIndicator(null);
    indicatorForm.resetFields();
  };

  // 添加获取期权数据的函数
  const fetchOptionData = async (targetName: string) => {
    try {
      const BASE_URL = "https://test.deribit.com/api/v2";

      // 并行请求期权数据和 dvol 数据
      const [orderBookResponse, dvolResponse] = await Promise.all([
        fetch(
          `${BASE_URL}/public/get_order_book?instrument_name=${targetName}&depth=100`
        ),
        fetch(`${BASE_URL}/public/get_index_price?index_name=btcdvol_usdc`),
      ]);

      const [orderBookData, dvolData] = await Promise.all([
        orderBookResponse.json(),
        dvolResponse.json(),
      ]);

      console.log("API Response - OrderBook:", orderBookData);
      console.log("API Response - DVOL:", dvolData);

      if (orderBookData.result) {
        const { result } = orderBookData;
        const { greeks, index_price, timestamp } = result;

        // 设置表单数据
        indicatorForm.setFieldsValue({
          time: dayjs(timestamp), // 转换时间戳为dayjs对象
          currentPrice: index_price,
          iv: result.mark_iv || greeks.iv, // 使用mark_iv或greeks中的iv
          callDelta: greeks.delta,
          gamma: greeks.gamma,
          theta: greeks.theta,
          vega: greeks.vega,
          dvol: dvolData.result?.index_price || null, // 使用 index_price 字段
          // 其他字段保持不变
          putDelta: indicatorForm.getFieldValue("putDelta"),
          keyLegOI: indicatorForm.getFieldValue("keyLegOI"),
        });

        message.success("数据获取并填充成功");
      }
      return orderBookData;
    } catch (error) {
      console.error("Error fetching option data:", error);
      message.error("获取数据失败");
      return null;
    }
  };

  // 处理获取数据按钮点击
  const handleGetData = async () => {
    try {
      const optionId = indicatorForm.getFieldValue("optionId");
      const target = targets.find((t) => t.id === optionId);

      if (!target) {
        message.error("请先选择所属标的");
        return;
      }

      await fetchOptionData(target.name);
    } catch (error) {
      console.error("Error handling get data:", error);
      message.error("获取数据失败");
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
    { title: "看涨Delta", dataIndex: "callDelta" },
    { title: "看跌Delta", dataIndex: "putDelta" },
    { title: "关键腿OI", dataIndex: "keyLegOI" },
    { title: "Gamma", dataIndex: "gamma" },
    { title: "Theta", dataIndex: "theta" },
    { title: "Vega", dataIndex: "vega" },
    { title: "IV", dataIndex: "iv" },
    {
      title: "DVOL",
      dataIndex: "dvol",
      render: (value: number | null) =>
        value != null ? Number(value).toFixed(2) : "-",
    },
    // {
    //   title: "创建时间",
    //   dataIndex: "createdAt",
    //   render: (text: string) => formatUTCToLocal(text),
    // },
    {
      title: "操作",
      render: (_: any, record: OptionIndicator) => (
        <>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditIndicator(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            loading={deleteLoading === record.id}
            onClick={() => handleDeleteIndicator(record.id)}
          >
            删除
          </Button>
        </>
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

      {/* 指标说明 */}
      <div className="mt-8">
        <Title level={3}>指标说明</Title>

        <Card title="1. 看涨趋势" className="mb-4">
          <ul className="list-disc pl-4">
            <li>
              <Text strong>Delta行为：</Text>{" "}
              Delta持续走强（从0.5增加至接近1），表明期权价格随标的资产价格上涨而快速增加，尤其对买入看涨期权有利。
            </li>
            <li>
              <Text strong>Gamma行为：</Text>{" "}
              Gamma稳定或减弱，因期权可能进入深度实值（ITM）状态，Delta变化趋于平缓。
            </li>
            <li>
              <Text strong>Theta行为：</Text>{" "}
              Theta为负值，时间流逝对买入期权不利，但影响较小，因价格上涨主导。
            </li>
            <li>
              <Text strong>Vega行为：</Text>{" "}
              Vega下降可能支持趋势延续，表明市场对上涨方向确定，隐含波动率（IV）降低。
            </li>
            <li>
              <Text strong>反转信号：</Text>{" "}
              Delta下降（例如从0.7降至0.5）或Vega突然上升（IV增加）可能预示趋势减弱或反转，需警惕价格停止上涨或市场不确定性增加。
            </li>
          </ul>
        </Card>

        <Card title="2. 看跌趋势" className="mb-4">
          <ul className="list-disc pl-4">
            <li>
              <Text strong>Delta行为：</Text>{" "}
              Delta为负且绝对值增加（例如从-0.5降至-0.8），对买入看跌期权有利，反映价格下跌。
            </li>
            <li>
              <Text strong>Gamma行为：</Text>{" "}
              Gamma上升，价格下跌增加Delta变化敏感度，风险较高。
            </li>
            <li>
              <Text strong>Theta行为：</Text>{" "}
              Theta为负值，时间流逝对买入期权不利，但影响可能被价格下跌抵消。
            </li>
            <li>
              <Text strong>Vega行为：</Text>{" "}
              Vega上升较快，因波动率通常在下跌趋势中增加，反映市场恐慌。
            </li>
            <li>
              <Text strong>反转信号：</Text>{" "}
              Delta上升（例如从-0.8升至-0.5）或Vega下降（IV降低）可能表明下跌趋势减弱，需关注价格稳定或市场信心恢复。
            </li>
          </ul>
        </Card>

        <Card title="3. 横盘趋势" className="mb-4">
          <ul className="list-disc pl-4">
            <li>
              <Text strong>Delta行为：</Text>{" "}
              Delta保持中性（接近0），因价格波动有限。
            </li>
            <li>
              <Text strong>Gamma行为：</Text>{" "}
              Gamma风险高，价格微小波动可能导致Delta快速变化，尤其对卖出期权（如straddle）构成风险。
            </li>
            <li>
              <Text strong>Theta行为：</Text>{" "}
              Theta最大化，时间流逝利好卖出期权，因期权价值因时间衰减而减少。
            </li>
            <li>
              <Text strong>Vega行为：</Text>{" "}
              Vega需警惕异常，波动率上升可能预示突破（上涨或下跌）。
            </li>
            <li>
              <Text strong>反转信号：</Text>{" "}
              Delta显著偏离0（例如升至0.3或降至-0.3）或Vega急剧上升（IV增加）可能表明价格即将突破横盘，需准备调整策略。
            </li>
          </ul>
        </Card>

        <Card title="4. 铁鹰策略的希腊字母特性" className="mb-4">
          <Paragraph className="mb-4">
            根据研究，铁鹰策略的整体希腊字母具有以下特点：
          </Paragraph>
          <ul className="list-disc pl-4">
            <li>
              <Text strong>Delta：</Text>{" "}
              铁鹰策略通常设计为Delta中性（净Delta接近0），因看跌价差和看涨价差相互对冲。若两条价差等距虚值，净Delta在短腿中间为0。
            </li>
            <li>
              <Text strong>Gamma：</Text>{" "}
              净Gamma通常为负值，因铁鹰策略卖出期权。Gamma在短腿之间最高，接近到期时Gamma风险增加。
            </li>
            <li>
              <Text strong>Theta：</Text>{" "}
              净Theta通常为正值，因策略从时间衰减中获利，是铁鹰策略盈利的关键。
            </li>
            <li>
              <Text strong>Vega：</Text>{" "}
              净Vega通常为负值，策略从波动率下降中获利。Vega上升可能导致亏损。
            </li>
          </ul>
        </Card>

        <Card title="5. 趋势分析指南" className="mb-4">
          <Paragraph className="mb-4">
            通过观察希腊字母的变化可以帮助判断市场趋势：
          </Paragraph>
          <ul className="list-disc pl-4">
            <li>
              <Text strong>Delta变化分析：</Text>
              <ul className="list-disc pl-8">
                <li>看涨趋势：看涨期权的Delta从0.5升至0.6，表明上涨概率增加</li>
                <li>
                  看跌趋势：看跌期权的Delta从-0.5降至-0.6，表明下跌概率增加
                </li>
                <li>横盘趋势：Delta保持中性（看涨约0.5，看跌约-0.5）</li>
              </ul>
            </li>
            <li>
              <Text strong>Vega波动特征：</Text>{" "}
              Vega上升（IV增加）通常预示市场可能突破，需要结合Delta变化判断突破方向。
            </li>
            <li>
              <Text strong>Theta和Gamma组合分析：</Text>
              <ul className="list-disc pl-8">
                <li>横盘特征：Theta高、Gamma高且Delta保持稳定</li>
                <li>趋势形成：Gamma高且Delta出现明显变化</li>
              </ul>
            </li>
            <li>
              <Text strong>综合判断：</Text> 建议结合其他市场指标如Open
              Interest（OI）和隐含波动率（IV）进行验证。例如，当Delta上升且OI同时增加时，可能进一步确认上涨趋势的形成。
            </li>
          </ul>
        </Card>

        <Card title="6. OI（未平仓量）分析指南" className="mb-4">
          <Paragraph className="mb-4">
            OI（Open Interest）变化与其他指标的组合分析可以帮助判断市场走势：
          </Paragraph>
          <ul className="list-disc pl-4">
            <li>
              <Text strong>趋势确认信号：</Text>
              <ul className="list-disc pl-8">
                <li>
                  <Text strong>看涨确认：</Text> 短看涨期权OI上升 + 价格上涨 +
                  Delta升至0.6，强化上涨趋势可信度
                </li>
                <li>
                  <Text strong>看跌确认：</Text> 短看跌期权OI上升 + 价格下跌 +
                  Delta降至-0.6，强化下跌趋势可信度
                </li>
              </ul>
            </li>
            <li>
              <Text strong>反转预警信号：</Text>
              <ul className="list-disc pl-8">
                <li>
                  <Text strong>上涨反转风险：</Text>{" "}
                  价格继续上涨但短看涨期权OI下降，可能预示短线反弹或趋势即将反转
                </li>
                <li>
                  <Text strong>下跌反转风险：</Text>{" "}
                  价格继续下跌但短看跌期权OI下降，可能为短线调整，需警惕反转风险
                </li>
              </ul>
            </li>
            <li>
              <Text strong>横盘与突破信号：</Text>
              <ul className="list-disc pl-8">
                <li>
                  <Text strong>横盘确认：</Text> 短期期权OI保持稳定 +
                  Delta维持中性（看涨约0.5，看跌约-0.5）
                </li>
                <li>
                  <Text strong>突破预警：</Text> OI突然显著上升 +
                  Vega同步增加，市场可能准备突破当前区间
                </li>
              </ul>
            </li>
          </ul>
        </Card>

        <Card title="实践建议" className="mb-4">
          <ul className="list-disc pl-4">
            <li>
              记录方法：每天在固定时间（如00:00 08:00
              16:00）记录ATM期权的希腊字母
            </li>
            <li>
              异常检测：关注Delta的显著变化（{">"}
              0.1）、Vega的异常上升或Gamma的高波动，结合价格走势和Open
              Interest（OI）验证。
            </li>
          </ul>
        </Card>
      </div>

      {/* 添加/编辑标的弹窗 */}
      <Modal
        title={editingTarget ? "编辑标的" : "添加标的"}
        open={targetModalVisible}
        onOk={handleTargetSubmit}
        onCancel={() => setTargetModalVisible(false)}
        confirmLoading={targetLoading}
      >
        <Form form={targetForm} layout="vertical">
          <Form.Item
            name="name"
            label="主标的名称 (BTC-4JUN25-106000-C)"
            rules={[{ required: true, message: "请输入标的名称" }]}
          >
            <Input placeholder="如：5月30看涨BTC" />
          </Form.Item>
          <Form.Item
            name="strategy"
            label="描述策略 (L-btc-30MAY25-120000-C)"
            rules={[{ required: true, message: "请输入策略列表" }]}
            help="每行一个策略，例如：看涨btc-30MAY25-120000-C，看跌btc-30MAY25-150000-C"
          >
            <Input.TextArea
              placeholder="L-btc-30MAY25-120000-C&#10;S-btc-30MAY25-150000-C"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加/编辑指标弹窗 */}
      <Modal
        title={editingIndicator ? "编辑指标" : "添加指标"}
        open={indicatorModalVisible}
        onOk={handleIndicatorSubmit}
        onCancel={handleIndicatorModalCancel}
        confirmLoading={indicatorLoading}
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
          {/* 获取数据 */}
          <Form.Item name="get_data" label="获取数据">
            <Button type="primary" onClick={handleGetData}>
              获取数据
            </Button>
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
            <Input placeholder="请输入实时价格" />
          </Form.Item>
          <Form.Item
            name="iv"
            label="IV (隐含波动率)"
            rules={[{ required: true, message: "请输入IV" }]}
          >
            <Input placeholder="请输入IV" />
          </Form.Item>
          <Form.Item
            name="callDelta"
            label="看涨Delta"
            rules={[{ required: true, message: "请输入看涨Delta" }]}
          >
            <Input placeholder="请输入看涨Delta" />
          </Form.Item>
          <Form.Item
            name="putDelta"
            label="看跌Delta"
            rules={[{ required: true, message: "请输入看跌Delta" }]}
          >
            <Input placeholder="请输入看跌Delta" />
          </Form.Item>
          <Form.Item
            name="keyLegOI"
            label="关键腿OI"
            rules={[{ required: true, message: "请输入关键腿OI" }]}
          >
            <Input placeholder="请输入关键腿OI" />
          </Form.Item>
          <Form.Item
            name="gamma"
            label="Gamma"
            rules={[{ required: true, message: "请输入Gamma" }]}
          >
            <Input placeholder="请输入Gamma" />
          </Form.Item>
          <Form.Item
            name="theta"
            label="Theta"
            rules={[{ required: true, message: "请输入Theta" }]}
          >
            <Input placeholder="请输入Theta" />
          </Form.Item>
          <Form.Item
            name="vega"
            label="Vega"
            rules={[{ required: true, message: "请输入Vega" }]}
          >
            <Input placeholder="请输入Vega" />
          </Form.Item>
          <Form.Item
            name="dvol"
            label="DVOL (波动率指数)"
            rules={[{ required: true, message: "请输入DVOL" }]}
          >
            <Input placeholder="请输入DVOL" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
