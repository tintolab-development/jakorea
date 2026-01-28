/**
 * 게시글 관리 - 공지사항 관리 페이지 (관리자용)
 */

import { useState, useMemo } from 'react'
import {
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Typography,
  message,
  Popconfirm,
  Tooltip,
  Modal,
  Form,
  Switch,
  Upload,
  Descriptions,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
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
import { LAYOUT_CONSTANTS, MESSAGES } from '@/shared/constants'
import { mockNotices, type Notice } from '@/data/mock/notices'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useModalState } from '@/shared/hooks/use-modal-state'
import dayjs from 'dayjs'

const { Text } = Typography
const { Option } = Select
const { Dragger } = Upload

export function AdminNoticeListPage() {
  const { user } = useAuthStore()
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  const canWrite = canPerformWriteAction(user)

  const [data, setData] = useState<Notice[]>(mockNotices)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [form] = Form.useForm()

  // 상세 모달 상태
  const {
    open: isDetailModalOpen,
    openModal: openDetailModal,
    closeModal: closeDetailModal,
    selectedItem: selectedNotice,
  } = useModalState<Notice>()

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

  // 상세 모달 열기
  const showDetailModal = (notice: Notice) => {
    openDetailModal(notice)
  }

  // 등록/수정 모달 열기
  const showEditModal = (notice?: Notice) => {
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
    setIsEditModalOpen(true)
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
        // 상세 모달이 열려있고 같은 항목이면 업데이트
        if (isDetailModalOpen && selectedNotice?.id === editingNotice.id) {
          openDetailModal(newNotice)
        }
      } else {
        setData(prev => [newNotice, ...prev])
        message.success(MESSAGES.success.noticeCreated)
      }
      setIsEditModalOpen(false)
    } catch (e) {
      console.error('Validate Failed:', e)
    }
  }

  const columns: ColumnsType<Notice> = [
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
            onClick={e => {
              e.stopPropagation()
              handleToggleImportant(record.id)
            }}
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
        <Button
          type="link"
          onClick={e => {
            e.stopPropagation()
            showDetailModal(record)
          }}
          style={{ padding: 0, textAlign: 'left' }}
        >
          <Space>
            {record.status === 'draft' && <Tag>초안</Tag>}
            <Text strong={record.isImportant}>{text}</Text>
            {record.hasAttachment && <FileOutlined style={{ color: '#8c8c8c' }} />}
          </Space>
        </Button>
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
            render: (_, record) => (
              <Space>
                <Tooltip title="수정">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={e => {
                      e.stopPropagation()
                      showEditModal(record)
                    }}
                  />
                </Tooltip>
                <Popconfirm
                  title="공지사항 삭제"
                  description="정말로 이 공지사항을 삭제하시겠습니까?"
                  onConfirm={e => {
                    e?.stopPropagation()
                    handleDelete(record.id)
                  }}
                  okText="삭제"
                  cancelText="취소"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="삭제">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={e => e.stopPropagation()}
                    />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ]

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {/* Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가 */}
          {canWrite && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showEditModal()}>
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
          onRow={record => ({
            onClick: () => showDetailModal(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Space>

      {/* 공지사항 상세 모달 */}
      <Modal
        title="공지사항 상세 내용"
        open={isDetailModalOpen}
        onCancel={closeDetailModal}
        width={LAYOUT_CONSTANTS.widths.modal.large}
        footer={[
          // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
          ...(canWrite
            ? [
                <Button
                  key="delete"
                  danger
                  onClick={() => {
                    if (selectedNotice) {
                      handleDelete(selectedNotice.id)
                      closeDetailModal()
                    }
                  }}
                >
                  삭제
                </Button>,
                <Button
                  key="edit"
                  type="primary"
                  onClick={() => {
                    if (selectedNotice) {
                      closeDetailModal()
                      showEditModal(selectedNotice)
                    }
                  }}
                >
                  수정
                </Button>,
              ]
            : []),
          <Button key="close" onClick={closeDetailModal}>
            닫기
          </Button>,
        ]}
        centered
      >
        {selectedNotice && (
          <div style={{ marginTop: 16 }}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="작성자">{selectedNotice.author}</Descriptions.Item>
              <Descriptions.Item label="작성일">
                {dayjs(selectedNotice.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="카테고리">
                <Tag color={selectedNotice.category === '정산' ? 'orange' : 'blue'}>
                  {selectedNotice.category}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="상태">
                {(() => {
                  const config = {
                    published: { color: 'green', label: '게시중' },
                    draft: { color: 'default', label: '작성중' },
                    archived: { color: 'red', label: '숨김' },
                  }[selectedNotice.status] || { color: 'default', label: selectedNotice.status }
                  return <Tag color={config.color}>{config.label}</Tag>
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="중요 공지">
                {selectedNotice.isImportant ? (
                  <Tag color="red">필독</Tag>
                ) : (
                  <Text type="secondary">일반</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="조회수">
                {selectedNotice.viewCount.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="제목" span={2}>
                {selectedNotice.title}
              </Descriptions.Item>
              <Descriptions.Item label="내용" span={2}>
                <div style={{ minHeight: 100, whiteSpace: 'pre-wrap' }}>
                  {selectedNotice.content}
                </div>
              </Descriptions.Item>
              {selectedNotice.hasAttachment && (
                <Descriptions.Item label="첨부파일" span={2}>
                  <FileOutlined style={{ marginRight: 8 }} />
                  <Text type="secondary">첨부파일이 있습니다</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* 공지사항 등록/수정 모달 */}
      <Modal
        title={editingNotice ? '공지사항 수정' : '공지사항 등록'}
        open={isEditModalOpen}
        onOk={handleSave}
        onCancel={() => setIsEditModalOpen(false)}
        width={LAYOUT_CONSTANTS.widths.modal.large}
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
