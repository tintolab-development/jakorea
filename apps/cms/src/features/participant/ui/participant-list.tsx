/**
 * 참여자 목록 컴포넌트
 * Phase 4.1: 참여자 조회 (FR-F00)
 * Phase 0.5.3: 다운로드 보호 UX - 옵션 모달, 마스킹, 쿼터
 */

import { useState } from 'react'
import { Table, Button, Space, Tooltip } from 'antd'
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Application } from '@/types/domain'
import type { User } from '@/types/user'
import { useProgramService } from '@/features/program/hooks/use-program-service'
import { applicationStatusStatusConfig } from '@/shared/constants/status'
import { StatusBadge } from '@/shared/ui/status-badge'
import { canDownloadParticipants } from '@/shared/utils/download-permission'
import { logDownload } from '@/entities/download-log/api/download-log-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { showSuccessMessage, handleError } from '@/shared/utils/error-handler'
import { MESSAGES } from '@/shared/constants'
import { PermissionRequestButton } from '@/features/permission-request/ui/permission-request-button'
import { DownloadOptionsModal } from '@/features/download/ui/download-options-modal'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import type { DownloadOptions } from '@/types/download'
import ExcelJS from '@zurmokeeper/exceljs'

interface ParticipantListItem {
  id: string
  name: string
  email: string
  role: 'INDIVIDUAL' | 'SCHOOL'
  programId: string
  programName: string
  status: Application['status']
  appliedAt: string
}

interface ParticipantListProps {
  data: ParticipantListItem[]
  loading?: boolean
  onView?: (participant: ParticipantListItem) => void
  programId?: string
  currentUser?: Omit<User, 'password'> | null
}

export function ParticipantList({
  data,
  loading = false,
  onView,
  programId,
  currentUser,
}: ParticipantListProps) {
  const { user } = useAuthStore()
  const { getByIdSync: getProgramByIdSync } = useProgramService()

  const canDownload = canDownloadParticipants(currentUser || user, programId)
  // Phase 0.5.2: 권한 없는 관리자 → 권한 요청 버튼 노출
  const showPermissionRequest =
    !canDownload && (currentUser || user)?.role === 'ADMIN' && !!programId
  const programName = programId ? (getProgramByIdSync(programId)?.title ?? '프로그램') : ''
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)

  // StatusBadge용 statusConfig 생성
  const participantRoleStatusConfig = {
    INDIVIDUAL: { label: '개인', color: 'blue' },
    SCHOOL: { label: '학교', color: 'green' },
  } as const

  const handleDownload = async (options: DownloadOptions) => {
    const u = currentUser || user
    if (!u) return

    try {
      const { maskingEnabled } = options
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('참여자 목록')

      worksheet.columns = [
        { header: '이름', key: 'name', width: 20 },
        { header: '이메일', key: 'email', width: 30 },
        { header: '역할', key: 'role', width: 15 },
        { header: '프로그램', key: 'programName', width: 30 },
        { header: '상태', key: 'status', width: 15 },
        { header: '신청일', key: 'appliedAt', width: 20 },
      ]

      data.forEach(item => {
        const name = maskingEnabled ? MASKING_POLICY.name(item.name) : item.name
        const email = maskingEnabled ? MASKING_POLICY.email(item.email) : item.email
        worksheet.addRow({
          name,
          email,
          role: item.role === 'INDIVIDUAL' ? '개인' : '학교',
          programName: item.programName,
          status: applicationStatusStatusConfig[item.status]?.label || item.status,
          appliedAt: new Date(item.appliedAt).toLocaleDateString('ko-KR'),
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `참여자_목록_${new Date().toISOString().split('T')[0]}${maskingEnabled ? '_마스킹' : ''}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      await logDownload({
        userId: u.id,
        action: 'DOWNLOAD',
        targetType: 'PARTICIPANTS',
        filters: programId ? { programId } : {},
        rowCount: data.length,
        ...(programId ? { programId } : {}),
      })

      showSuccessMessage(MESSAGES.success.downloaded)
    } catch (error) {
      handleError(error, { defaultMessage: MESSAGES.error.download })
    }
  }

  const columns: ColumnsType<ParticipantListItem> = [
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
      title: '역할',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => (
        <StatusBadge
          status={role as keyof typeof participantRoleStatusConfig}
          statusConfig={participantRoleStatusConfig}
          showIcon={false}
        />
      ),
    },
    {
      title: '프로그램',
      dataIndex: 'programName',
      key: 'programName',
      width: 200,
      render: (programName: string) => (
        <Tooltip title={programName}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {programName}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: Application['status']) => (
        <StatusBadge status={status} statusConfig={applicationStatusStatusConfig} />
      ),
    },
    {
      title: '신청일',
      dataIndex: 'appliedAt',
      key: 'appliedAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '액션',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_: unknown, record: ParticipantListItem) => (
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
        {showPermissionRequest && programId && (
          <PermissionRequestButton
            programId={programId}
            programName={programName}
            action="DOWNLOAD"
          />
        )}
      </Space>

      <DownloadOptionsModal
        open={downloadModalOpen}
        programId={programId}
        programName={programName || undefined}
        targetType="PARTICIPANTS"
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
