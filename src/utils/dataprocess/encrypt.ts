/**
 * 加密工具函数
 */
import md5 from 'crypto-js/md5'
import { enc } from 'crypto-js'

/**
 * MD5加密
 * @param value 需要加密的字符串
 * @returns 返回MD5加密后的字符串
 */
export function encryptByMD5(value: string): string {
  return md5(value).toString(enc.Hex)
}
