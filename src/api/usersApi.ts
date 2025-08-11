import request from '@/utils/http'

export class UserService {
  // 登录
  static login(params: Api.Auth.LoginParams) {
    return request.post<Api.Auth.LoginResponse>({
      url: '/login',
      params
      // showErrorMessage: false // 不显示错误消息
    })
  }

  // 获取用户信息
  static getUserInfo() {
    return request.get<Api.User.UserInfo>({
      url: '/user/info'
      // 自定义请求头
      // headers: {
      //   'X-Custom-Header': 'your-custom-value'
      // }
    })
  }

  // 获取用户列表
  static getUserList(params: Api.Common.PaginatingSearchParams) {
    return request.get<Api.User.UserListData>({
      url: '/user/page',
      params
    })
  }

  // 添加用户
  static addUser(data: Api.User.AddUserParams) {
    return request.post({
      url: '/user',
      data
    })
  }

  // 更新用户
  static updateUser(id: number, data: Api.User.UpdateUserParams) {
    return request.put({
      url: `/user/${id}`,
      data
    })
  }

  // 获取自己的角色信息
  static getRoles() {
    return request.get<Api.Role.RoleList[]>({
      url: `/user/roles`
    })
  }

  // 获取用户角色信息
  static getUserRoles(userId: number) {
    return request.get<Api.Role.RoleList[]>({
      url: `/user/${userId}/roles`
    })
  }

  // 删除用户
  static deleteUser(userId: number) {
    return request.del({
      url: `/user/${userId}`
    })
  }

  // 启用用户
  static enableUser(userId: number) {
    return request.put({
      url: `/user/${userId}/enable`
    })
  }

  // 禁用用户
  static disableUser(userId: number) {
    return request.put({
      url: `/user/${userId}/disable`
    })
  }
}
