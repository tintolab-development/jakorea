/**
 * 강사 제출 서류 관리 페이지
 * Phase 0.2.5: 강사 마이페이지 (FR-E01)
 * 제출 서류 관리(이력서, 성범죄조회동의서 등) — 업로드/조회
 */

import { useState, useEffect } from 'react'
import { Card, Upload, Button, Table, Tag, Space, Typography, Alert } from 'antd'
import { UploadOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import dayjs from 'dayjs'

const { Title, Paragraph, Text } = Typography

interface DocumentFile {
  id: string
  type: 'resume' | 'crimeCheckConsent' | 'other'
  fileName: string
  uploadedAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  fileSize?: number
}

// Mock 데이터 (실제로는 API에서 가져옴)
const mockDocuments: DocumentFile[] = [
  {
    id: 'doc-1',
    type: 'resume',
    fileName: '이력서_2024.pdf',
    uploadedAt: '2024-01-15T10:00:00Z',
    status: 'APPROVED',
    fileSize: 102400 },
  {
    id: 'doc-2',
    type: 'crimeCheckConsent',
    fileName: '성범죄조회동의서_2024.pdf',
    uploadedAt: '2024-01-15T10:05:00Z',
    status: 'APPROVED',
    fileSize: 51200 },
]

const documentTypeLabels: Record<DocumentFile['type'], string> = {
  resume: '이력서',
  crimeCheckConsent: '성범죄조회동의서',
  other: '기타' }

const documentStatusLabels: Record<DocumentFile['status'], string> = {
  PENDING: '검토 중',
  APPROVED: '승인됨',
  REJECTED: '반려됨' }

const documentStatusColors: Record<DocumentFile['status'], string> = {
  PENDING: 'processing',
  APPROVED: 'success',
  REJECTED: 'error' }

export function InstructorDocumentsPage() {
  const { user } = useAuthStore()
  const [documents, setDocuments] = useState<DocumentFile[]>(mockDocuments)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 실제로는 API에서 제출 서류 목록을 가져옴
    const loadDocuments = async () => {
      setLoading(true)
      try {
        // TODO: API 호출
        // const data = await getInstructorDocuments(user?.instructorId)
        // setDocuments(data)
      } catch (error) {
        console.error('제출 서류 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user?.instructorId) {
      loadDocuments()
    }
  }, [user?.instructorId])

  const handleUpload = (file: File, type: DocumentFile['type']) => {
    // 실제로는 API로 파일 업로드
    const newDocument: DocumentFile = {
      id: `doc-${Date.now()}`,
      type,
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      status: 'PENDING',
      fileSize: file.size }

    setDocuments(prev => [...prev, newDocument])
    return false // 자동 업로드 방지
  }

  const handleView = (document: DocumentFile) => {
    // TODO: 파일 미리보기 API 연결
    void document
    }

  const handleDownload = (document: DocumentFile) => {
    // TODO: 파일 다운로드 API 연결
    void document
    }

  const columns = [
    {
      title: '서류 종류',
      dataIndex: 'type',
      key: 'type',
      render: (type: DocumentFile['type']) => documentTypeLabels[type] },
    {
      title: '파일명',
      dataIndex: 'fileName',
      key: 'fileName' },
    {
      title: '업로드 일시',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      render: (date: string) => dayjs(date).format('YYYY.MM.DD HH:mm') },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: DocumentFile['status']) => (
        <Tag color={documentStatusColors[status]}>{documentStatusLabels[status]}</Tag>
      ) },
    {
      title: '작업',
      key: 'action',
      render: (_: unknown, record: DocumentFile) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            보기
          </Button>
          <Button type="link" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>
            다운로드
          </Button>
        </Space>
      ) },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div style={PAGE_HEADER_STYLE}>
        <Title level={2} style={{ margin: 0 }}>
          제출 서류 관리
        </Title>
        <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
          이력서, 성범죄조회동의서 등 제출 서류를 업로드하고 관리할 수 있습니다.
        </Paragraph>
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 안내 메시지 */}
        <Alert
          description="이력서와 성범죄조회동의서는 필수 제출 서류입니다. 업로드한 서류는 관리자 검토 후 승인됩니다."
          type="info"
          showIcon
        />

        {/* 파일 업로드 영역 */}
        <Card title="서류 업로드">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>이력서 (필수)</Text>
              <Upload
                beforeUpload={file => handleUpload(file, 'resume')}
                maxCount={1}
                accept=".pdf,.doc,.docx,.hwp"
              >
                <Button icon={<UploadOutlined />}>이력서 업로드</Button>
              </Upload>
            </div>
            <div>
              <Text strong>성범죄조회동의서 (필수)</Text>
              <Upload
                beforeUpload={file => handleUpload(file, 'crimeCheckConsent')}
                maxCount={1}
                accept=".pdf,.doc,.docx,.hwp"
              >
                <Button icon={<UploadOutlined />}>성범죄조회동의서 업로드</Button>
              </Upload>
            </div>
          </Space>
        </Card>

        {/* 제출 서류 목록 */}
        <Card title="제출 서류 목록">
          <Table
            columns={columns}
            dataSource={documents}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
        </Card>
      </Space>
    </div>
  )
}
