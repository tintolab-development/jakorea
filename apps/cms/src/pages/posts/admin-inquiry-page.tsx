/**
 * 게시글 관리 - 문의사항 관리 페이지 (관리자용)
 */

import { useState, useMemo } from 'react'
import {
  Table,
  Tag,
  Space,
  Button,
  Card,
  Typography,
  Popconfirm,
  Tooltip,
  Modal,
  Form,
  Descriptions,
  Input,
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { LAYOUT_CONSTANTS, PAGINATION_CONFIG, MESSAGES } from '@/shared/constants'
import { mockInquiries, type Inquiry } from '@/data/mock/inquiries'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { StatusBadge } from '@/shared/ui/status-badge'
import dayjs from 'dayjs'

const { Text, Title, Paragraph } = Typography
const { TextArea } = Input

// 문의 상태 설정
const inquiryStatusConfig = {
  PENDING: { label: '답변대기', color: 'warning', icon: ClockCircleOutlined },
  ANSWERED: { label: '답변완료', color: 'success', icon: CheckCircleOutlined },
}

// 카테고리 옵션
const categoryOptions = [
  { label: '전체 카테고리', value: 'all' },
  { label: '활동', value: '활동' },
  { label: '봉사시간', value: '봉사시간' },
  { label: '시스템', value: '시스템' },
  { label: '정산', value: '정산' },
  { label: '안내', value: '안내' },
  { label: '기타', value: '기타' },
]

// 상태 옵션
const statusOptions = [
  { label: '전체 상태', value: 'all' },
  { label: '답변대기', value: 'PENDING' },
  { label: '답변완료', value: 'ANSWERED' },
]

export function AdminInquiryPage() {
  const { user } = useAuthStore()
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  const canWrite = canPerformWriteAction(user)

  const [data, setData] = useState<Inquiry[]>(mockInquiries)
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
    return data.filter(item => {
      const matchSearch = appliedFilters.search
        ? item.title.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
          item.content.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
          item.author.toLowerCase().includes(appliedFilters.search.toLowerCase())
        : true
      const matchCategory =
        appliedFilters.category === 'all' || item.category === appliedFilters.category
      const matchStatus = appliedFilters.status === 'all' || item.status === appliedFilters.status
      return matchSearch && matchCategory && matchStatus
    })
  }, [data, appliedFilters])

  // 정렬된 데이터
  const sortedData = [...filteredData].sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)))

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
  }

  // 상세 모달 상태
  const {
    open: isDetailModalOpen,
    openModal: openDetailModal,
    closeModal: closeDetailModal,
    selectedItem: selectedInquiry,
  } = useModalState<Inquiry>()

  // 답변 모달 상태
  const {
    open: isAnswerModalOpen,
    openModal: openAnswerModal,
    closeModal: closeAnswerModal,
    selectedItem: answerInquiry,
    setSelectedItem: setAnswerInquiry,
  } = useModalState<Inquiry>({
    onOpen: inquiry => {
      if (inquiry) {
        form.setFieldsValue({
          answerContent: inquiry.answer?.content || '',
        })
      }
    },
  })

  // 상세 모달 열기
  const showDetailModal = (inquiry: Inquiry) => {
    openDetailModal(inquiry)
  }

  // 답변 모달 열기
  const showAnswerModal = (inquiry: Inquiry) => {
    setAnswerInquiry(inquiry)
    openAnswerModal(inquiry)
  }

  // 답변 저장
  const handleSaveAnswer = async () => {
    try {
      const values = await form.validateFields()
      if (!answerInquiry) return

      const updatedInquiry: Inquiry = {
        ...answerInquiry,
        status: 'ANSWERED',
        answer: {
          content: values.answerContent,
          answeredAt: dayjs().toISOString(),
          author: '관리자',
        },
      }

      setData(prev => prev.map(item => (item.id === answerInquiry.id ? updatedInquiry : item)))
      closeAnswerModal()
      if (isDetailModalOpen && selectedInquiry?.id === answerInquiry.id) {
        openDetailModal(updatedInquiry)
      }
    } catch (error) {
      console.error('Validate Failed:', error)
    }
  }

  const columns = [
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: LAYOUT_CONSTANTS.widths.status,
      render: (status: string) => (
        <StatusBadge status={status} statusConfig={inquiryStatusConfig} variant="tag" showIcon />
      ),
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Inquiry) => (
        <Button type="link" onClick={() => showDetailModal(record)} style={{ padding: 0 }}>
          {text}
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
      width: 150,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
    ...(canWrite
      ? [
          {
            title: '관리',
            key: 'action',
            width: 120,
            fixed: 'right' as const,
            render: (_: unknown, record: Inquiry) => (
              <Space>
                <Tooltip title={record.status === 'ANSWERED' ? '답변 수정' : '답변 등록'}>
                  <Button
                    type="primary"
                    ghost
                    size="small"
                    icon={<MessageOutlined />}
                    onClick={() => showAnswerModal(record)}
                  >
                    {record.status === 'ANSWERED' ? '수정' : '답변'}
                  </Button>
                </Tooltip>
                <Popconfirm
                  title="문의 삭제"
                  description={MESSAGES.confirm.delete}
                  onConfirm={() => handleDelete(record.id)}
                  okText="삭제"
                  cancelText="취소"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="삭제">
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ]

  return (
    <div style={{ padding: LAYOUT_CONSTANTS.margins.xl }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <UnifiedFilterCard
          fields={[
            {
              key: 'search',
              type: 'search',
              label: '제목/내용/작성자',
              placeholder: '제목, 내용, 작성자를 입력하세요',
            },
            {
              key: 'category',
              type: 'select',
              label: '카테고리',
              placeholder: '전체 카테고리',
              options: categoryOptions,
            },
            {
              key: 'status',
              type: 'select',
              label: '상태',
              placeholder: '전체 상태',
              options: statusOptions,
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
          dataSource={sortedData}
          rowKey="id"
          pagination={{
            defaultPageSize: PAGINATION_CONFIG.defaultPageSize,
            pageSizeOptions: [...PAGINATION_CONFIG.pageSizeOptions],
            showSizeChanger: PAGINATION_CONFIG.showSizeChanger,
            showTotal: total => `총 ${total}건`,
          }}
        />
      </Space>

      {/* 문의 상세 모달 */}
      <Modal
        title="문의 상세 내용"
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
                    if (selectedInquiry) {
                      handleDelete(selectedInquiry.id)
                      closeDetailModal()
                    }
                  }}
                >
                  삭제
                </Button>,
                <Button
                  key="answer"
                  type="primary"
                  onClick={() => {
                    if (selectedInquiry) showAnswerModal(selectedInquiry)
                  }}
                >
                  {selectedInquiry?.status === 'ANSWERED' ? '답변 수정' : '답변 등록'}
                </Button>,
              ]
            : []),
          <Button key="close" onClick={closeDetailModal}>
            닫기
          </Button>,
        ]}
        centered
      >
        {selectedInquiry && (
          <div style={{ marginTop: 16 }}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="작성자">{selectedInquiry.author}</Descriptions.Item>
              <Descriptions.Item label="작성일">
                {dayjs(selectedInquiry.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="카테고리">{selectedInquiry.category}</Descriptions.Item>
              <Descriptions.Item label="상태">
                <StatusBadge
                  status={selectedInquiry.status}
                  statusConfig={inquiryStatusConfig}
                  variant="tag"
                  showIcon
                />
              </Descriptions.Item>
              <Descriptions.Item label="제목" span={2}>
                {selectedInquiry.title}
              </Descriptions.Item>
              <Descriptions.Item label="내용" span={2}>
                <div style={{ minHeight: 100, whiteSpace: 'pre-wrap' }}>
                  {selectedInquiry.content}
                </div>
              </Descriptions.Item>
            </Descriptions>

            {selectedInquiry.answer && (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>답변 내용</Title>
                <div
                  style={{
                    background: '#f6ffed',
                    padding: '16px',
                    borderRadius: 8,
                    border: '1px solid #b7eb8f',
                  }}
                >
                  <div
                    style={{
                      marginBottom: 8,
                      borderBottom: '1px solid #d9f7be',
                      paddingBottom: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text strong>{selectedInquiry.answer.author}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(selectedInquiry.answer.answeredAt).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{selectedInquiry.answer.content}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 답변 등록/수정 모달 */}
      <Modal
        title={answerInquiry?.status === 'ANSWERED' ? '답변 수정' : '답변 등록'}
        open={isAnswerModalOpen}
        onOk={handleSaveAnswer}
        onCancel={closeAnswerModal}
        width={LAYOUT_CONSTANTS.widths.modal.medium}
        okText="저장"
        cancelText="취소"
        centered
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {answerInquiry && (
            <Card
              size="small"
              style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg, background: '#f5f5f5' }}
            >
              <Text strong>
                [{answerInquiry.category}] {answerInquiry.title}
              </Text>
              <Paragraph
                ellipsis={{ rows: 2 }}
                style={{ marginTop: LAYOUT_CONSTANTS.spacing.sm, marginBottom: 0 }}
              >
                {answerInquiry.content}
              </Paragraph>
            </Card>
          )}
          <Form.Item
            name="answerContent"
            label="답변 내용"
            rules={[{ required: true, message: '답변 내용을 입력하세요' }]}
          >
            <TextArea rows={10} placeholder="상세 답변 내용을 입력하세요" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
