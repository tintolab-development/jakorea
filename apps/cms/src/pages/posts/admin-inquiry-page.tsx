/**
 * 게시글 관리 - 문의사항 관리 페이지 (관리자용)
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
  Descriptions,
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { mockInquiries, type Inquiry } from '@/data/mock/inquiries'
import dayjs from 'dayjs'

const { Text, Title, Paragraph } = Typography
const { Search } = Input
const { Option } = Select
const { TextArea } = Input

export function AdminInquiryPage() {
  const location = useLocation()
  const [data, setData] = useState<Inquiry[]>(mockInquiries)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [form] = Form.useForm()

  const categoryName = getCategoryNameByPath(location.pathname, 2) || '문의하기'

  // 필터 상태
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.title.toLowerCase().includes(searchText.toLowerCase()) || 
                          item.content.toLowerCase().includes(searchText.toLowerCase()) ||
                          item.author.toLowerCase().includes(searchText.toLowerCase())
      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter
      const matchStatus = statusFilter === 'all' || item.status === statusFilter
      return matchSearch && matchCategory && matchStatus
    }).sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)))
  }, [data, searchText, categoryFilter, statusFilter])

  // 삭제 핸들러
  const handleDelete = (id: string) => {
    setData(prev => prev.filter(item => item.id !== id))
    message.success('문의가 삭제되었습니다.')
  }

  // 상세 모달 열기
  const showDetailModal = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    setIsDetailModalOpen(true)
  }

  // 답변 모달 열기
  const showAnswerModal = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    form.setFieldsValue({
      answerContent: inquiry.answer?.content || '',
    })
    setIsAnswerModalOpen(true)
  }

  // 답변 저장
  const handleSaveAnswer = async () => {
    try {
      const values = await form.validateFields()
      if (!selectedInquiry) return

      const updatedInquiry: Inquiry = {
        ...selectedInquiry,
        status: 'ANSWERED',
        answer: {
          content: values.answerContent,
          answeredAt: dayjs().toISOString(),
          author: '관리자',
        }
      }

      setData(prev => prev.map(item => item.id === selectedInquiry.id ? updatedInquiry : item))
      message.success('답변이 등록되었습니다.')
      setIsAnswerModalOpen(false)
      if (isDetailModalOpen) {
        setSelectedInquiry(updatedInquiry)
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
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'ANSWERED' ? 'success' : 'warning'} icon={status === 'ANSWERED' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}>
          {status === 'ANSWERED' ? '답변완료' : '답변대기'}
        </Tag>
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
    {
      title: '관리',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Inquiry) => (
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
            description="정말로 이 문의를 삭제하시겠습니까?"
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

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
        </div>

        <Card size="small">
          <Space wrap>
            <Search
              placeholder="제목, 내용, 작성자 검색"
              onSearch={setSearchText}
              style={{ width: 300 }}
              allowClear
            />
            <Select 
              defaultValue="all" 
              style={{ width: 120 }} 
              onChange={setCategoryFilter}
            >
              <Option value="all">전체 카테고리</Option>
              <Option value="활동">활동</Option>
              <Option value="봉사시간">봉사시간</Option>
              <Option value="시스템">시스템</Option>
              <Option value="정산">정산</Option>
              <Option value="안내">안내</Option>
              <Option value="기타">기타</Option>
            </Select>
            <Select 
              defaultValue="all" 
              style={{ width: 120 }} 
              onChange={setStatusFilter}
            >
              <Option value="all">전체 상태</Option>
              <Option value="PENDING">답변대기</Option>
              <Option value="ANSWERED">답변완료</Option>
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
        />
      </Space>

      {/* 문의 상세 모달 */}
      <Modal
        title="문의 상세 내용"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={800}
        footer={[
          <Button key="delete" danger onClick={() => {
            if (selectedInquiry) handleDelete(selectedInquiry.id)
            setIsDetailModalOpen(false)
          }}>삭제</Button>,
          <Button key="answer" type="primary" onClick={() => {
            if (selectedInquiry) showAnswerModal(selectedInquiry)
          }}>{selectedInquiry?.status === 'ANSWERED' ? '답변 수정' : '답변 등록'}</Button>,
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>닫기</Button>,
        ]}
        centered
      >
        {selectedInquiry && (
          <div style={{ marginTop: 16 }}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="작성자">{selectedInquiry.author}</Descriptions.Item>
              <Descriptions.Item label="작성일">{dayjs(selectedInquiry.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="카테고리">{selectedInquiry.category}</Descriptions.Item>
              <Descriptions.Item label="상태">
                <Tag color={selectedInquiry.status === 'ANSWERED' ? 'success' : 'warning'}>
                  {selectedInquiry.status === 'ANSWERED' ? '답변완료' : '답변대기'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="제목" span={2}>{selectedInquiry.title}</Descriptions.Item>
              <Descriptions.Item label="내용" span={2}>
                <div style={{ minHeight: 100, whiteSpace: 'pre-wrap' }}>{selectedInquiry.content}</div>
              </Descriptions.Item>
            </Descriptions>

            {selectedInquiry.answer && (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>답변 내용</Title>
                <div style={{ background: '#f6ffed', padding: '16px', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                  <div style={{ marginBottom: 8, borderBottom: '1px solid #d9f7be', paddingBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>{selectedInquiry.answer.author}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(selectedInquiry.answer.answeredAt).format('YYYY-MM-DD HH:mm')}</Text>
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
        title={selectedInquiry?.status === 'ANSWERED' ? "답변 수정" : "답변 등록"}
        open={isAnswerModalOpen}
        onOk={handleSaveAnswer}
        onCancel={() => setIsAnswerModalOpen(false)}
        width={700}
        okText="저장"
        cancelText="취소"
        centered
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          {selectedInquiry && (
            <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
              <Text strong>[{selectedInquiry.category}] {selectedInquiry.title}</Text>
              <Paragraph ellipsis={{ rows: 2 }} style={{ marginTop: 8, marginBottom: 0 }}>
                {selectedInquiry.content}
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
