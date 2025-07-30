<!-- 用户搜索栏 -->
<template>
  <ArtSearchBar
    v-model:filter="searchFormState"
    :items="formItems"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import type { SearchChangeParams, SearchFormItem } from '@/types'

  interface Emits {
    (e: 'search', params: Record<string, any>): void
    (e: 'reset'): void
  }

  const props = defineProps<{
    filter: Record<string, any>
  }>()

  const emit = defineEmits<Emits>()

  const searchFormState = ref({ ...props.filter })

  watch(
    () => props.filter,
    (newFilter) => {
      searchFormState.value = { ...newFilter }
    },
    { deep: true, immediate: true }
  )

  // 重置表单
  const handleReset = () => {
    searchFormState.value = { ...props.filter }
    emit('reset')
  }

  // 搜索处理
  const handleSearch = () => {
    console.log('搜索参数:', searchFormState.value)
    emit('search', searchFormState.value)
  }

  const handleFormChange = (params: SearchChangeParams): void => {
    console.log('表单项变更:', params)
  }

  // --- 表单配置项 ---
  const formItems: SearchFormItem[] = [
    {
      label: '账号',
      prop: 'loginName',
      type: 'input',
      config: {
        clearable: true
      },
      onChange: handleFormChange
    },
    {
      label: '用户名',
      prop: 'username',
      type: 'input',
      config: {
        clearable: true
      },
      onChange: handleFormChange
    },
    {
      label: '电话',
      prop: 'phone',
      type: 'input',
      config: {
        clearable: true
      },
      onChange: handleFormChange
    },
    {
      prop: 'daterange',
      label: '日期范围',
      type: 'datetimerange',
      config: {
        type: 'datetimerange',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间'
      }
    },
    {
      label: '状态',
      prop: 'status',
      type: 'radio',
      options: [
        { label: '正常', value: 'NORMAL' },
        { label: '停用', value: 'DISABLED' }
      ],
      onChange: handleFormChange
    }
  ]
</script>
