<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '添加用户' : '编辑用户'"
    width="30%"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElFormItem label="账号" prop="loginName">
        <ElInput
          v-model="formData.loginName"
          :placeholder="dialogType === 'add' ? '请输入账号' : ''"
          :disabled="dialogType === 'edit'"
        />
      </ElFormItem>
      <ElFormItem label="密码" prop="password">
        <ElInput
          show-password
          v-model="formData.password"
          :placeholder="dialogType === 'add' ? '请输入密码' : '不填则不修改密码'"
        />
      </ElFormItem>
      <ElFormItem label="用户名" prop="username">
        <ElInput v-model="formData.username" placeholder="请输入用户名" />
      </ElFormItem>
      <ElFormItem label="部门" prop="deptId">
        <ElTreeSelect
          v-model="formData.deptId"
          :data="deptTree"
          :props="{
            value: 'id',
            label: 'deptName',
            children: 'children'
          }"
          placeholder="请选择部门"
          check-strictly
          default-expand-all
        />
      </ElFormItem>
      <ElFormItem label="性别" prop="sex">
        <ElSelect v-model="formData.sex" placeholder="请选择性别">
          <ElOption label="男" value="BOY" />
          <ElOption label="女" value="GIRL" />
          <ElOption label="未知" value="UNKNOWN" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="角色" prop="roleIds">
        <!-- 
          角色选择器说明：
          - 角色列表显示当前用户拥有的角色（通过 getRoles 获取）
          - 编辑时回显被编辑用户当前的角色（通过 getUserRoles 获取）
          - 当前用户只能从自己拥有的角色中选择分配给其他用户
        -->
        <ElSelect v-model="formData.roleIds" multiple placeholder="请选择角色">
          <ElOption
            v-for="role in roleList"
            :key="role.id"
            :value="role.id"
            :label="role.roleName"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="邮箱" prop="email">
        <ElInput v-model="formData.email" placeholder="请输入邮箱" />
      </ElFormItem>
      <ElFormItem label="手机号" prop="phone">
        <ElInput v-model="formData.phone" placeholder="请输入手机号" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { UserService } from '@/api/usersApi'
  import { DeptService } from '@/api/deptApi'
  import { encryptByMD5 } from '@/utils/dataprocess/encrypt'

  interface Props {
    visible: boolean
    type: string
    userData?: any
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 部门树数据
  const deptTree = ref<Api.Dept.DeptList[]>([])
  const getDeptTree = async () => {
    const data = await DeptService.getDeptTree()
    deptTree.value = data
  }

  // 角色列表数据 - 显示当前用户拥有的角色（用于授权给其他用户）
  const roleList = ref<Api.Role.RoleList[]>([])
  const getRoles = async () => {
    const data = await UserService.getRoles()
    roleList.value = data
  }

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogType = computed(() => props.type)

  // 表单实例
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive<Api.User.AddUserParams & { id?: number }>({
    id: undefined, // 用户ID（编辑时需要）
    deptId: undefined, // 部门编号
    loginName: undefined, // 账号
    password: undefined, // 密码
    username: undefined, // 用户名
    email: undefined, // 邮箱
    phone: undefined, // 手机号码
    sex: 'BOY',
    avatar: undefined, // 头像路径
    roleIds: [] as number[], // 角色编号列表,
    postIds: [] as number[] // 岗位编号列表
  })

  // 表单验证规则
  const rules = computed<FormRules>(() => {
    const baseRules: FormRules = {
      deptId: [{ required: true, message: '请选择部门', trigger: 'change' }],
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
      ],
      email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
      phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }],
      sex: [{ required: true, message: '请选择性别', trigger: 'change' }],
      roleIds: [{ required: true, message: '请选择角色', trigger: 'change' }]
    }

    // 在新增模式下，账号和密码为必填
    if (dialogType.value === 'add') {
      baseRules.loginName = [
        { required: true, message: '请输入账号', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
      ]
      baseRules.password = [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
      ]
    } else {
      // 在编辑模式下，账号不需要验证（因为不可编辑），密码为可选
      baseRules.password = [
        {
          validator: (rule, value, callback) => {
            if (value && value.trim() !== '') {
              if (value.length < 6 || value.length > 20) {
                callback(new Error('密码长度在 6 到 20 个字符'))
              } else {
                callback()
              }
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    }

    return baseRules
  })

  // 初始化表单数据
  const initFormData = async () => {
    const isEdit = props.type === 'edit' && props.userData
    const row = props.userData

    if (isEdit && row) {
      // 编辑模式下，获取被编辑用户的角色信息用于回显
      let userRoleIds: number[] = []
      try {
        const userRoles = await UserService.getUserRoles(row.id)
        // 提取角色ID数组
        userRoleIds = userRoles.map((role) => role.id)
      } catch (error) {
        console.warn('获取用户角色信息失败:', error)
        userRoleIds = []
      }

      Object.assign(formData, {
        id: row.id,
        deptId: row.deptId || undefined,
        loginName: row.loginName || '',
        password: '', // 编辑时密码为空，用户可选择修改
        username: row.username || '',
        email: row.email || '',
        phone: row.phone || '',
        sex: row.sex || 'BOY',
        avatar: row.avatar || undefined,
        roleIds: userRoleIds, // 回显用户当前的角色
        postIds: [] // 暂时设为空数组，后续可以添加获取岗位信息的API
      })
    } else {
      // 新增时重置表单
      Object.assign(formData, {
        id: undefined,
        deptId: undefined,
        loginName: '',
        password: '',
        username: '',
        email: '',
        phone: '',
        sex: 'BOY',
        avatar: undefined,
        roleIds: [],
        postIds: []
      })
    }
  }

  // 统一监听对话框状态变化
  watch(
    () => [props.visible, props.type, props.userData],
    async ([visible]) => {
      if (visible) {
        await initFormData()
        getRoles()
        getDeptTree()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    },
    { immediate: true }
  )

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate(async (valid) => {
        if (valid) {
          if (dialogType.value === 'add') {
            const submitData = { ...formData }
            if (submitData.password) {
              submitData.password = encryptByMD5(submitData.password)
            }
            await UserService.addUser(submitData)
            ElMessage.success('添加成功')
          } else {
            // 编辑用户逻辑
            const submitData = { ...formData }

            // 如果密码为空，则不包含密码字段
            if (!submitData.password || submitData.password.trim() === '') {
              delete submitData.password
            } else {
              // 如果填写了密码，则加密
              submitData.password = encryptByMD5(submitData.password)
            }

            // 确保有用户ID
            if (props.userData?.id) {
              await UserService.updateUser(props.userData.id, submitData)
              ElMessage.success('更新成功')
            } else {
              throw new Error('用户ID不存在')
            }
          }
          dialogVisible.value = false
          emit('submit')
        }
      })
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    }
  }
</script>
