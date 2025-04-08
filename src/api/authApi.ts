import request from '@/utils/http'
// import AppConfig from '@/config'
import { BaseResult } from '@/types/axios'
import { UserInfo } from '@/types/store'
import avatar from '@imgs/user/avatar.png'
import { Md5 } from 'ts-md5'

export class AuthService {
  // 模拟登录接口
  static login(options: { body: string }): Promise<BaseResult> {
    return new Promise((resolve, reject) => {
      const { username, password, tenantAlias } = JSON.parse(options.body)
      const formData = new FormData()
      formData.append('loginName', username)
      formData.append('password', Md5.hashStr(password))
      formData.append('tenantAlias', tenantAlias)
      request
        .post<BaseResult>({
          url: '/login',
          data: formData,
          transformRequest: [(data) => data]
        })
        .then((res) => {
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  // 获取用户信息
  static getUserInfo(): Promise<BaseResult<UserInfo>> {
    return new Promise((resolve) => {
      resolve({
        code: 200,
        message: '获取用户信息成功',
        data: {
          id: 1,
          name: '张三',
          username: 'John Snow',
          avatar: avatar,
          email: 'art.design@gmail.com'
        }
      })
    })
  }
}
