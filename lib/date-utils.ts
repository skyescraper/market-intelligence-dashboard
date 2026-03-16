/**
 * 格式化时间为 YYYY/MM/DD HH:MM GMT+8, X day X hour X min ago
 * @param date - Date 对象或时间戳
 * @returns 格式化的时间字符串
 */
export function formatDateGMT8(date: Date | string | number): string {
  const d = new Date(date);

  // 转换为 GMT+8 时区
  const gmt8Offset = 8 * 60; // 8小时的分钟数
  const localOffset = d.getTimezoneOffset(); // 本地时区与UTC的偏移（分钟）
  const gmt8Time = new Date(d.getTime() + (gmt8Offset + localOffset) * 60 * 1000);

  const year = gmt8Time.getFullYear();
  const month = String(gmt8Time.getMonth() + 1).padStart(2, '0');
  const day = String(gmt8Time.getDate()).padStart(2, '0');
  const hours = String(gmt8Time.getHours()).padStart(2, '0');
  const minutes = String(gmt8Time.getMinutes()).padStart(2, '0');

  // 计算相对时间
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let relativeTime = '';
  if (diffDays > 0) {
    const remainingHours = diffHours - (diffDays * 24);
    const remainingMins = diffMins - (diffHours * 60);
    relativeTime = `${diffDays} day ${remainingHours} hour ${remainingMins} min ago`;
  } else if (diffHours > 0) {
    const remainingMins = diffMins - (diffHours * 60);
    relativeTime = `${diffHours} hour ${remainingMins} min ago`;
  } else if (diffMins > 0) {
    relativeTime = `${diffMins} min ago`;
  } else {
    relativeTime = 'just now';
  }

  return `${year}/${month}/${day} ${hours}:${minutes} GMT+8|${relativeTime}`;
}

/**
 * 生成相对时间字符串（例如：2h ago）
 * @param date - Date 对象或时间戳
 * @returns 相对时间字符串
 */
export function getRelativeTime(date: Date | string | number): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return formatDateGMT8(date);
  }
}
