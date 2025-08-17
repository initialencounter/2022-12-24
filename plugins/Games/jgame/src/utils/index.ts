export function prependBufferToStringTyped(str: string): string {
  const prefixBuffer = Buffer.from([0x08, 0x02, 0x10, 0x0a, 0x1a, 0x00, 0x22, 0x0e]);
  const stringBuffer = Buffer.from(str, 'utf8');

  const combinedBuffer = Buffer.concat([prefixBuffer, stringBuffer]);

  return combinedBuffer.toString('base64');
}

export function validateAndFormatDate(dateStr: string): string {
  // 尝试创建日期对象，进一步验证日期的有效性（比如2月30日这种非法日期）
  const date = new Date(dateStr).toISOString();
  const [year, month, day, hour, minutes, seconds] = date.split(/[-T:]/);

  // 格式化为YYYYMMDD000000
  return `${year}${month}${day}${hour}${minutes}${seconds}`.slice(0, 14);
}
