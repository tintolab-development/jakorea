/**
 * 게시글 관리 - FAQ 관리 페이지 (관리자용)
 */

import {
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Typography,
  Popconfirm,
  Tooltip,
  Modal,
  Form,
  InputNumber,
  Descriptions,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { LAYOUT_CONSTANTS, PAGINATION_CONFIG, MESSAGES } from '@/shared/constants'
import { mockFAQs, type FAQ } from '@/data/mock/faqs'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useState, useMemo } from 'react'
import { useListCRUD } from '@/shared/hooks/use-list-crud'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { StatusBadge } from '@/shared/ui/status-badge'

const { Text } = Typography
const { Option } = Select
const { TextArea } = Input

// FAQ 상태 설정
const faqStatusConfig = {
  published: { label: '게시중', color: 'green' },
  draft: { label: '작성중', color: 'default' },
  archived: { label: '숨김', color: 'red' },
}

// 카테고리 옵션
const categoryOptions = [
  { label: '전체 카테고리', value: 'all' },
  { label: '활동', value: '활동' },
  { label: '봉사시간', value: '봉사시간' },
  { label: '시스템', value: '시스템' },
  { label: '정산', value: '정산' },
  { label: '안내', value: '안내' },
]

export function AdminFAQPage() {
  const { user } = useAuthStore()
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  const canWrite = canPerformWriteAction(user)
  const [form] = Form.useForm()

  // CRUD 로직
  const {
    data,
    editing,
    open: modalOpen,
    openCreate,
    openEdit,
    closeModal,
    handleSubmit: handleCRUDSubmit,
    handleDelete,
  } = useListCRUD<FAQ>({
    initialData: mockFAQs,
    onCreate: (values): FAQ => {
      const tagsArray = values.tags
        ? String(values.tags)
            .split(',')
            .map(t => t.trim())
            .filter(t => t !== '')
        : []
      return {
        ...values,
        id: `faq-${Date.now()}`,
        tags: tagsArray,
      } as FAQ
    },
    onUpdate: (id, values): FAQ => {
      const currentEditing = editing
      const tagsArray = values.tags
        ? String(values.tags)
            .split(',')
            .map(t => t.trim())
            .filter(t => t !== '')
        : currentEditing?.tags || []
      return {
        ...currentEditing!,
        ...values,
        id,
        tags: tagsArray,
      } as FAQ
    },
    messages: {
      created: '새 FAQ가 등록되었습니다.',
      updated: 'FAQ가 수정되었습니다.',
      deleted: 'FAQ가 삭제되었습니다.',
    },
  })

  // Pending 필터 상태 (조회 버튼 클릭 전까지 적용하지 않음)
  const [pendingFilters, setPendingFilters] = useState({
    search: '',
    category: 'all',
  })
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    category: 'all',
  })

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = appliedFilters.search
        ? item.question.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
          item.answer.toLowerCase().includes(appliedFilters.search.toLowerCase())
        : true
      const matchCategory =
        appliedFilters.category === 'all' || item.category === appliedFilters.category
      return matchSearch && matchCategory
    })
  }, [data, appliedFilters])

  // 정렬된 데이터
  const sortedData = [...filteredData].sort((a, b) => a.order - b.order)

  // 조회 버튼 클릭 시 필터 적용
  const handleSearch = () => {
    setAppliedFilters(pendingFilters)
  }

  // 상세 모달 상태
  const {
    open: isDetailModalOpen,
    openModal: openDetailModal,
    closeModal: closeDetailModal,
    selectedItem: selectedFAQ,
  } = useModalState<FAQ>()

  // 상세 모달 열기
  const showDetailModal = (faq: FAQ) => {
    openDetailModal(faq)
  }

  // 수정 모달 열기
  const showEditModal = (faq?: FAQ) => {
    if (faq) {
      openEdit(faq)
      form.setFieldsValue({
        ...faq,
        tags: faq.tags?.join(', '),
      })
    } else {
      openCreate()
      form.resetFields()
      form.setFieldsValue({
        status: 'published',
        category: '활동',
        order: data.length + 1,
      })
    }
  }

  // 저장 핸들러
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      await handleCRUDSubmit(values)
      closeModal()
      form.resetFields()
      // 상세 모달이 열려있고 같은 항목이면 업데이트
      if (isDetailModalOpen && selectedFAQ && editing?.id === selectedFAQ.id) {
        const updatedFAQ = data.find(item => item.id === editing.id)
        if (updatedFAQ) {
          openDetailModal(updatedFAQ)
        }
      }
    } catch (error) {
      console.error('Validate Failed:', error)
    }
  }

  const columns = [
    {
      title: '순서',
      dataIndex: 'order',
      key: 'order',
      width: 70,
      align: 'center' as const,
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '질문',
      dataIndex: 'question',
      key: 'question',
      ellipsis: true,
      render: (text: string, record: FAQ) => (
        <Button
          type="link"
          onClick={e => {
            e.stopPropagation()
            showDetailModal(record)
          }}
          style={{ padding: 0, textAlign: 'left' }}
        >
          <Text strong>{text}</Text>
        </Button>
      ),
    },
    {
      title: '태그',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <>
          {tags?.map(tag => (
            <Tag key={tag} style={{ marginBottom: LAYOUT_CONSTANTS.spacing.xs }}>
              {tag}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: LAYOUT_CONSTANTS.widths.status,
      render: (status: string) => (
        <StatusBadge status={status} statusConfig={faqStatusConfig} variant="tag" />
      ),
    },
    // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
    ...(canWrite
      ? [
          {
            title: '관리',
            key: 'action',
            width: 120,
            fixed: 'right' as const,
            render: (_: unknown, record: FAQ) => (
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
                  title="FAQ 삭제"
                  description={MESSAGES.confirm.delete}
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
              FAQ 등록
            </Button>
          )}
        </div>

        <UnifiedFilterCard
          fields={[
            {
              key: 'search',
              type: 'search',
              label: '질문/답변',
              placeholder: '질문, 답변을 입력하세요',
            },
            {
              key: 'category',
              type: 'select',
              label: '카테고리',
              placeholder: '전체 카테고리',
              options: categoryOptions,
            },
          ]}
          filters={pendingFilters}
          onFilterChange={(key, value) => {
            setPendingFilters(prev => ({ ...prev, [key]: value }))
          }}
          onSearch={handleSearch}
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
          onRow={record => ({
            onClick: () => showDetailModal(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Space>

      {/* FAQ 상세 모달 */}
      <Modal
        title="FAQ 상세 내용"
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
                    if (selectedFAQ) {
                      handleDelete(selectedFAQ.id)
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
                    if (selectedFAQ) {
                      closeDetailModal()
                      showEditModal(selectedFAQ)
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
        {selectedFAQ && (
          <div style={{ marginTop: 16 }}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="카테고리">
                <Tag color="blue">{selectedFAQ.category}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="상태">
                <StatusBadge
                  status={selectedFAQ.status}
                  statusConfig={faqStatusConfig}
                  variant="tag"
                />
              </Descriptions.Item>
              <Descriptions.Item label="노출 순서">{selectedFAQ.order}</Descriptions.Item>
              <Descriptions.Item label="질문" span={2}>
                <Text strong>{selectedFAQ.question}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="답변" span={2}>
                <div style={{ minHeight: 100, whiteSpace: 'pre-wrap' }}>{selectedFAQ.answer}</div>
              </Descriptions.Item>
              {selectedFAQ.tags && selectedFAQ.tags.length > 0 && (
                <Descriptions.Item label="태그" span={2}>
                  <Space wrap>
                    {selectedFAQ.tags.map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* FAQ 등록/수정 모달 */}
      <Modal
        title={editing ? 'FAQ 수정' : 'FAQ 등록'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => {
          closeModal()
          form.resetFields()
        }}
        width={LAYOUT_CONSTANTS.widths.modal.medium}
        okText={editing ? '수정' : '등록'}
        cancelText="취소"
        centered
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="category"
              label="카테고리"
              rules={[{ required: true, message: '카테고리를 선택하세요' }]}
            >
              <Select>
                <Option value="활동">활동</Option>
                <Option value="봉사시간">봉사시간</Option>
                <Option value="시스템">시스템</Option>
                <Option value="정산">정산</Option>
                <Option value="안내">안내</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="status"
              label="상태"
              rules={[{ required: true, message: '상태를 선택하세요' }]}
            >
              <Select>
                <Option value="published">게시중</Option>
                <Option value="draft">작성중</Option>
                <Option value="archived">숨김</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="order"
              label="노출 순서"
              rules={[{ required: true, message: '순서를 입력하세요' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            name="question"
            label="질문 (Question)"
            rules={[{ required: true, message: '질문을 입력하세요' }]}
          >
            <Input placeholder="자주 묻는 질문 제목을 입력하세요" />
          </Form.Item>

          <Form.Item
            name="answer"
            label="답변 (Answer)"
            rules={[{ required: true, message: '답변을 입력하세요' }]}
          >
            <TextArea rows={6} placeholder="상세 답변 내용을 입력하세요" />
          </Form.Item>

          <Form.Item name="tags" label="태그 (쉼표로 구분)">
            <Input placeholder="예: 1365, 봉사시간, 확인방법" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
