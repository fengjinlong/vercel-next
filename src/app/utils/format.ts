/**
 * 格式化数字，最多显示6位小数，省略末尾的0
 * @param value 要格式化的数字
 * @param maxDecimals 最大小数位数，默认为6
 * @returns 格式化后的字符串
 */
export function formatNumber(
  value: number | string | undefined,
  maxDecimals: number = 6
): string {
  if (value === undefined || value === null || value === "") {
    return "0";
  }

  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) {
    return "0";
  }

  // 先保留指定的最大小数位数
  const fixed = num.toFixed(maxDecimals);

  // 如果是整数，直接返回
  if (Number.isInteger(num)) {
    return num.toString();
  }

  // 移除末尾的0，如果小数点后全是0则移除小数点
  return fixed.replace(/\.?0+$/, "");
}
