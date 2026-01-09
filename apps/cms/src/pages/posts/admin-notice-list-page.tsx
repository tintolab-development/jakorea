/**
 * 게시글 관리 - 공지사항 관리 페이지 (관리자용)
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
  Switch,
  Upload,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PushpinFilled,
  PushpinOutlined,
  FileOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { mockNotices, type Notice } from '@/data/mock/notices'
import dayjs from 'dayjs'

const { Text } = Typography
const { Search } = Input
const { Option } = Select
const { Dragger } = Upload

export function AdminNoticeListPage() {
  const location = useLocation()
  const [data, setData] = useState<Notice[]>(mockNotices)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [form] = Form.useForm()

  const categoryName = getCategoryNameByPath(location.pathname, 2) || '공지사항 관리'

  // 필터 상태
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.title.toLowerCase().includes(searchText.toLowerCase()) || 
                          item.content.toLowerCase().includes(searchText.toLowerCase())
      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter
      const matchStatus = statusFilter === 'all' || item.status === statusFilter
      return matchSearch && matchCategory && matchStatus
    }).sort((a, b) => {
      if (a.isImportant && !b.isImportant) return -1
      if (!a.isImportant && b.isImportant) return 1
      return dayjs(b.createdAt).diff(dayjs(a.createdAt))
    })
  }, [data, searchText, categoryFilter, statusFilter])

  // 삭제 핸들러
  const handleDelete = (id: string) => {
    setData(prev => prev.filter(item => item.id !== id))
    message.success('공지사항이 삭제되었습니다.')
  }

  // 중요 설정 토글
  const handleToggleImportant = (id: string) => {
    setData(prev => prev.map(item => {
      if (item.id === id) {
        const nextValue = !item.isImportant
        message.success(`중요 공지 설정이 ${nextValue ? '활성화' : '해제'}되었습니다.`)
        return { ...item, isImportant: nextValue }
      }
      return item
    }))
  }

  // 등록/수정 모달 열기
  const showModal = (notice?: Notice) => {
    if (notice) {
      setEditingNotice(notice)
      form.setFieldsValue({
        ...notice,
        createdAt: dayjs(notice.createdAt),
      })
    } else {
      setEditingNotice(null)
      form.resetFields()
      form.setFieldsValue({
        status: 'published',
        isImportant: false,
        category: '안내',
        author: '관리자',
      })
    }
    setIsModalOpen(true)
  }

  // 등록/수정 저장
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const newNotice: Notice = {
        id: editingNotice?.id || `notice-${Date.now()}`,
        ...values,
        createdAt: values.createdAt ? values.createdAt.toISOString() : dayjs().toISOString(),
        viewCount: editingNotice?.viewCount || 0,
        hasAttachment: values.attachments && values.attachments.length > 0,
      }

      if (editingNotice) {
        setData(prev => prev.map(item => item.id === editingNotice.id ? newNotice : item))
        message.success('공지사항이 수정되었습니다.')
      } else {
        setData(prev => [newNotice, ...prev])
        message.success('새 공지사항이 등록되었습니다.')
      }
      setIsModalOpen(false)
    } catch (e) {
      console.error('Validate Failed:', e)
    }
  }

  const columns = [
    {
      title: '고정',
      dataIndex: 'isImportant',
      key: 'isImportant',
      width: 60,
      align: 'center' as const,
      render: (isImportant: boolean, record: Notice) => (
        <Tooltip title={isImportant ? '중요 해제' : '중요 설정'}>
          <Button 
            type="text" 
            icon={isImportant ? <PushpinFilled style={{ color: '#ff4d4f' }} /> : <PushpinOutlined />} 
            onClick={() => handleToggleImportant(record.id)}
          />
        </Tooltip>
      ),
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag color={category === '정산' ? 'orange' : 'blue'}>{category}</Tag>
      ),
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Notice) => (
        <Space>
          {record.status === 'draft' && <Tag>초안</Tag>}
          <Text strong={record.isImportant}>{text}</Text>
          {record.hasAttachment && <FileOutlined style={{ color: '#8c8c8c' }} />}
        </Space>
      ),
    },
    {
      title: '작성자',
      dataIndex: 'author',
      key: 'author',
      width: 100,
    },
    {
      title: '작성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '조회수',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 80,
      align: 'right' as const,
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = {
          published: { color: 'green', label: '게시중' },
          draft: { color: 'default', label: '작성중' },
          archived: { color: 'red', label: '숨김' },
        }[status as 'published' | 'draft' | 'archived'] || { color: 'default', label: status }
        return <Tag color={config.color}>{config.label}</Tag>
      }
    },
    {
      title: '관리',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Notice) => (
        <Space>
          <Tooltip title="수정">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => showModal(record)} 
            />
          </Tooltip>
          <Popconfirm
            title="공지사항 삭제"
            description="정말로 이 공지사항을 삭제하시겠습니까?"
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
            공지사항 등록
          </Button>
        </div>

        <Card size="small">
          <Space wrap>
            <Search
              placeholder="제목, 내용 검색"
              onSearch={setSearchText}
              style={{ width: 250 }}
              allowClear
            />
            <Select 
              defaultValue="all" 
              style={{ width: 120 }} 
              onChange={setCategoryFilter}
            >
              <Option value="all">전체 카테고리</Option>
              <Option value="필독">필독</Option>
              <Option value="안내">안내</Option>
              <Option value="정산">정산</Option>
              <Option value="시스템">시스템</Option>
              <Option value="봉사단">봉사단</Option>
              <Option value="강사단">강사단</Option>
            </Select>
            <Select 
              defaultValue="all" 
              style={{ width: 120 }} 
              onChange={setStatusFilter}
            >
              <Option value="all">전체 상태</Option>
              <Option value="published">게시중</Option>
              <Option value="draft">작성중</Option>
              <Option value="archived">숨김</Option>
            </Select>
            <Button onClick={() => {
              setSearchText('')
              setCategoryFilter('all')
              setStatusFilter('all')
            }}>초기화</Button>
          </Space>
        </Card>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}건`,
          }}
          scroll={{ x: 1000 }}
        />
      </Space>

      {/* 공지사항 등록/수정 모달 */}
      <Modal
        title={editingNotice ? "공지사항 수정" : "공지사항 등록"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        width={800}
        okText={editingNotice ? "수정" : "등록"}
        cancelText="취소"
        centered
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="category"
              label="카테고리"
              rules={[{ required: true, message: '카테고리를 선택하세요' }]}
            >
              <Select>
                <Option value="필독">필독</Option>
                <Option value="안내">안내</Option>
                <Option value="정산">정산</Option>
                <Option value="시스템">시스템</Option>
                <Option value="봉사단">봉사단</Option>
                <Option value="강사단">강사단</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="status"
              label="상태"
              rules={[{ required: true, message: '상태를 선택하세요' }]}
            >
              <Select>
                <Option value="published">게시중</Option>
                <Option value="draft">작성중 (비공개)</Option>
                <Option value="archived">숨김</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="title"
            label="제목"
            rules={[{ required: true, message: '제목을 입력하세요' }]}
          >
            <Input placeholder="공지사항 제목을 입력하세요" />
          </Form.Item>

          <Form.Item
            name="content"
            label="내용"
            rules={[{ required: true, message: '내용을 입력하세요' }]}
          >
            <Input.TextArea rows={10} placeholder="공지사항 상세 내용을 입력하세요" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="isImportant"
              label="중요 공지 설정"
              valuePropName="checked"
            >
              <Switch checkedChildren="ON" unCheckedChildren="OFF" />
            </Form.Item>
            <Form.Item
              name="author"
              label="작성자"
            >
              <Input disabled />
            </Form.Item>
          </div>

          <Form.Item label="첨부파일">
            <Dragger multiple={true}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">파일을 마우스로 끌어오거나 클릭하여 업로드하세요</p>
              <p className="ant-upload-hint">
                한 번에 여러 파일 업로드가 가능합니다.
              </p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
