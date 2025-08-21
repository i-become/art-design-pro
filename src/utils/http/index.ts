import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { useUserStore } from '@/store/modules/user'
import { ApiStatus } from './status'
import { HttpError, handleError, showError } from './error'
import { $t } from '@/locales'

/** 请求配置常量 */
const REQUEST_TIMEOUT = 15000
const LOGOUT_DELAY = 500
const MAX_RETRIES = 0
const RETRY_DELAY = 1000
const UNAUTHORIZED_DEBOUNCE_TIME = 3000

/** 401防抖状态 */
let isUnauthorizedErrorShown = false
let unauthorizedTimer: NodeJS.Timeout | null = null

/** 扩展 AxiosRequestConfig */
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  showErrorMessage?: boolean
}

const { VITE_API_URL, VITE_WITH_CREDENTIALS } = import.meta.env

/** Axios实例 */
const axiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT, // 请求超时时间(毫秒)
  baseURL: VITE_API_URL, // API地址
  withCredentials: VITE_WITH_CREDENTIALS === 'true', // 是否携带cookie，默认关闭
  validateStatus: (status) => status >= 200 && status < 300, // 只接受 2xx 的状态码
  // 配置序列化器，确保数组参数正确编码
  paramsSerializer: {
    serialize: (params: any) => {
      const searchParams = new URLSearchParams()

      const serializeValue = (key: string, value: any, parentKey?: string) => {
        if (value === null || value === undefined) {
          return
        }

        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (item instanceof Date) {
              // 处理Date数组
              const fullKey = parentKey ? `${parentKey}[${index}]` : `${key}[${index}]`
              searchParams.append(fullKey, item.toISOString())
            } else if (typeof item === 'object' && item !== null) {
              // 处理对象数组，如 sorts: [{ column: 'name', asc: true }]
              // 使用点号分隔符：sorts[0].column=name&sorts[0].asc=true
              Object.keys(item).forEach((propKey) => {
                const fullKey = parentKey
                  ? `${parentKey}[${index}].${propKey}`
                  : `${key}[${index}].${propKey}`
                searchParams.append(fullKey, String(item[propKey]))
              })
            } else {
              // 处理简单数组
              const fullKey = parentKey ? `${parentKey}[${index}]` : `${key}[${index}]`
              searchParams.append(fullKey, String(item))
            }
          })
        } else if (value instanceof Date) {
          // 处理Date类型，转换为ISO字符串
          const fullKey = parentKey || key
          searchParams.append(fullKey, value.toISOString())
        } else if (typeof value === 'object') {
          // 处理嵌套对象，使用点号分隔符
          Object.keys(value).forEach((propKey) => {
            const fullKey = parentKey ? `${parentKey}.${propKey}` : `${key}.${propKey}`
            serializeValue(propKey, value[propKey], fullKey)
          })
        } else {
          // 处理简单值
          const fullKey = parentKey || key
          searchParams.append(fullKey, String(value))
        }
      }

      Object.keys(params).forEach((key) => {
        serializeValue(key, params[key])
      })
      return searchParams.toString()
    }
  },
  // 序列化格式说明：
  // 原始参数: { sorts: [{ column: 'loginName', asc: true }] }
  // 生成URL: sorts[0].column=loginName&sorts[0].asc=true
  // 编码后: sorts%5B0%5D.column=loginName&sorts%5B0%5D.asc=true
  transformResponse: [
    (data, headers) => {
      const contentType = headers['content-type']
      if (contentType?.includes('application/json')) {
        try {
          return JSON.parse(data)
        } catch {
          return data
        }
      }
      return data
    }
  ]
})

/** 请求拦截器 */
axiosInstance.interceptors.request.use(
  (request: InternalAxiosRequestConfig) => {
    const { accessToken } = useUserStore()
    if (accessToken) request.headers.set('Authorization', accessToken)
    return request
  },
  (error) => {
    showError(createHttpError($t('httpMsg.requestConfigError'), ApiStatus.error))
    return Promise.reject(error)
  }
)

/** 响应拦截器 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<Api.Http.BaseResponse>) => {
    const { code, message } = response.data
    if (code === ApiStatus.success) return response
    if (code === ApiStatus.unauthorized) handleUnauthorizedError(message)
    throw createHttpError(message || $t('httpMsg.requestFailed'), code)
  },
  (error) => {
    if (error.response?.status === ApiStatus.unauthorized) handleUnauthorizedError()
    return Promise.reject(handleError(error))
  }
)

/** 统一创建HttpError */
function createHttpError(message: string, code: number) {
  return new HttpError(message, code)
}

/** 处理401错误（带防抖） */
function handleUnauthorizedError(message?: string): never {
  const error = createHttpError(message || $t('httpMsg.unauthorized'), ApiStatus.unauthorized)

  if (!isUnauthorizedErrorShown) {
    isUnauthorizedErrorShown = true
    logOut()

    unauthorizedTimer = setTimeout(resetUnauthorizedError, UNAUTHORIZED_DEBOUNCE_TIME)

    showError(error, true)
    throw error
  }

  throw error
}

/** 重置401防抖状态 */
function resetUnauthorizedError() {
  isUnauthorizedErrorShown = false
  if (unauthorizedTimer) clearTimeout(unauthorizedTimer)
  unauthorizedTimer = null
}

/** 退出登录函数 */
function logOut() {
  setTimeout(() => {
    useUserStore().logOut()
  }, LOGOUT_DELAY)
}

/** 是否需要重试 */
function shouldRetry(statusCode: number) {
  return [
    ApiStatus.requestTimeout,
    ApiStatus.internalServerError,
    ApiStatus.badGateway,
    ApiStatus.serviceUnavailable,
    ApiStatus.gatewayTimeout
  ].includes(statusCode)
}

/** 请求重试逻辑 */
async function retryRequest<T>(
  config: ExtendedAxiosRequestConfig,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await request<T>(config)
  } catch (error) {
    if (retries > 0 && error instanceof HttpError && shouldRetry(error.code)) {
      await delay(RETRY_DELAY)
      return retryRequest<T>(config, retries - 1)
    }
    throw error
  }
}

/** 延迟函数 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 请求函数 */
async function request<T = any>(config: ExtendedAxiosRequestConfig): Promise<T> {
  try {
    const res = await axiosInstance.request<Api.Http.BaseResponse<T>>(config)
    return res.data.data as T
  } catch (error) {
    if (error instanceof HttpError && error.code !== ApiStatus.unauthorized) {
      const showMsg = config.showErrorMessage !== false
      showError(error, showMsg)
    }
    return Promise.reject(error)
  }
}

/** API方法集合 */
const api = {
  get<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'GET' })
  },
  post<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'POST' })
  },
  put<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'PUT' })
  },
  del<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'DELETE' })
  },
  request<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>(config)
  }
}

export default api
