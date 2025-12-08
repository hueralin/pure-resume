'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Card,
  Modal,
  Typography,
  App,
  Tabs,
  Form,
  InputNumber
} from 'antd'
import {
  SearchOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { useAuthStore } from '@/lib/store'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography

interface User {
  id: string
  email: string
  name: string | null
  role: string
  banned: boolean
  subscriptionState: 'none' | 'valid' | 'expired'
  subscriptionExpiresAt: string | null
  resumeCount: number
  createdAt: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface Subscription {
  id: string
  userId: string
  user: {
    email: string
    name: string | null
    banned: boolean
  }
  activationCode: string
  startAt: string
  expiresAt: string
  status: string
  subscriptionState: 'active' | 'expired'
  createdAt: string
}

interface ActivationCode {
  code: string
  used: boolean
  userEmail: string | null
  activatedAt: string | null
  createdAt: string
}

export function AdminClient() {
  const { message } = App.useApp()
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false)
  const [subscriptionsPagination, setSubscriptionsPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })
  const [subscriptionsSearch, setSubscriptionsSearch] = useState('')
  const [subscriptionsStatusFilter, setSubscriptionsStatusFilter] = useState<string>('all')
  const [activationCodes, setActivationCodes] = useState<ActivationCode[]>([])
  const [codesLoading, setCodesLoading] = useState(false)
  const [createCodeModal, setCreateCodeModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm] = Form.useForm()

  // 确保 token 同步到 cookies（如果 localStorage 中有但 cookies 中没有）
  useEffect(() => {
    if (token && typeof document !== 'undefined') {
      const cookies = document.cookie.split(';')
      const hasToken = cookies.some(cookie => cookie.trim().startsWith('token='))
      if (!hasToken) {
        document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
      }
    }
  }, [token])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [banModal, setBanModal] = useState<{
    visible: boolean
    user: User | null
    action: 'ban' | 'unban'
  }>({
    visible: false,
    user: null,
    action: 'ban'
  })

  useEffect(() => {
    if (!token) {
      return
    }
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, pagination.page, pagination.pageSize, statusFilter])

  useEffect(() => {
    if (!token) {
      return
    }
    // 当状态筛选改变时，重置页码
    setSubscriptionsPagination(prev => ({ ...prev, page: 1 }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionsStatusFilter])

  useEffect(() => {
    if (!token) {
      return
    }
    // 当分页参数改变时，重新加载订阅列表
    fetchSubscriptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, subscriptionsPagination.page, subscriptionsPagination.pageSize])

  const fetchUsers = async () => {
    if (!token) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        status: statusFilter
      })
      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        message.error(data.error || '获取用户列表失败')
        return
      }

      const data = await response.json()
      setUsers(data.data)
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }))
    } catch (error) {
      console.error('Failed to fetch users:', error)
      message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchUsers()
  }

  const fetchSubscriptions = async () => {
    if (!token) return

    setSubscriptionsLoading(true)
    try {
      const params = new URLSearchParams({
        page: subscriptionsPagination.page.toString(),
        pageSize: subscriptionsPagination.pageSize.toString(),
        status: subscriptionsStatusFilter
      })
      if (subscriptionsSearch) {
        params.append('search', subscriptionsSearch)
      }

      const response = await fetch(`/api/admin/subscriptions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        message.error(data.error || '获取订阅列表失败')
        return
      }

      const data = await response.json()
      setSubscriptions(data.data)
      setSubscriptionsPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }))
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
      message.error('获取订阅列表失败')
    } finally {
      setSubscriptionsLoading(false)
    }
  }

  const handleSubscriptionsSearch = () => {
    setSubscriptionsPagination(prev => ({ ...prev, page: 1 }))
    fetchSubscriptions()
  }


  const fetchActivationCodes = async () => {
    if (!token) return

    setCodesLoading(true)
    try {
      const response = await fetch('/api/admin/activation-codes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        message.error(data.error || '获取激活码列表失败')
        return
      }

      const data = await response.json()
      setActivationCodes(data.codes || [])
    } catch (error) {
      console.error('Failed to fetch activation codes:', error)
      message.error('获取激活码列表失败')
    } finally {
      setCodesLoading(false)
    }
  }

  const handleCreateCodes = async () => {
    if (!token) return

    try {
      const values = await createForm.validateFields()
      setCreating(true)

      const response = await fetch('/api/admin/activation-codes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          count: values.count
        })
      })

      if (!response.ok) {
        const data = await response.json()
        message.error(data.error || '创建激活码失败')
        return
      }

      const data = await response.json()
      message.success(`成功创建 ${data.count} 个激活码`)
      setCreateCodeModal(false)
      createForm.resetFields()
      fetchActivationCodes()
    } catch (error) {
      // 表单验证错误（Form.ValidateFields 抛出的错误）
      if (error && typeof error === 'object' && 'errorFields' in error) {
        // 表单验证错误，不显示错误消息
        return
      }
      console.error('Failed to create activation codes:', error)
      message.error('创建激活码失败')
    } finally {
      setCreating(false)
    }
  }

  const handleBan = async (user: User) => {
    setBanModal({
      visible: true,
      user,
      action: user.banned ? 'unban' : 'ban'
    })
  }

  const confirmBan = async () => {
    if (!banModal.user || !token) return

    try {
      const response = await fetch(`/api/admin/users/${banModal.user.id}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          banned: banModal.action === 'ban'
        })
      })

      if (!response.ok) {
        const data = await response.json()
        message.error(data.error || '操作失败')
        return
      }

      message.success(banModal.action === 'ban' ? '账号已禁用' : '账号已启用')
      setBanModal({ visible: false, user: null, action: 'ban' })
      fetchUsers()
    } catch (error) {
      console.error('Failed to ban/unban user:', error)
      message.error('操作失败')
    }
  }

  const columns: ColumnsType<User> = [
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      ellipsis: true
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (name) => name || '-'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 80,
      render: (role) => (
        <Tag color={role === 'admin' ? 'blue' : 'default'}>
          {role === 'admin' ? '管理员' : '用户'}
        </Tag>
      )
    },
    {
      title: '账号状态',
      dataIndex: 'banned',
      key: 'banned',
      width: 100,
      render: (banned: boolean) => {
        if (banned) {
          return <Tag color="red">已禁用</Tag>
        }
        return <Tag color="green">正常</Tag>
      }
    },
    {
      title: '订阅状态',
      dataIndex: 'subscriptionState',
      key: 'subscriptionState',
      width: 120,
      render: (state: string) => {
        if (state === 'valid') {
          return <Tag color="green">有效</Tag>
        }
        if (state === 'expired') {
          return <Tag color="orange">已过期</Tag>
        }
        return <Tag>未激活</Tag>
      }
    },
    {
      title: '订阅到期时间',
      dataIndex: 'subscriptionExpiresAt',
      key: 'subscriptionExpiresAt',
      width: 150,
      render: (date: string | null) => {
        if (!date) return '-'
        return new Date(date).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    },
    {
      title: '简历数量',
      dataIndex: 'resumeCount',
      key: 'resumeCount',
      width: 100,
      align: 'center'
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => {
        return new Date(date).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: unknown, record: User) => {
        // 不能操作管理员
        if (record.role === 'admin') {
          return <span style={{ color: '#999' }}>-</span>
        }

        // 如果已被禁用，可以启用
        if (record.banned) {
          return (
            <Button
              icon={<CheckCircleOutlined />}
              onClick={() => handleBan(record)}
            >
              启用
            </Button>
          )
        }

        // 如果账号正常，可以禁用
        return (
          <Button
            danger
            icon={<StopOutlined />}
            onClick={() => handleBan(record)}
          >
            禁用
          </Button>
        )
      }
    }
  ]

  const subscriptionColumns: ColumnsType<Subscription> = [
    {
      title: '用户邮箱',
      dataIndex: ['user', 'email'],
      key: 'userEmail',
      width: 180,
      ellipsis: true
    },
    {
      title: '用户姓名',
      dataIndex: ['user', 'name'],
      key: 'userName',
      width: 120,
      render: (name: string | null) => name || '-'
    },
    {
      title: '激活码',
      dataIndex: 'activationCode',
      key: 'activationCode',
      width: 250,
      render: (code: string) => <code style={{ fontFamily: 'monospace' }}>{code}</code>
    },
    {
      title: '订阅状态',
      dataIndex: 'subscriptionState',
      key: 'subscriptionState',
      width: 120,
      render: (state: string) => {
        if (state === 'expired') {
          return <Tag color="orange">已过期</Tag>
        }
        return <Tag color="green">有效</Tag>
      }
    },
    {
      title: '开始时间',
      dataIndex: 'startAt',
      key: 'startAt',
      width: 150,
      render: (date: string) => {
        return new Date(date).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    },
    {
      title: '到期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 150,
      render: (date: string) => {
        return new Date(date).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => {
        return new Date(date).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    }
  ]

  const activationCodeColumns: ColumnsType<ActivationCode> = [
    {
      title: '激活码',
      dataIndex: 'code',
      key: 'code',
      width: 300,
      render: (code: string) => <code style={{ fontFamily: 'monospace' }}>{code}</code>
    },
    {
      title: '状态',
      dataIndex: 'used',
      key: 'used',
      width: 100,
      render: (used: boolean) => {
        if (used) {
          return <Tag color="green">已使用</Tag>
        }
        return <Tag color="blue">未使用</Tag>
      }
    },
    {
      title: '使用用户',
      dataIndex: 'userEmail',
      key: 'userEmail',
      width: 180,
      render: (email: string | null) => {
        if (email) {
          return <span>{email}</span>
        }
        return <span style={{ color: '#999' }}>-</span>
      }
    },
    {
      title: '激活时间',
      dataIndex: 'activatedAt',
      key: 'activatedAt',
      width: 150,
      render: (date: string | null) => {
        if (!date) return <span style={{ color: '#999' }}>-</span>
        return new Date(date).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => {
        return new Date(date).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    }
  ]

  return (
    <div className="max-w-7xl mx-auto" style={{ padding: '24px', minHeight: '100vh' }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', width: '100%' }}>
            <Title level={2} style={{ margin: 0 }}>
              管理后台
            </Title>
            <Button
              type="default"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/resume')}
            />
          </div>
        </div>

        <Tabs
          defaultActiveKey="users"
          items={[
            {
              key: 'users',
              label: '用户管理',
              children: (
                <>
                  <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: '16px' }}>
                    <Space>
                      <Input
                        placeholder="搜索邮箱或姓名"
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onPressEnter={handleSearch}
                        style={{ width: 300 }}
                        allowClear
                      />
                      <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 150 }}
                      >
                        <Select.Option value="all">全部状态</Select.Option>
                        <Select.Option value="valid">有效订阅</Select.Option>
                        <Select.Option value="expired">已过期</Select.Option>
                        <Select.Option value="banned">已禁用</Select.Option>
                        <Select.Option value="none">未激活</Select.Option>
                      </Select>
                      <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                        搜索
                      </Button>
                      <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
                        刷新
                      </Button>
                    </Space>
                  </Space>

                  <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      current: pagination.page,
                      pageSize: pagination.pageSize,
                      total: pagination.total,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 条`,
                      onChange: (page, pageSize) => {
                        setPagination(prev => ({ ...prev, page, pageSize }))
                      }
                    }}
                    scroll={{ x: 1200 }}
                  />
                </>
              )
            },
            {
              key: 'subscriptions',
              label: '订阅列表',
              children: (
                <>
                  <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: '16px' }}>
                    <Space>
                      <Input
                        placeholder="搜索用户邮箱或姓名"
                        prefix={<SearchOutlined />}
                        value={subscriptionsSearch}
                        onChange={(e) => setSubscriptionsSearch(e.target.value)}
                        onPressEnter={handleSubscriptionsSearch}
                        style={{ width: 300 }}
                        allowClear
                      />
                      <Select
                        value={subscriptionsStatusFilter}
                        onChange={setSubscriptionsStatusFilter}
                        style={{ width: 150 }}
                      >
                        <Select.Option value="all">全部状态</Select.Option>
                        <Select.Option value="active">有效订阅</Select.Option>
                        <Select.Option value="expired">已过期</Select.Option>
                      </Select>
                      <Button type="primary" icon={<SearchOutlined />} onClick={handleSubscriptionsSearch}>
                        搜索
                      </Button>
                      <Button icon={<ReloadOutlined />} onClick={fetchSubscriptions}>
                        刷新
                      </Button>
                    </Space>
                  </Space>

                  <Table
                    columns={subscriptionColumns}
                    dataSource={subscriptions}
                    rowKey="id"
                    loading={subscriptionsLoading}
                    pagination={{
                      current: subscriptionsPagination.page,
                      pageSize: subscriptionsPagination.pageSize,
                      total: subscriptionsPagination.total,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 条`,
                      onChange: (page, pageSize) => {
                        setSubscriptionsPagination(prev => ({ ...prev, page, pageSize }))
                      }
                    }}
                    scroll={{ x: 1200 }}
                  />
                </>
              )
            },
            {
              key: 'codes',
              label: '激活码列表',
              children: (
                <>
                  <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: '16px' }}>
                    <Space>
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => setCreateCodeModal(true)}
                      >
                        创建激活码
                      </Button>
                      <Button icon={<ReloadOutlined />} onClick={fetchActivationCodes}>
                        刷新
                      </Button>
                    </Space>
                  </Space>

                  <Table
                    columns={activationCodeColumns}
                    dataSource={activationCodes}
                    rowKey="code"
                    loading={codesLoading}
                    pagination={{
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 条`
                    }}
                    scroll={{ x: 1200 }}
                  />
                </>
              )
            }
          ]}
          onChange={(key) => {
            if (key === 'subscriptions') {
              fetchSubscriptions()
            } else if (key === 'codes' && activationCodes.length === 0) {
              fetchActivationCodes()
            }
          }}
        />
      </Card>

      <Modal
        title={banModal.action === 'ban' ? '禁用账号' : '启用账号'}
        open={banModal.visible}
        onOk={confirmBan}
        onCancel={() => setBanModal({ visible: false, user: null, action: 'ban' })}
        okText="确认"
        cancelText="取消"
        okButtonProps={{
          danger: banModal.action === 'ban'
        }}
      >
        <p>
          确定要{banModal.action === 'ban' ? '禁用' : '启用'}用户 <strong>{banModal.user?.email}</strong> 的账号吗？
        </p>
        {banModal.action === 'ban' && (
          <p style={{ color: '#ff4d4f', marginTop: '8px' }}>
            禁用后，该用户将无法使用所有功能，即使订阅未过期。
          </p>
        )}
      </Modal>

      <Modal
        title="创建激活码"
        open={createCodeModal}
        onOk={handleCreateCodes}
        onCancel={() => {
          setCreateCodeModal(false)
          createForm.resetFields()
        }}
        okText="创建"
        cancelText="取消"
        confirmLoading={creating}
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{
            count: 1
          }}
        >
          <Form.Item
            label="数量"
            name="count"
            rules={[
              { required: true, message: '请输入数量' },
              { type: 'number', min: 1, max: 100, message: '数量必须在 1-100 之间' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入要创建的激活码数量"
              min={1}
              max={100}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

