/**
 * 게시글 관리 - FAQ 관리 페이지 (관리자용)
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
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { mockFAQs, type FAQ } from '@/data/mock/faqs'

const { Text } = Typography
const { Search } = Input
const { Option } = Select
const { TextArea } = Input

export function AdminFAQPage() {
  const location = useLocation()
  const [data, setData] = useState<FAQ[]>(mockFAQs)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [form] = Form.useForm()

  const categoryName = getCategoryNameByPath(location.pathname, 2) || 'FAQ'

  // 필터 상태
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.question.toLowerCase().includes(searchText.toLowerCase()) || 
                          item.answer.toLowerCase().includes(searchText.toLowerCase())
      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter
      return matchSearch && matchCategory
    }).sort((a, b) => a.order - b.order)
  }, [data, searchText, categoryFilter])

  // 삭제 핸들러
  const handleDelete = (id: string) => {
    setData(prev => prev.filter(item => item.id !== id))
    message.success('FAQ가 삭제되었습니다.')
  }

  // 등록/수정 모달 열기
  const showModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq)
      form.setFieldsValue({
        ...faq,
        tags: faq.tags?.join(', '),
      })
    } else {
      setEditingFaq(null)
      form.resetFields()
      form.setFieldsValue({
        status: 'published',
        category: '활동',
        order: data.length + 1,
      })
    }
    setIsModalOpen(true)
  }

  // 등록/수정 저장
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const tagsArray = values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '') : []
      
      const newFaq: FAQ = {
        id: editingFaq?.id || `faq-${Date.now()}`,
        ...values,
        tags: tagsArray,
      }

      if (editingFaq) {
        setData(prev => prev.map(item => item.id === editingFaq.id ? newFaq : item))
        message.success('FAQ가 수정되었습니다.')
      } else {
        setData(prev => [...prev, newFaq])
        message.success('새 FAQ가 등록되었습니다.')
      }
      setIsModalOpen(false)
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
          {tags?.map(tag => (
            <Tag key={tag} style={{ marginBottom: 4 }}>{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 90,
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
      render: (_: any, record: FAQ) => (
        <Space>
          <Tooltip title="수정">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => showModal(record)} 
            />
          </Tooltip>
          <Popconfirm
            title="FAQ 삭제"
            description="정말로 이 FAQ를 삭제하시겠습니까?"
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
            FAQ 등록
          </Button>
        </div>

        <Card size="small">
          <Space wrap>
            <Search
              placeholder="질문, 답변 검색"
              onSearch={setSearchText}
              style={{ width: 250 }}
              allowClear
            />
            <Select 
              defaultValue="all" 
              style={{ width: 150 }} 
              onChange={setCategoryFilter}
            >
              <Option value="all">전체 카테고리</Option>
              <Option value="활동">활동</Option>
              <Option value="봉사시간">봉사시간</Option>
              <Option value="시스템">시스템</Option>
              <Option value="정산">정산</Option>
              <Option value="안내">안내</Option>
            </Select>
            <Button onClick={() => {
              setSearchText('')
              setCategoryFilter('all')
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
        />
      </Space>

      {/* FAQ 등록/수정 모달 */}
      <Modal
        title={editingFaq ? "FAQ 수정" : "FAQ 등록"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        okText={editingFaq ? "수정" : "등록"}
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
