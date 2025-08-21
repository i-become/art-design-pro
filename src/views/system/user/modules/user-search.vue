<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    @reset="handleReset"
    @search="handleSearch"
  >
    <template #email>
      <ElInput v-model="formData.email" placeholder="我是插槽渲染出来的组件" />
    </template>
  </ArtSearchBar>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'

  interface Props {
    modelValue: Record<string, any>
  }
  interface Emits {
    (e: 'update:modelValue', value: Record<string, any>): void
    (e: 'search', params: Record<string, any>): void
    (e: 'reset'): void
  }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 表单数据双向绑定
  const searchBarRef = ref()
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // --- 表单配置项 ---
  const formItems = computed(() => [
    {
      label: '账号',
      key: 'loginName',
      type: 'input',
      placeholder: '请输入账号',
      clearable: true
    },
    {
      label: '用户名',
      key: 'username',
      type: 'input',
      placeholder: '请输入用户名',
      clearable: true
    },
    {
      label: '手机号',
      key: 'phone',
      type: 'input',
      placeholder: '请输入手机号',
      clearable: true
    },
    {
      label: '日期范围',
      key: 'daterange',
      type: 'datetime',
      props: {
        placeholder: '请选择日期',
        type: 'daterange',
        rangeSeparator: '至',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期'
      }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      placeholder: '请选择状态',
      clearable: true,
      options: [
        { label: '正常', value: 'NORMAL' },
        { label: '停用', value: 'DISABLED' }
      ]
    }
  ])

  // 事件
  function handleReset() {
    console.log('重置表单')
    emit('reset')
  }

  async function handleSearch() {
    await searchBarRef.value.validate()
    emit('search', formData.value)
    console.log('表单数据', formData.value)
  }
</script>
