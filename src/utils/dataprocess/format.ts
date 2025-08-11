/**
 * 数据格式化相关工具函数
 *
 * 时间格式化函数使用说明：
 *
 * 1. formatDateTime(date, format, locale) - 主要的时间格式化函数
 *    - date: 日期对象、时间戳或日期字符串
 *    - format: 格式化选项 ('full' | 'date' | 'time' | 'short' | 'relative')
 *    - locale: 地区设置，默认使用浏览器语言
 *
 * 2. formatTableDateTime(date, format) - 表格专用的时间格式化函数
 *    - 自动使用浏览器语言设置
 *    - 默认使用 'full' 格式
 *
 * 使用示例：
 *
 * // 基本用法
 * formatDateTime('2024-01-15T10:30:00.000Z')                    // 2024-01-15 10:30:00 (中文) / 1/15/2024, 10:30:00 AM (英文)
 * formatDateTime('2024-01-15T10:30:00.000Z', 'date')           // 2024-01-15 (中文) / 1/15/2024 (英文)
 * formatDateTime('2024-01-15T10:30:00.000Z', 'time')           // 10:30:00 (中文) / 10:30:00 AM (英文)
 * formatDateTime('2024-01-15T10:30:00.000Z', 'short')          // 01-15 10:30 (中文) / 1/15, 10:30 AM (英文)
 * formatDateTime('2024-01-15T10:30:00.000Z', 'relative')       // 刚刚 / Just now
 *
 * // 指定地区
 * formatDateTime('2024-01-15T10:30:00.000Z', 'full', 'en-US')  // 1/15/2024, 10:30:00 AM
 * formatDateTime('2024-01-15T10:30:00.000Z', 'full', 'zh-CN')  // 2024-01-15 10:30:00
 *
 * // 表格中使用
 * formatTableDateTime('2024-01-15T10:30:00.000Z')              // 自动使用浏览器语言
 *
 * 排序功能使用说明：
 *
 * 1. 在表格列配置中添加排序支持：
 *    - 设置 sortable: true
 *    - 添加 'sort-by': '字段名' 来指定排序字段
 *
 * 2. 在表格组件上添加排序事件监听：
 *    - @sort-change="handleTableSortChange"
 *
 * 3. 实现排序处理函数：
 *    - 使用 useTable 返回的 handleSortChange 函数
 *    - 自动处理排序参数构建和API请求
 *
 * 4. 排序参数会自动添加到API请求中：
 *    - sorts: [{ column: '字段名', asc: true/false }]
 *    - 支持多字段排序
 *    - 自动重置到第一页
 */

// 时间戳转时间
export function timestampToTime(timestamp: number = Date.now(), isMs: boolean = true): string {
  const date = new Date(isMs ? timestamp : timestamp * 1000)
  return date.toISOString().replace('T', ' ').slice(0, 19)
}

/**
 * 格式化日期时间
 * @param date 日期对象、时间戳或日期字符串
 * @param format 格式化选项
 * @param locale 地区设置，默认使用浏览器语言
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(
  date: Date | number | string | null | undefined,
  format: 'full' | 'date' | 'time' | 'short' | 'relative' = 'full',
  locale?: string
): string {
  // 处理空值
  if (!date) return '-'

  try {
    const dateObj = new Date(date)

    // 检查日期是否有效
    if (isNaN(dateObj.getTime())) return '-'

    // 获取用户语言设置，如果没有指定则使用浏览器默认语言
    const userLocale = locale || navigator.language || 'en-US'

    switch (format) {
      case 'full':
        // 完整格式：2024-01-15 10:30:00
        return dateObj
          .toLocaleString(userLocale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
          .replace(/[/\s]/g, (match) => (match === '/' ? '-' : ' '))

      case 'date':
        // 仅日期：2024-01-15
        return dateObj
          .toLocaleDateString(userLocale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })
          .replace(/\//g, '-')

      case 'time':
        // 仅时间：10:30:00
        return dateObj.toLocaleTimeString(userLocale, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })

      case 'short':
        // 简短格式：01-15 10:30
        return dateObj
          .toLocaleString(userLocale, {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
          .replace(/\//g, '-')

      case 'relative':
        // 相对时间：刚刚、5分钟前、1小时前等
        return getRelativeTime(dateObj, userLocale)

      default:
        return dateObj.toLocaleString(userLocale)
    }
  } catch (error) {
    console.warn('日期格式化失败:', error)
    return '-'
  }
}

/**
 * 获取相对时间
 * @param date 日期对象
 * @param locale 地区设置
 * @returns 相对时间字符串
 */
function getRelativeTime(date: Date, locale: string): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return locale.startsWith('zh') ? '刚刚' : 'Just now'
  }

  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return locale.startsWith('zh') ? `${minutes}分钟前` : `${minutes} minutes ago`
  }

  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return locale.startsWith('zh') ? `${hours}小时前` : `${hours} hours ago`
  }

  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return locale.startsWith('zh') ? `${days}天前` : `${days} days ago`
  }

  // 超过30天显示具体日期
  return formatDateTime(date, 'date', locale)
}

/**
 * 格式化表格中的日期时间（默认使用完整格式）
 * @param date 日期对象、时间戳或日期字符串
 * @param format 格式化选项，默认'full'
 * @returns 格式化后的日期时间字符串
 */
export function formatTableDateTime(
  date: Date | number | string | null | undefined,
  format: 'full' | 'date' | 'time' | 'short' = 'full'
): string {
  return formatDateTime(date, format)
}

// 数字格式化（千位分隔符）
export function commafy(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 生成随机数
export function randomNum(min: number, max?: number): number {
  if (max === undefined) {
    max = min
    min = 0
  }
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 移除HTML标签
export function removeHtmlTags(str: string = ''): string {
  return str.replace(/<[^>]*>/g, '')
}
