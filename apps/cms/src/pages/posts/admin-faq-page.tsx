/**
 * 게시글 관리 - FAQ 관리 페이지 (관리자용)
 */

import { useLocation } from 'react-router-dom'
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
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { LAYOUT_CONSTANTS, PAGINATION_CONFIG, MESSAGES } from '@/shared/constants'
import { mockFAQs, type FAQ } from '@/data/mock/faqs'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useListCRUD } from '@/shared/hooks/use-list-crud'
import { useListFilters } from '@/shared/hooks/use-list-filters'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { ListPageFilters } from '@/shared/ui/list-page-filters'
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
  const location = useLocation()
  const { user } = useAuthStore()
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  const canWrite = canPerformWriteAction(user)
  const [form] = Form.useForm()

  const categoryName = getCategoryNameByPath(location.pathname, 2) || 'FAQ'

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
            .map((t) => t.trim())
            .filter((t) => t !== '')
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
            .map((t) => t.trim())
            .filter((t) => t !== '')
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

  // 필터 로직
  const {
    searchText,
    setSearchText,
    filters,
    handleFilterChange,
    filtered: filteredData,
    resetFilters,
  } = useListFilters<FAQ>({
    data,
    filterConfig: {
      search: { keys: ['question', 'answer'] },
      selects: {
        category: {
          key: 'category',
          options: categoryOptions.filter((opt) => opt.value !== 'all'),
        },
      },
    },
    defaultFilters: { category: 'all' },
  })

  // 정렬된 데이터
  const sortedData = [...filteredData].sort((a, b) => a.order - b.order)

  // 모달 상태 관리
  const { openModal, closeModal: closeModalState } = useModalState<FAQ>({
    onOpen: (faq) => {
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
    },
    onClose: () => {
      closeModal()
      form.resetFields()
    },
  })

  // 저장 핸들러
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      await handleCRUDSubmit(values)
      closeModalState()
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
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: '질문',
      dataIndex: 'question',
      key: 'question',
      ellipsis: true,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '태그',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <>
          {tags?.map((tag) => (
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
        <StatusBadge
          status={status}
          statusConfig={faqStatusConfig}
          variant="tag"
        />
      ),
    },
    // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
    ...(canWrite ? [{
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
              onClick={() => openModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="FAQ 삭제"
            description={MESSAGES.confirm.delete}
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
    }] : []),
  ]

  return (
    <div style={{ padding: LAYOUT_CONSTANTS.margins.xl }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
          {/* Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가 */}
          {canWrite && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
              FAQ 등록
            </Button>
          )}
        </div>

        <ListPageFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          searchValue={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="질문, 답변 검색"
          filterConfig={[
            {
              key: 'category',
              type: 'select',
              options: categoryOptions,
              placeholder: '카테고리',
            },
          ]}
          onReset={resetFilters}
        />

        <Table
          columns={columns}
          dataSource={sortedData}
          rowKey="id"
          pagination={{
            defaultPageSize: PAGINATION_CONFIG.defaultPageSize,
            pageSizeOptions: [...PAGINATION_CONFIG.pageSizeOptions],
            showSizeChanger: PAGINATION_CONFIG.showSizeChanger,
            showTotal: (total) => `총 ${total}건`,
          }}
        />
      </Space>

      {/* FAQ 등록/수정 모달 */}
      <Modal
        title={editing ? 'FAQ 수정' : 'FAQ 등록'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={closeModalState}
        width={LAYOUT_CONSTANTS.widths.modal.medium}
        okText={editing ? '수정' : '등록'}
        cancelText="취소"
        centered
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
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

          <Form.Item
            name="tags"
            label="태그 (쉼표로 구분)"
          >
            <Input placeholder="예: 1365, 봉사시간, 확인방법" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
