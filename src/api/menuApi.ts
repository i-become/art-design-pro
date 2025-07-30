import { menuDataToRouter } from '@/router/utils/menuToRouter'
import { AppRouteRecord } from '@/types/router'
import request from '@/utils/http'

interface MenuResponse {
  menuList: AppRouteRecord[]
}

/**
 * 将后端菜单数据转换为前端路由格式
 * @param menu 后端菜单数据
 * @returns 转换后的路由配置
 */
const convertMenuToRoute = (menu: Api.Menu.MenuList): AppRouteRecord => {
  // 如果是按钮类型，返回 null，这些会在父级菜单的 authList 中处理
  if (menu.type === 'F') {
    return null as any
  }

  return {
    id: menu.id,
    name: menu.name, // 用作 KeepAlive 缓存标识 && 按钮权限筛选
    path: menu.path || '',
    redirect: menu.redirect,
    component: menu.component, // 视图文件路径
    children: [], // 子菜单会在后续处理
    meta: {
      title: menu.title, // 路由标题，用作 document.title || 菜单的名称
      icon: menu.icon, // 菜单和面包屑对应的图标
      isHide: menu.isHide, // 是否在菜单中隐藏
      keepAlive: menu.isKeepAlive, // 是否缓存路由
      isFullPage: menu.isFull, // 菜单是否全屏
      fixedTab: menu.isAffix, // 菜单是否固定在标签页中
      link: menu.type === 'L' ? menu.path : undefined, // 外链类型时的跳转链接
      isIframe: menu.target === 'N', // target为N时在新窗口打开
      activePath: menu.active, // 默认激活菜单的 index
      showTextBadge: menu.tag, // 菜单标签，会显示红色角标
      authList: [] // 将在 processMenuTree 中填充
    }
  }
}

/**
 * 递归处理菜单树
 * @param menuList 菜单列表
 * @param parentId 父级ID
 * @returns 处理后的路由配置数组
 */
const processMenuTree = (menuList: Api.Menu.MenuList[]): AppRouteRecord[] => {
  const result: AppRouteRecord[] = []

  // 找出根节点（没有父节点的节点）
  const rootMenus = menuList.filter(
    (menu) => !menuList.some((item) => item.id === menu.parentId) && menu.type !== 'F'
  )

  // 处理每个根节点及其子节点
  rootMenus.forEach((menu) => {
    const route = convertMenuToRoute(menu)
    if (route) {
      // 查找该菜单下的所有按钮，转换为 authList
      const buttons = menuList
        .filter(
          (item) => item.parentId === menu.id && item.type === 'F' && item.perms // 只包含有权限标识的按钮
        )
        .map((button) => ({
          title: button.title,
          authMark: button.perms as string
        }))

      if (buttons.length > 0) {
        route.meta.authList = buttons
      }

      // 递归处理子菜单
      route.children = processChildrenMenus(menuList, menu.id)
      result.push(route)
    }
  })

  return result
}

/**
 * 处理子菜单
 * @param menuList 完整的菜单列表
 * @param parentId 父级ID
 * @returns 子菜单路由配置数组
 */
const processChildrenMenus = (
  menuList: Api.Menu.MenuList[],
  parentId: number
): AppRouteRecord[] => {
  const children: AppRouteRecord[] = []

  menuList.forEach((menu) => {
    if (menu.parentId === parentId && menu.type !== 'F') {
      const route = convertMenuToRoute(menu)
      if (route) {
        // 查找该菜单下的所有按钮，转换为 authList
        const buttons = menuList
          .filter(
            (item) => item.parentId === menu.id && item.type === 'F' && item.perms // 只包含有权限标识的按钮
          )
          .map((button) => ({
            title: button.title,
            authMark: button.perms as string
          }))

        if (buttons.length > 0) {
          route.meta.authList = buttons
        }

        // 递归处理子菜单
        route.children = processChildrenMenus(menuList, menu.id)
        children.push(route)
      }
    }
  })

  return children
}

// 菜单接口
export const menuService = {
  async getMenuList(delay = 300): Promise<MenuResponse> {
    try {
      // 获取菜单数据
      const response = await request.get<Api.Menu.MenuList[]>({
        url: '/menu'
      })
      // 将后端返回的扁平菜单数据转换为树形路由配置
      const menuList = processMenuTree(response)
      console.log(menuList)
      // 处理每个路由的完整路径和组件
      const processedMenuList = menuList.map((route) => menuDataToRouter(route))

      // 模拟接口延迟
      await new Promise((resolve) => setTimeout(resolve, delay))

      return { menuList: processedMenuList }
    } catch (error) {
      throw error instanceof Error ? error : new Error('获取菜单失败')
    }
  }
}
