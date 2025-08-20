import request from '@/utils/http'

export class RoleService {
  /**
   * 角色分页查询
   */
  static getRolePage(params: Api.Role.RolePageParams) {
    return request.get<Api.Role.RolePageData>({
      url: '/role/page',
      params
    })
  }

  /**
   * 添加角色
   */
  static addRole(data: Api.Role.AddRoleParams) {
    return request.post<number>({
      url: '/role',
      data
    })
  }

  /**
   * 编辑角色
   */
  static updateRole(id: number, data: Api.Role.UpdateRoleParams) {
    return request.put({
      url: `/role/${id}`,
      data
    })
  }

  /**
   * 删除角色
   */
  static deleteRole(id: number) {
    return request.del({
      url: `/role/${id}`
    })
  }

  /**
   * 启用角色
   */
  static enableRole(id: number) {
    return request.put({
      url: `/role/${id}/enable`
    })
  }

  /**
   * 禁用角色
   */
  static disableRole(id: number) {
    return request.put({
      url: `/role/${id}/disable`
    })
  }

  /**
   * 获取角色详情
   */
  static getRoleDetail(id: number) {
    return request.get<Api.Role.RoleListItem>({
      url: `/role/${id}`
    })
  }
}
