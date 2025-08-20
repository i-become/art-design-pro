<template>
  <div class="page-content">
    <ElForm :model="searchForm" @submit.prevent="handleSearch">
      <ElRow :gutter="12">
        <ElCol :xs="24" :sm="12" :lg="6">
          <ElFormItem>
            <ElInput
              :placeholder="t('role.search.roleName')"
              v-model="searchForm.roleName"
              clearable
            ></ElInput>
          </ElFormItem>
        </ElCol>
        <ElCol :xs="24" :sm="12" :lg="6">
          <ElFormItem>
            <ElInput
              :placeholder="t('role.search.roleKey')"
              v-model="searchForm.roleKey"
              clearable
            ></ElInput>
          </ElFormItem>
        </ElCol>
        <ElCol :xs="24" :sm="12" :lg="6">
          <ElFormItem>
            <ElSelect v-model="searchForm.status" :placeholder="t('role.search.status')" clearable>
              <ElOption :label="t('role.status.normal')" value="NORMAL" />
              <ElOption :label="t('role.status.disabled')" value="DISABLED" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :xs="24" :sm="12" :lg="6">
          <ElFormItem>
            <ElButton type="primary" @click="handleSearch" v-ripple>{{
              t('table.searchBar.search')
            }}</ElButton>
            <ElButton @click="resetSearch" v-ripple>{{ t('table.searchBar.reset') }}</ElButton>
            <ElButton @click="showDialog('add')" v-ripple>{{ t('role.dialog.add') }}</ElButton>
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>

    <ArtTable
      :data="roleList"
      :loading="loading"
      :pagination="pagination"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #default>
        <ElTableColumn :label="t('role.table.roleName')" prop="roleName" align="center" />
        <ElTableColumn :label="t('role.table.roleKey')" prop="roleKey" align="center" />
        <ElTableColumn :label="t('role.table.sort')" prop="sort" width="80" align="center" />
        <ElTableColumn :label="t('role.table.dataScope')" prop="dataScope" align="center">
          <template #default="scope">
            <ElTag :type="getDataScopeType(scope.row.dataScope)">
              {{ getDataScopeLabel(scope.row.dataScope) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('role.table.status')" prop="status" width="80" align="center">
          <template #default="scope">
            <ElTag :type="scope.row.status === 'NORMAL' ? 'primary' : 'info'">
              {{
                scope.row.status === 'NORMAL' ? t('role.status.normal') : t('role.status.disabled')
              }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('role.table.createTime')" prop="createTime" align="center">
          <template #default="scope">
            {{ formatTableDateTime(scope.row.createTime) }}
          </template>
        </ElTableColumn>
        <ElTableColumn fixed="right" :label="t('role.table.operation')" width="120">
          <template #default="scope">
            <ElRow>
              <ArtButtonMore
                :list="[
                  { key: 'permission', label: t('role.operation.permission') },
                  { key: 'edit', label: t('role.operation.edit') },
                  {
                    key: 'status',
                    label:
                      scope.row.status === 'NORMAL'
                        ? t('role.operation.disable')
                        : t('role.operation.enable')
                  },
                  { key: 'delete', label: t('role.operation.delete') }
                ]"
                @click="buttonMoreClick($event, scope.row)"
              />
            </ElRow>
          </template>
        </ElTableColumn>
      </template>
    </ArtTable>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? t('role.dialog.add') : t('role.dialog.edit')"
      width="500px"
      align-center
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px">
        <ElFormItem :label="t('role.dialog.form.roleName')" prop="roleName">
          <ElInput v-model="form.roleName" :placeholder="t('role.dialog.placeholder.roleName')" />
        </ElFormItem>
        <ElFormItem :label="t('role.dialog.form.roleKey')" prop="roleKey">
          <ElInput v-model="form.roleKey" :placeholder="t('role.dialog.placeholder.roleKey')" />
        </ElFormItem>
        <ElFormItem :label="t('role.dialog.form.sort')" prop="sort">
          <ElInputNumber
            v-model="form.sort"
            :min="0"
            :max="999"
            :placeholder="t('role.dialog.placeholder.sort')"
          />
        </ElFormItem>
        <ElFormItem :label="t('role.dialog.form.dataScope')" prop="dataScope">
          <ElSelect v-model="form.dataScope" :placeholder="t('role.dialog.placeholder.dataScope')">
            <ElOption :label="t('role.dataScope.all')" value="ALL" />
            <ElOption :label="t('role.dataScope.custom')" value="CUSTOM" />
            <ElOption :label="t('role.dataScope.deptAndChild')" value="DEPT_AND_CHILD" />
            <ElOption :label="t('role.dataScope.dept')" value="DEPT" />
            <ElOption :label="t('role.dataScope.self')" value="SELF" />
            <ElOption :label="t('role.dataScope.none')" value="NONE" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="t('role.dialog.form.remark')" prop="remark">
          <ElInput
            v-model="form.remark"
            type="textarea"
            :rows="3"
            :placeholder="t('role.dialog.placeholder.remark')"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="dialogVisible = false">{{ t('common.cancel') }}</ElButton>
          <ElButton type="primary" @click="handleSubmit(formRef)" :loading="submitLoading">{{
            t('common.confirm')
          }}</ElButton>
        </div>
      </template>
    </ElDialog>

    <ElDialog
      v-model="permissionDialog"
      :title="t('role.dialog.permission')"
      width="520px"
      align-center
      class="el-dialog-border"
    >
      <ElScrollbar height="70vh">
        <ElTree
          ref="treeRef"
          :data="processedMenuList"
          show-checkbox
          node-key="name"
          :default-expand-all="isExpandAll"
          :default-checked-keys="checkedMenuKeys"
          :props="defaultProps"
          @check="handleTreeCheck"
        >
          <template #default="{ data }">
            <div style="display: flex; align-items: center">
              <span v-if="data.isAuth">
                {{ data.label }}
              </span>
              <span v-else>{{ defaultProps.label(data) }}</span>
            </div>
          </template>
        </ElTree>
      </ElScrollbar>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="toggleExpandAll">{{
            isExpandAll ? t('role.permission.collapseAll') : t('role.permission.expandAll')
          }}</ElButton>
          <ElButton @click="toggleSelectAll" style="margin-left: 8px">{{
            isSelectAll ? t('role.permission.unselectAll') : t('role.permission.selectAll')
          }}</ElButton>
          <ElButton type="primary" @click="savePermission" :loading="permissionLoading">{{
            t('role.permission.save')
          }}</ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { useMenuStore } from '@/store/modules/menu'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { formatMenuTitle } from '@/router/utils/utils'
  import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import { RoleService } from '@/api/roleApi'
  import { formatTableDateTime } from '@/utils/dataprocess/format'
  import { useI18n } from 'vue-i18n'

  defineOptions({ name: 'Role' })

  const { t } = useI18n()

  const dialogVisible = ref(false)
  const permissionDialog = ref(false)
  const { menuList } = storeToRefs(useMenuStore())
  const treeRef = ref()
  const isExpandAll = ref(true)
  const isSelectAll = ref(false)
  const checkedMenuKeys = ref<string[]>([])

  // 处理菜单数据，将 authList 转换为子节点
  const processedMenuList = computed(() => {
    const processNode = (node: any) => {
      const processed = { ...node }

      // 如果有 authList，将其转换为子节点
      if (node.meta && node.meta.authList && node.meta.authList.length) {
        const authNodes = node.meta.authList.map((auth: any) => ({
          id: `${node.id}_${auth.authMark}`,
          name: `${node.name}_${auth.authMark}`,
          label: auth.title,
          authMark: auth.authMark,
          isAuth: true,
          checked: auth.checked || false
        }))

        processed.children = processed.children ? [...processed.children, ...authNodes] : authNodes
      }

      // 递归处理子节点
      if (processed.children) {
        processed.children = processed.children.map(processNode)
      }

      return processed
    }

    return menuList.value.map(processNode)
  })

  const formRef = ref<FormInstance>()

  const rules = reactive<FormRules>({
    roleName: [
      { required: true, message: t('role.validation.roleNameRequired'), trigger: 'blur' },
      { min: 2, max: 20, message: t('role.validation.roleNameLength'), trigger: 'blur' }
    ],
    roleKey: [
      { required: true, message: t('role.validation.roleKeyRequired'), trigger: 'blur' },
      { min: 2, max: 20, message: t('role.validation.roleKeyLength'), trigger: 'blur' }
    ]
  })

  const form = reactive<Api.Role.AddRoleParams>({
    roleName: '',
    roleKey: '',
    sort: 0,
    dataScope: 'ALL',
    menuIdList: [],
    deptIdList: [],
    remark: ''
  })

  const roleList = ref<Api.Role.RoleListItem[]>([])
  const loading = ref(false)
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  const searchForm = reactive({
    roleName: '',
    roleKey: '',
    status: '' as string | undefined
  })

  const submitLoading = ref(false)
  const permissionLoading = ref(false)
  const currentRoleId = ref<number>()

  onMounted(() => {
    getTableData()
  })

  const getTableData = () => {
    loading.value = true
    const params: Api.Role.RolePageParams = {
      current: pagination.current,
      size: pagination.size,
      roleName: searchForm.roleName || undefined,
      roleKey: searchForm.roleKey || undefined,
      status: searchForm.status as 'NORMAL' | 'DISABLED' | undefined
    }

    RoleService.getRolePage(params)
      .then((res: any) => {
        roleList.value = res.records || []
        pagination.total = res.total || 0
      })
      .catch((err: any) => {
        console.error(t('role.message.getListFailed'), err)
      })
      .finally(() => {
        loading.value = false
      })
  }

  const handleSearch = () => {
    pagination.current = 1
    getTableData()
  }

  const resetSearch = () => {
    Object.assign(searchForm, {
      roleName: '',
      roleKey: '',
      status: ''
    })
    pagination.current = 1
    getTableData()
  }

  const dialogType = ref('add')

  const showDialog = (type: string, row?: Api.Role.RoleListItem) => {
    dialogVisible.value = true
    dialogType.value = type

    if (type === 'edit' && row) {
      Object.assign(form, {
        roleName: row.roleName,
        roleKey: row.roleKey,
        sort: row.sort,
        dataScope: row.dataScope,
        remark: row.remark
      })
      currentRoleId.value = row.id
    } else {
      Object.assign(form, {
        roleName: '',
        roleKey: '',
        sort: 0,
        dataScope: 'ALL',
        remark: ''
      })
      currentRoleId.value = undefined
    }
  }

  const buttonMoreClick = (item: ButtonMoreItem, row: Api.Role.RoleListItem) => {
    if (item.key === 'permission') {
      showPermissionDialog(row)
    } else if (item.key === 'edit') {
      showDialog('edit', row)
    } else if (item.key === 'delete') {
      deleteRole(row)
    } else if (item.key === 'status') {
      toggleStatus(row)
    }
  }

  const showPermissionDialog = (row: Api.Role.RoleListItem) => {
    currentRoleId.value = row.id
    permissionDialog.value = true
    // TODO: 获取角色当前的菜单权限
    // checkedMenuKeys.value = row.menuIdList || []
  }

  const defaultProps = {
    children: 'children',
    label: (data: any) => formatMenuTitle(data.meta?.title) || ''
  }

  const deleteRole = (row: Api.Role.RoleListItem) => {
    ElMessageBox.confirm(t('role.message.deleteConfirm'), t('common.tips'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'error'
    }).then(() => {
      RoleService.deleteRole(row.id)
        .then(() => {
          ElMessage.success(t('role.message.deleteSuccess'))
          getTableData()
        })
        .catch((err: any) => {
          console.error(t('role.message.deleteFailed'), err)
        })
    })
  }

  const handleSubmit = async (formEl: FormInstance | undefined) => {
    if (!formEl) return

    await formEl.validate((valid) => {
      if (valid) {
        submitLoading.value = true
        const message =
          dialogType.value === 'add' ? t('role.message.addSuccess') : t('role.message.editSuccess')

        if (dialogType.value === 'add') {
          RoleService.addRole(form)
            .then(() => {
              ElMessage.success(message)
              dialogVisible.value = false
              formEl.resetFields()
              getTableData()
            })
            .catch((err: any) => {
              console.error(t('role.message.submitFailed'), err)
            })
            .finally(() => {
              submitLoading.value = false
            })
        } else {
          if (!currentRoleId.value) return
          const updateData: Api.Role.UpdateRoleParams = {
            id: currentRoleId.value,
            ...form
          }
          RoleService.updateRole(currentRoleId.value, updateData)
            .then(() => {
              ElMessage.success(message)
              dialogVisible.value = false
              formEl.resetFields()
              getTableData()
            })
            .catch((err: any) => {
              console.error(t('role.message.submitFailed'), err)
            })
            .finally(() => {
              submitLoading.value = false
            })
        }
      }
    })
  }

  const savePermission = () => {
    if (!currentRoleId.value) return

    permissionLoading.value = true
    const checkedKeys = treeRef.value?.getCheckedKeys() || []

    // TODO: 调用更新角色菜单权限的API
    // RoleService.updateRoleMenus(currentRoleId.value, checkedKeys)
    console.log('Selected menu keys:', checkedKeys)

    // 模拟API调用
    setTimeout(() => {
      ElMessage.success(t('role.message.permissionSaveSuccess'))
      permissionDialog.value = false
      permissionLoading.value = false
    }, 1000)
  }

  const toggleExpandAll = () => {
    const tree = treeRef.value
    if (!tree) return

    // 使用store.nodesMap直接控制所有节点的展开状态
    const nodes = tree.store.nodesMap
    for (const node in nodes) {
      nodes[node].expanded = !isExpandAll.value
    }

    isExpandAll.value = !isExpandAll.value
  }

  const toggleSelectAll = () => {
    const tree = treeRef.value
    if (!tree) return

    if (!isSelectAll.value) {
      // 全选：获取所有节点的key并设置为选中
      const allKeys = getAllNodeKeys(processedMenuList.value)
      tree.setCheckedKeys(allKeys)
    } else {
      // 取消全选：清空所有选中
      tree.setCheckedKeys([])
    }

    isSelectAll.value = !isSelectAll.value
  }

  const getAllNodeKeys = (nodes: any[]): string[] => {
    const keys: string[] = []
    const traverse = (nodeList: any[]) => {
      nodeList.forEach((node) => {
        if (node.name) {
          keys.push(node.name)
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children)
        }
      })
    }
    traverse(nodes)
    return keys
  }

  const handleTreeCheck = () => {
    const tree = treeRef.value
    if (!tree) return

    // 使用树组件的getCheckedKeys方法获取选中的节点
    const checkedKeys = tree.getCheckedKeys()
    const allKeys = getAllNodeKeys(processedMenuList.value)

    // 判断是否全选：选中的节点数量等于总节点数量
    isSelectAll.value = checkedKeys.length === allKeys.length && allKeys.length > 0
  }

  const getDataScopeType = (scope: string) => {
    switch (scope) {
      case 'ALL':
        return 'success'
      case 'CUSTOM':
        return 'info'
      case 'DEPT_AND_CHILD':
        return 'warning'
      case 'DEPT':
        return 'danger'
      case 'SELF':
        return 'primary'
      case 'NONE':
        return 'info'
      default:
        return 'info'
    }
  }

  const getDataScopeLabel = (scope: string) => {
    switch (scope) {
      case 'ALL':
        return t('role.dataScope.all')
      case 'CUSTOM':
        return t('role.dataScope.custom')
      case 'DEPT_AND_CHILD':
        return t('role.dataScope.deptAndChild')
      case 'DEPT':
        return t('role.dataScope.dept')
      case 'SELF':
        return t('role.dataScope.self')
      case 'NONE':
        return t('role.dataScope.none')
      default:
        return t('role.dataScope.all')
    }
  }

  const handlePageChange = (val: number) => {
    pagination.current = val
    getTableData()
  }

  const handleSizeChange = (val: number) => {
    pagination.size = val
    pagination.current = 1
    getTableData()
  }

  const toggleStatus = (row: Api.Role.RoleListItem) => {
    const newStatus = row.status === 'NORMAL' ? 'DISABLED' : 'NORMAL'
    const confirmMessage =
      newStatus === 'NORMAL' ? t('role.message.enableConfirm') : t('role.message.disableConfirm')

    ElMessageBox.confirm(confirmMessage, t('common.tips'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    }).then(() => {
      const apiCall =
        newStatus === 'NORMAL' ? RoleService.enableRole(row.id) : RoleService.disableRole(row.id)

      apiCall
        .then(() => {
          const successMessage =
            newStatus === 'NORMAL'
              ? t('role.message.enableSuccess')
              : t('role.message.disableSuccess')
          ElMessage.success(successMessage)
          getTableData()
        })
        .catch((err: any) => {
          console.error(t('role.message.updateStatusFailed'), err)
        })
    })
  }
</script>

<style lang="scss" scoped>
  .page-content {
    .svg-icon {
      width: 1.8em;
      height: 1.8em;
      overflow: hidden;
      vertical-align: -8px;
      fill: currentcolor;
    }
  }
</style>
