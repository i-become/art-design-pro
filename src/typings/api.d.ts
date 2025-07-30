/**
 * namespace: Api
 *
 * 所有接口相关类型定义
 * 在.vue文件使用会报错，需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 */
declare namespace Api {
  /** 基础类型 */
  namespace Http {
    /** 基础响应 */
    interface BaseResponse<T = any> {
      // 状态码
      code: number
      // 消息
      message: string
      // 数据
      data: T
    }
  }

  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginatingParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type PaginatingSearchParams = Pick<PaginatingParams, 'current' | 'size'>

    /** 启用状态 */
    type EnableStatus = '1' | '2'
  }

  /** 认证类型 */
  namespace Auth {
    /** 登录参数 */
    interface LoginParams {
      loginName: string
      password: string
    }

    /** 登录响应 */
    interface LoginResponse {
      token: string
      refreshToken: string
    }
  }

  /** 用户类型 */
  namespace User {
    /** 用户信息 */
    interface UserInfo {
      userId: number
      loginName: string
      username: string
      roles: string[]
      perms: string[]
      avatar?: string
      email?: string
      phone?: string
    }

    /** 用户列表数据 */
    interface UserListData {
      records: UserListItem[]
      current: number
      size: number
      total: number
    }

    /** 用户列表项 */
    interface UserListItem {
      id: number
      deptId: number // 部门ID
      loginName: string // 账号
      username: string
      email: string
      phone: string
      sex: number
      avatar: string
      status: 'NORMAL' | 'DISABLED' // 状态（NORMAL 正常 DISABLED 停用）
      loginIp: string // 最后登录IP
      loginDate: string // 最后登录时间
      createBy: string
      createTime: string
      updateBy: string
      updateTime: string
    }
  }

  // 菜单类型
  namespace Menu {
    /** 菜单列表项 */
    interface MenuList {
      id: number
      parentId: number
      name?: string
      redirect?: string
      component?: string
      icon?: string
      sort: number
      title: string
      target?: string
      active?: string
      type?: string
      path?: string
      isHide?: boolean
      isFull?: boolean
      isAffix?: boolean
      isKeepAlive?: boolean
      tag?: string
      perms?: string
    }
  }
}
