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
    /** 排序项 */
    interface OrderItem {
      /** 需要进行排序的字段 */
      column: string
      /** 是否正序排列，默认 true */
      asc: boolean
    }

    /** 基础分页参数 */
    interface BasePage {
      /** 页号 */
      current: number
      /** 页大小 */
      size: number
      /** 排序字段 */
      sorts?: OrderItem[]
    }

    /** 分页搜索参数 */
    interface PaginatingSearchParams extends BasePage {
      [key: string]: any
    }

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
      sorts?: Api.Common.OrderItem[]
    }

    /** 用户列表项 */
    interface UserListItem {
      id: number
      deptId: number // 部门ID
      loginName: string // 账号
      username: string
      email: string
      phone: string
      sex: string
      avatar: string
      status: 'NORMAL' | 'DISABLED' // 状态（NORMAL 正常 DISABLED 停用）
      loginIp: string // 最后登录IP
      loginDate: string // 最后登录时间
      createBy: string
      createTime: string
      updateBy: string
      updateTime: string
    }

    /** 添加用户参数 */
    interface AddUserParams {
      deptId?: number // 部门编号
      loginName?: string // 账号
      password?: string // 密码
      username?: string // 用户名
      email?: string // 邮箱
      phone?: string // 手机号码
      sex: string
      avatar?: string // 头像路径
      roleIds: number[] // 角色编号列表,
      postIds: number[] // 岗位编号列表
    }

    /** 更新用户参数 */
    interface UpdateUserParams {
      deptId?: number // 部门编号
      loginName?: string // 账号
      password?: string // 密码（可选，为空时不更新）
      username?: string // 用户名
      email?: string // 邮箱
      phone?: string // 手机号码
      sex?: string
      avatar?: string // 头像路径
      roleIds?: number[] // 角色编号列表,
      postIds?: number[] // 岗位编号列表
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

  // 角色类型
  namespace Role {
    /** 角色列表项 */
    interface RoleList {
      id: number
      roleName: string
      roleKey: string // 角色权限字符串
      dataScope: string // 数据范围
      createTime: string // 创建时间
    }

    /** 角色分页查询参数 */
    interface RolePageParams extends Api.Common.BasePage {
      roleName?: string // 角色名称
      roleKey?: string // 角色权限字符串
      status?: 'NORMAL' | 'DISABLED' // 角色状态（NORMAL 正常 DISABLED 停用）
      startCreateTime?: string // 创建时间 - 开始
      endCreateTime?: string // 创建时间 - 结束
      userId?: number // 用户编号
    }

    /** 角色分页响应数据 */
    interface RolePageData {
      records: RoleListItem[]
      current: number
      size: number
      total: number
      sorts?: Api.Common.OrderItem[]
    }

    /** 角色列表项（包含更多字段） */
    interface RoleListItem {
      id: number
      roleName: string
      roleKey: string // 角色权限字符串
      sort: number // 显示顺序
      dataScope: string // 数据范围
      status: 'NORMAL' | 'DISABLED' // 角色状态
      menuIdList?: number[] // 菜单编号列表
      deptIdList?: number[] // 部门编号列表
      createBy?: string
      createTime: string
      updateBy?: string
      updateTime?: string
      remark?: string // 备注
    }

    /** 添加角色参数 */
    interface AddRoleParams {
      roleName: string // 角色名称
      roleKey: string // 角色权限字符串
      sort?: number // 显示顺序
      dataScope?: string // 数据范围
      menuIdList?: number[] // 菜单编号列表
      deptIdList?: number[] // 部门编号列表
      remark?: string // 备注
    }

    /** 更新角色参数 */
    interface UpdateRoleParams extends AddRoleParams {
      id: number // 角色编号
    }
  }

  // 部门类型
  namespace Dept {
    /** 部门列表项 */
    interface DeptList {
      id: number
      deptName: string
      parentId: number
      checked: boolean
    }
  }
}
