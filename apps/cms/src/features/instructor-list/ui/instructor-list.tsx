/**
 * 강사 목록 컴포넌트
 * Phase 4.1: 강사 조회 (FR-F00)
 * Phase 0.5.3: 다운로드 보호 UX - 옵션 모달, 마스킹, 쿼터
 */

import { useState } from 'react'
import { Table, Button, Space, Tag, Tooltip } from 'antd'
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { User } from '@/types/user'
import { canDownloadInstructors } from '@/shared/utils/download-permission'
import { logDownload } from '@/entities/download-log/api/download-log-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { showSuccessMessage, handleError } from '@/shared/utils/error-handler'
import { MESSAGES } from '@/shared/constants'
import { DownloadOptionsModal } from '@/features/download/ui/download-options-modal'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import type { DownloadOptions } from '@/types/download'
// @ts-expect-error - @zurmokeeper/exceljs 타입 선언 문제
import ExcelJS from '@zurmokeeper/exceljs'

export interface InstructorListItem {
  id: string
  instructorId: string
  name: string
  email: string
  phone?: string
  pillar: string
  specialty?: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
}

interface InstructorListProps {
  data: InstructorListItem[]
  loading?: boolean
  onView?: (instructor: InstructorListItem) => void
  currentUser?: Omit<User, 'password'> | null
}

export function InstructorList({
  data,
  loading = false,
  onView,
  currentUser,
}: InstructorListProps) {
  const { user } = useAuthStore()

  const canDownload = canDownloadInstructors(currentUser || user)
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)

  const handleDownload = async (options: DownloadOptions) => {
    const u = currentUser || user
    if (!u) return

    try {
      const { maskingEnabled } = options
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('강사 목록')

      worksheet.columns = [
        { header: '이름', key: 'name', width: 20 },
        { header: '이메일', key: 'email', width: 30 },
        { header: '전화번호', key: 'phone', width: 20 },
        { header: '필라', key: 'pillar', width: 15 },
        { header: '전문분야', key: 'specialty', width: 30 },
        { header: '상태', key: 'status', width: 15 },
        { header: '등록일', key: 'createdAt', width: 20 },
      ]

      data.forEach(item => {
        const name = maskingEnabled ? MASKING_POLICY.name(item.name) : item.name
        const email = maskingEnabled ? MASKING_POLICY.email(item.email) : item.email
        const phone = item.phone
          ? maskingEnabled
            ? MASKING_POLICY.phone(item.phone)
            : item.phone
          : '-'
        worksheet.addRow({
          name,
          email,
          phone,
          pillar: item.pillar,
          specialty: item.specialty || '-',
          status: item.status === 'ACTIVE' ? '활성' : '비활성',
          createdAt: new Date(item.createdAt).toLocaleDateString('ko-KR'),
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `강사_목록_${new Date().toISOString().split('T')[0]}${maskingEnabled ? '_마스킹' : ''}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      await logDownload({
        userId: u.id,
        action: 'DOWNLOAD',
        targetType: 'INSTRUCTORS',
        filters: {},
        rowCount: data.length,
      })

      showSuccessMessage(MESSAGES.success.downloaded)
    } catch (error) {
      handleError(error, { defaultMessage: MESSAGES.error.download })
    }
  }

  const columns: ColumnsType<InstructorListItem> = [
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '전화번호',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (phone?: string) => phone || '-',
    },
    {
      title: '필라',
      dataIndex: 'pillar',
      key: 'pillar',
      width: 120,
      render: (pillar: string) => <Tag color="blue">{pillar}</Tag>,
    },
    {
      title: '전문분야',
      dataIndex: 'specialty',
      key: 'specialty',
      width: 200,
      render: (specialty?: string) => (
        <Tooltip title={specialty || ''}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {specialty || '-'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'default'}>
          {status === 'ACTIVE' ? '활성' : '비활성'}
        </Tag>
      ),
    },
    {
      title: '등록일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '액션',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_: unknown, record: InstructorListItem) => (
        <Space>
          {onView && (
            <Button type="link" icon={<EyeOutlined />} onClick={() => onView(record)} size="small">
              조회
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'flex-end', width: '100%' }}>
        {canDownload && (
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => setDownloadModalOpen(true)}
            disabled={data.length === 0}
          >
            다운로드 ({data.length}건)
          </Button>
        )}
      </Space>

      <DownloadOptionsModal
        open={downloadModalOpen}
        targetType="INSTRUCTORS"
        rowCount={data.length}
        onCancel={() => setDownloadModalOpen(false)}
        onDownload={handleDownload}
        canDownloadOriginalOverride={canDownload}
      />

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1000 }}
        pagination={{
          showSizeChanger: true,
          showTotal: total => `총 ${total}건`,
        }}
      />
    </div>
  )
}
