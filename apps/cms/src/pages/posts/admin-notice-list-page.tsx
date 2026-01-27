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
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PushpinFilled,
  PushpinOutlined,
  FileOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { MESSAGES } from '@/shared/constants'
import { mockNotices, type Notice } from '@/data/mock/notices'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import dayjs from 'dayjs'

const { Text } = Typography
const { Option } = Select
const { Dragger } = Upload

export function AdminNoticeListPage() {
  const location = useLocation()
  const { user } = useAuthStore()
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  const canWrite = canPerformWriteAction(user)

  const [data, setData] = useState<Notice[]>(mockNotices)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [form] = Form.useForm()

  // Pending 필터 상태 (조회 버튼 클릭 전까지 적용하지 않음)
  const [pendingFilters, setPendingFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
  })
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
  })

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return data
      .filter(item => {
        const matchSearch =
          item.title.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
          item.content.toLowerCase().includes(appliedFilters.search.toLowerCase())
        const matchCategory =
          appliedFilters.category === 'all' || item.category === appliedFilters.category
        const matchStatus = appliedFilters.status === 'all' || item.status === appliedFilters.status
        return matchSearch && matchCategory && matchStatus
      })
      .sort((a, b) => {
        if (a.isImportant && !b.isImportant) return -1
        if (!a.isImportant && b.isImportant) return 1
        return dayjs(b.createdAt).diff(dayjs(a.createdAt))
      })
  }, [data, appliedFilters])

  // 조회 버튼 클릭 시 필터 적용
  const handleSearch = () => {
    setAppliedFilters(pendingFilters)
  }

  // 필터 초기화
  const handleFilterReset = () => {
    setPendingFilters({
      search: '',
      category: 'all',
      status: 'all',
    })
    setAppliedFilters({
      search: '',
      category: 'all',
      status: 'all',
    })
  }

  // 삭제 핸들러
  const handleDelete = (id: string) => {
    setData(prev => prev.filter(item => item.id !== id))
    message.success(MESSAGES.success.noticeDeleted)
  }

  // 중요 설정 토글
  const handleToggleImportant = (id: string) => {
    setData(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextValue = !item.isImportant
          message.success(MESSAGES.success.importantNoticeToggled(nextValue))
          return { ...item, isImportant: nextValue }
        }
        return item
      })
    )
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
        setData(prev => prev.map(item => (item.id === editingNotice.id ? newNotice : item)))
        message.success(MESSAGES.success.noticeUpdated)
      } else {
        setData(prev => [newNotice, ...prev])
        message.success(MESSAGES.success.noticeCreated)
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
            icon={
              isImportant ? <PushpinFilled style={{ color: '#ff4d4f' }} /> : <PushpinOutlined />
            }
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
      },
    },
    // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
    ...(canWrite
      ? [
          {
            title: '관리',
            key: 'action',
            width: 120,
            fixed: 'right' as const,
            render: (_: any, record: Notice) => (
              <Space>
                <Tooltip title="수정">
                  <Button type="text" icon={<EditOutlined />} onClick={() => showModal(record)} />
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
      : []),
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {/* Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가 */}
          {canWrite && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
              공지사항 등록
            </Button>
          )}
        </div>

        <UnifiedFilterCard
          fields={[
            {
              key: 'search',
              type: 'search',
              label: '제목/내용',
              placeholder: '제목, 내용을 입력하세요',
            },
            {
              key: 'category',
              type: 'select',
              label: '카테고리',
              placeholder: '전체 카테고리',
              options: [
                { label: '전체 카테고리', value: 'all' },
                { label: '필독', value: '필독' },
                { label: '안내', value: '안내' },
                { label: '정산', value: '정산' },
                { label: '시스템', value: '시스템' },
                { label: '봉사단', value: '봉사단' },
                { label: '강사단', value: '강사단' },
              ],
            },
            {
              key: 'status',
              type: 'select',
              label: '상태',
              placeholder: '전체 상태',
              options: [
                { label: '전체 상태', value: 'all' },
                { label: '게시중', value: 'published' },
                { label: '작성중', value: 'draft' },
                { label: '숨김', value: 'archived' },
              ],
            },
          ]}
          filters={pendingFilters}
          onFilterChange={(key, value) => {
            setPendingFilters(prev => ({ ...prev, [key]: value }))
          }}
          onSearch={handleSearch}
          onReset={handleFilterReset}
        />

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: total => `총 ${total}건`,
          }}
          scroll={{ x: 1000 }}
        />
      </Space>

      {/* 공지사항 등록/수정 모달 */}
      <Modal
        title={editingNotice ? '공지사항 수정' : '공지사항 등록'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        width={800}
        okText={editingNotice ? '수정' : '등록'}
        cancelText="취소"
        centered
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
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
            <Form.Item name="isImportant" label="중요 공지 설정" valuePropName="checked">
              <Switch checkedChildren="ON" unCheckedChildren="OFF" />
            </Form.Item>
            <Form.Item name="author" label="작성자">
              <Input disabled />
            </Form.Item>
          </div>

          <Form.Item label="첨부파일">
            <Dragger multiple={true}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">파일을 마우스로 끌어오거나 클릭하여 업로드하세요</p>
              <p className="ant-upload-hint">한 번에 여러 파일 업로드가 가능합니다.</p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
