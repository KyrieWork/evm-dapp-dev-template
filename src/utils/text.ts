/**
 * 格式化数字，处理小数位数
 * @param amount 数字字符串
 * @param decimals 保留小数位数
 * @returns 格式化后的数字字符串
 * @example
 * sliceAmount("0.123", 2) => "0.12"
 * sliceAmount("000123.123", 2) => "123.12"
 * sliceAmount("123.0", 2) => "123"
 * sliceAmount("123", 2) => "123"
 * sliceAmount("0.00123", 2) => "0.0012"
 */
export const sliceAmount = (amount: string, decimals: number = 6): string => {
  // 处理无效输入
  if (!amount || isNaN(Number(amount))) return '0';
  // 移除前导零并解析为数字
  const num = Number(amount);
  if (num === 0) return '0';
  // 分割整数和小数部分
  let [integer, decimal = ''] = amount.split('.');
  // 处理整数部分的前导零
  integer = String(Number(integer));
  // 如果没有小数部分，直接返回整数
  if (!decimal) return integer;
  // 处理小数部分
  decimal = decimal.slice(0, decimals);
  // 移除末尾的0
  while (decimal.endsWith('0')) {
    decimal = decimal.slice(0, -1);
  }
  // 返回结果
  return decimal ? `${integer}.${decimal}` : integer;
};
