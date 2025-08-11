import request from '@/utils/http'

interface DeptTreeNode extends Api.Dept.DeptList {
  children?: DeptTreeNode[]
}

export class DeptService {
  // 将部门列表转换为树状结构
  private static buildDeptTree(depts: Api.Dept.DeptList[]): DeptTreeNode[] {
    const deptMap = new Map<number, DeptTreeNode>()
    const result: DeptTreeNode[] = []
    const hasParent = new Set<number>()

    // 先将所有部门转换为节点并存入 Map
    depts.forEach((dept) => {
      deptMap.set(dept.id, { ...dept, children: [] })
    })

    // 构建树状结构
    depts.forEach((dept) => {
      const node = deptMap.get(dept.id)!
      const parentNode = dept.parentId ? deptMap.get(dept.parentId) : null

      if (parentNode) {
        // 有父节点，添加到父节点的children中
        parentNode.children = parentNode.children || []
        parentNode.children.push(node)
        hasParent.add(dept.id)
      }
    })

    // 将所有没有父节点的部门作为根节点
    deptMap.forEach((node, id) => {
      if (!hasParent.has(id)) {
        result.push(node)
      }
    })

    return result
  }

  // 获取部门树
  static async getDeptTree() {
    const data = await request.get<Api.Dept.DeptList[]>({
      url: '/dept/list'
    })
    return this.buildDeptTree(data)
  }
}
