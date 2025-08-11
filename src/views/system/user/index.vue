<!-- 用户管理 -->
<!-- art-full-height 自动计算出页面剩余高度 -->
<!-- art-table-card 一个符合系统样式的 class，同时自动撑满剩余高度 -->
<!-- 如果你想使用 template 语法，请移步功能示例下面的高级表格示例 -->
<template>
  <div class="user-page art-full-height">
    <!-- 搜索栏 -->
    <UserSearch v-model:filter="defaultFilter" @reset="resetSearch" @search="handleSearch" />

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader v-model:columns="columnChecks" @refresh="refreshAll">
        <template #left>
          <ElButton @click="showDialog('add')">新增用户</ElButton>
        </template>
      </ArtTableHeader>

      <!-- 表格 -->
      <ArtTable
        :loading="isLoading"
        :data="tableData"
        :columns="columns"
        :pagination="paginationState"
        @pagination:size-change="onPageSizeChange"
        @pagination:current-change="onCurrentPageChange"
        @sort-change="handleTableSortChange"
      >
      </ArtTable>

      <!-- 用户弹窗 -->
      <UserDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :user-data="currentUserData"
        @success="refreshAll"
      />

      <!-- 调试信息 -->
      <div
        v-if="false"
        style="padding: 10px; margin-top: 20px; background: #f5f5f5; border-radius: 4px"
      >
        <h4>调试信息 - 排序状态</h4>
        <pre>{{ JSON.stringify(debugSortInfo, null, 2) }}</pre>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { ACCOUNT_TABLE_DATA } from '@/mock/temp/formData'
  import { ElMessageBox, ElMessage, ElTag } from 'element-plus'
  import { h, nextTick, ref } from 'vue'
  import { useTable } from '@/composables/useTable'
  import { UserService } from '@/api/usersApi'
  import { formatTableDateTime } from '@/utils/dataprocess/format'
  import UserSearch from './modules/user-search.vue'
  import UserDialog from './modules/user-dialog.vue'

  defineOptions({ name: 'User' })

  type UserListItem = Api.User.UserListItem
  const { width } = useWindowSize()
  const { getUserList } = UserService

  // 弹窗相关
  const dialogType = ref<Form.DialogType>('add')
  const dialogVisible = ref(false)
  const currentUserData = ref<Partial<UserListItem>>({})

  // 表单搜索初始值
  const defaultFilter = ref({
    username: undefined,
    loginName: undefined,
    daterange: [],
    status: 'NORMAL'
  })

  // 用户状态配置
  const USER_STATUS_CONFIG = {
    NORMAL: { type: 'success' as const, text: '正常' },
    DISABLED: { type: 'danger' as const, text: '停用' }
  } as const

  // 用户性别配置
  const USER_SEX_CONFIG = {
    BOY: '男',
    GIRL: '女'
  } as const

  /**
   * 获取用户状态配置
   */
  const getUserStatusConfig = (status: string) => {
    return (
      USER_STATUS_CONFIG[status as keyof typeof USER_STATUS_CONFIG] || {
        type: 'info' as const,
        text: '未知'
      }
    )
  }

  /**
   * 获取用户性别配置
   */
  const getUserSexConfig = (sex: string) => {
    return USER_SEX_CONFIG[sex as keyof typeof USER_SEX_CONFIG] || '未知'
  }

  const {
    columns,
    columnChecks,
    tableData,
    isLoading,
    paginationState,
    searchData,
    searchState,
    resetSearch,
    onPageSizeChange,
    onCurrentPageChange,
    refreshAll,
    refreshAfterRemove,
    sortState,
    handleSortChange
  } = useTable<UserListItem>({
    // 核心配置
    core: {
      apiFn: getUserList,
      apiParams: {
        current: 1,
        size: 20,
        ...defaultFilter.value
        // pageNum: 1,
        // pageSize: 20
      },
      // 自定义分页字段映射，同时需要在 apiParams 中配置字段名
      // paginationKey: {
      //   current: 'pageNum',
      //   size: 'pageSize'
      // },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' }, // 序号
        {
          prop: 'avatar',
          label: '用户名',
          minWidth: width.value < 500 ? 220 : '',
          formatter: (row) => {
            return h('div', { class: 'user', style: 'display: flex; align-items: center' }, [
              h('img', { class: 'avatar', src: row.avatar }),
              h('div', {}, [h('p', { class: 'user-name' }, row.username)])
            ])
          }
        },
        {
          prop: 'loginName',
          label: '账号',
          sortable: true,
          'sort-by': 'loginName'
        },
        {
          prop: 'email',
          label: '邮箱'
        },
        {
          prop: 'sex',
          label: '性别',
          formatter: (row) => getUserSexConfig(row.sex)
        },
        { prop: 'phone', label: '手机号' },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row) => {
            const statusConfig = getUserStatusConfig(row.status)
            return h(ElTag, { type: statusConfig.type }, () => statusConfig.text)
          }
        },
        {
          prop: 'createTime',
          label: '创建日期',
          sortable: true,
          'sort-by': 'createTime',
          formatter: (row) => {
            if (!row.createTime) return '-'
            return formatTableDateTime(row.createTime)
          }
        },
        {
          prop: 'loginIp',
          label: '最后登录IP'
        },
        {
          prop: 'loginDate',
          label: '最后登录时间',
          sortable: true,
          'sort-by': 'loginDate',
          formatter: (row) => {
            if (!row.loginDate) return '-'
            return formatTableDateTime(row.loginDate)
          }
        },
        {
          prop: 'operation',
          label: '操作',
          width: 150,
          fixed: 'right', // 固定列
          'header-align': 'center', // 表头居中对齐
          formatter: (row) =>
            h(
              'div',
              {
                style: 'display: flex; align-items: center; gap: 8px;'
              },
              [
                h(ArtButtonTable, {
                  type: 'edit',
                  onClick: () => showDialog('edit', row)
                }),
                // 根据用户状态显示启用/禁用图标按钮
                row.status === 'NORMAL'
                  ? h(ArtButtonTable, {
                      type: 'disable',
                      onClick: () => disableUser(row)
                    })
                  : h(ArtButtonTable, {
                      type: 'enable',
                      onClick: () => enableUser(row)
                    }),
                h(ArtButtonTable, {
                  type: 'delete',
                  onClick: () => deleteUser(row)
                })
              ]
            )
        }
      ]
    },
    // 数据处理
    transform: {
      // 数据转换器 - 替换头像
      dataTransformer: (records: any) => {
        // 类型守卫检查
        if (!Array.isArray(records)) {
          console.warn('数据转换器: 期望数组类型，实际收到:', typeof records)
          return []
        }

        // 使用本地头像替换接口返回的头像
        return records.map((item: any, index: number) => {
          return item.avatar
            ? { ...item, avatar: item.avatar }
            : {
                ...item,
                avatar: ACCOUNT_TABLE_DATA[index % ACCOUNT_TABLE_DATA.length].avatar
              }
        })
      }
    }
  })

  /**
   * 搜索处理
   * @param params 参数
   */
  const handleSearch = (params: Record<string, any>) => {
    // 处理日期区间参数，把 daterange 转换为 startTime 和 endTime
    const { daterange, ...searchParams } = params
    const [startCreateTime, endCreateTime] = Array.isArray(daterange) ? daterange : [null, null]

    // 搜索参数赋值
    Object.assign(searchState, {
      ...searchParams,
      startCreateTime: startCreateTime,
      endCreateTime: endCreateTime
    })
    searchData()
  }

  /**
   * 显示用户弹窗
   */
  const showDialog = (type: Form.DialogType, row?: UserListItem): void => {
    console.log('打开弹窗:', { type, row })
    dialogType.value = type
    currentUserData.value = row || {}
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  /**
   * 处理表格排序变化
   */
  const handleTableSortChange = ({
    column,
    prop,
    order
  }: {
    column: any
    prop: string
    order: string
  }) => {
    console.log('排序变化:', { column, prop, order })
    // 将Element Plus的排序值转换为我们的排序值
    const sortOrder = order === 'ascending' ? 'asc' : order === 'descending' ? 'desc' : null
    handleSortChange(prop, sortOrder as 'asc' | 'desc' | null)
  }

  // 调试信息：显示当前排序状态
  const debugSortInfo = computed(() => {
    const sorts = (searchState as any).sorts || []
    return {
      currentSort: sortState,
      sortsParams: sorts,
      searchParams: { ...searchState }
    }
  })

  /**
   * 删除用户
   */
  const deleteUser = async (row: UserListItem): Promise<void> => {
    try {
      await ElMessageBox.confirm(
        `确定要删除用户 "${row.username}" 吗？此操作不可恢复！`,
        '删除用户',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      )

      // 调用删除API
      await UserService.deleteUser(row.id)
      ElMessage.success('用户删除成功')

      // 删除后刷新数据
      refreshAfterRemove()
    } catch (error: any) {
      if (error !== 'cancel') {
        // 不是用户取消操作
        ElMessage.error(error.message || '删除失败，请稍后重试')
        console.error('删除用户失败:', error)
      }
    }
  }

  /**
   * 禁用用户
   */
  const disableUser = async (row: UserListItem): Promise<void> => {
    try {
      await ElMessageBox.confirm(
        `确定要禁用用户 "${row.username}" 吗？禁用后该用户将无法登录系统。`,
        '禁用用户',
        {
          confirmButtonText: '确定禁用',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      // 调用禁用API
      await UserService.disableUser(row.id)
      ElMessage.success('用户禁用成功')

      // 禁用后刷新数据
      refreshAll()
    } catch (error: any) {
      if (error !== 'cancel') {
        // 不是用户取消操作
        ElMessage.error(error.message || '禁用失败，请稍后重试')
        console.error('禁用用户失败:', error)
      }
    }
  }

  /**
   * 启用用户
   */
  const enableUser = async (row: UserListItem): Promise<void> => {
    try {
      await ElMessageBox.confirm(
        `确定要启用用户 "${row.username}" 吗？启用后该用户将可以正常登录系统。`,
        '启用用户',
        {
          confirmButtonText: '确定启用',
          cancelButtonText: '取消',
          type: 'info'
        }
      )

      // 调用启用API
      await UserService.enableUser(row.id)
      ElMessage.success('用户启用成功')

      // 启用后刷新数据
      refreshAll()
    } catch (error: any) {
      if (error !== 'cancel') {
        // 不是用户取消操作
        ElMessage.error(error.message || '启用失败，请稍后重试')
        console.error('启用用户失败:', error)
      }
    }
  }
</script>

<style lang="scss" scoped>
  .user-page {
    :deep(.user) {
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 6px;
      }

      > div {
        margin-left: 10px;

        .user-name {
          font-weight: 500;
          color: var(--art-text-gray-800);
        }
      }
    }
  }
</style>
