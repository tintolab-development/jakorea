/**
 * 게시글 관리 - 카테고리 관리 페이지 (관리자용)
 */

import { useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Card,
  Typography,
  message,
  Popconfirm,
  Tooltip,
  Modal,
  Form,
  InputNumber,
  Switch,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarsOutlined,
} from '@ant-design/icons'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { MESSAGES } from '@/shared/constants'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'

const { Text } = Typography
const { Option } = Select

interface PostCategory {
  id: string
  type: 'NOTICE' | 'FAQ' | 'INQUIRY'
  name: string
  slug: string
  order: number
  isActive: boolean
  postCount: number
}

const mockCategories: PostCategory[] = [
  { id: '1', type: 'NOTICE', name: '필독', slug: 'important', order: 1, isActive: true, postCount: 2 },
  { id: '2', type: 'NOTICE', name: '안내', slug: 'notice', order: 2, isActive: true, postCount: 15 },
  { id: '3', type: 'NOTICE', name: '정산', slug: 'settlement', order: 3, isActive: true, postCount: 8 },
  { id: '4', type: 'FAQ', name: '활동', slug: 'activity', order: 1, isActive: true, postCount: 12 },
  { id: '5', type: 'FAQ', name: '봉사시간', slug: 'volunteer-hours', order: 2, isActive: true, postCount: 5 },
  { id: '6', type: 'INQUIRY', name: '시스템', slug: 'system', order: 1, isActive: true, postCount: 20 },
  { id: '7', type: 'INQUIRY', name: '기타', slug: 'etc', order: 2, isActive: true, postCount: 10 },
]

export function AdminCategoryPage() {
  const location = useLocation()
  const [data, setData] = useState<PostCategory[]>(mockCategories)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<PostCategory | null>(null)
  const [form] = Form.useForm()

  const categoryName = getCategoryNameByPath(location.pathname, 2) || '카테고리'

  // 필터 상태
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchType = typeFilter === 'all' || item.type === typeFilter
      return matchType
    }).sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type)
      return a.order - b.order
    })
  }, [data, typeFilter])

  // 삭제 핸들러
  const handleDelete = (id: string) => {
    setData(prev => prev.filter(item => item.id !== id))
    message.success(MESSAGES.success.categoryDeleted)
  }

  // 등록/수정 모달 열기
  const showModal = (category?: PostCategory) => {
    if (category) {
      setEditingCategory(category)
      form.setFieldsValue(category)
    } else {
      setEditingCategory(null)
      form.resetFields()
      form.setFieldsValue({
        type: typeFilter === 'all' ? 'NOTICE' : typeFilter,
        isActive: true,
        order: 1,
      })
    }
    setIsModalOpen(true)
  }

  // 등록/수정 저장
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const newCategory: PostCategory = {
        id: editingCategory?.id || `cat-${Date.now()}`,
        ...values,
        postCount: editingCategory?.postCount || 0,
      }

      if (editingCategory) {
        setData(prev => prev.map(item => item.id === editingCategory.id ? newCategory : item))
        message.success(MESSAGES.success.categoryUpdated)
      } else {
        setData(prev => [...prev, newCategory])
        message.success(MESSAGES.success.categoryCreated)
      }
      setIsModalOpen(false)
    } catch (error) {
      console.error('Validate Failed:', error)
    }
  }

  const columns = [
    {
      title: '구분',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const config = {
          NOTICE: { color: 'blue', label: '공지사항' },
          FAQ: { color: 'green', label: 'FAQ' },
          INQUIRY: { color: 'orange', label: '문의하기' },
        }[type as 'NOTICE' | 'FAQ' | 'INQUIRY']
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
    {
      title: '카테고리명',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '슬러그(Slug)',
      dataIndex: 'slug',
      key: 'slug',
      width: 150,
    },
    {
      title: '순서',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '게시글 수',
      dataIndex: 'postCount',
      key: 'postCount',
      width: 100,
      align: 'right' as const,
      render: (count: number) => <Text type="secondary">{count}건</Text>,
    },
    {
      title: '사용 여부',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      align: 'center' as const,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>{isActive ? '사용' : '미사용'}</Tag>
      ),
    },
    {
      title: '관리',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: PostCategory) => (
        <Space>
          <Tooltip title="수정">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => showModal(record)} 
            />
          </Tooltip>
          <Popconfirm
            title="카테고리 삭제"
            description="이 카테고리를 사용하는 게시글이 있을 경우 삭제가 불가능할 수 있습니다. 정말로 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="삭제"
            cancelText="취소"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="삭제">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => showModal()}
          >
            카테고리 추가
          </Button>
        </div>

        <Card size="small">
          <Space>
            <BarsOutlined /> <Text strong>게시판 구분 필터:</Text>
            <Select 
              defaultValue="all" 
              style={{ width: 150 }} 
              onChange={setTypeFilter}
            >
              <Option value="all">전체 게시판</Option>
              <Option value="NOTICE">공지사항</Option>
              <Option value="FAQ">FAQ</Option>
              <Option value="INQUIRY">문의하기</Option>
            </Select>
          </Space>
        </Card>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={false}
        />
      </Space>

      {/* 카테고리 등록/수정 모달 */}
      <Modal
        title={editingCategory ? "카테고리 수정" : "카테고리 등록"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        width={500}
        okText="저장"
        cancelText="취소"
        centered
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="type"
            label="게시판 구분"
            rules={[{ required: true, message: '게시판 구분을 선택하세요' }]}
          >
            <Select>
              <Option value="NOTICE">공지사항</Option>
              <Option value="FAQ">FAQ</Option>
              <Option value="INQUIRY">문의하기</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="카테고리명"
            rules={[{ required: true, message: '카테고리명을 입력하세요' }]}
          >
            <Input placeholder="예: 활동, 봉사시간, 시스템 등" />
          </Form.Item>

          <Form.Item
            name="slug"
            label="슬러그 (Slug)"
            rules={[{ required: true, message: '슬러그를 입력하세요' }]}
          >
            <Input placeholder="예: activity, volunteer-hours" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="order"
              label="노출 순서"
              rules={[{ required: true, message: '순서를 입력하세요' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="isActive"
              label="사용 여부"
              valuePropName="checked"
            >
              <Switch checkedChildren="사용" unCheckedChildren="미사용" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
