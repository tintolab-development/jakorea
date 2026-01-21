/**
 * 참여자 목록 컴포넌트
 * Phase 4.1: 참여자 조회 (FR-F00)
 */

import { Table, Button, Space, Tag, Tooltip } from 'antd'
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Application } from '@/types/domain'
import type { User } from '@/types/user'
// import { programService } from '@/entities/program/api/program-service' // 사용하지 않음
import { getApplicationStatusLabel, getApplicationStatusColor } from '@/shared/constants/status'
import { canDownloadParticipants } from '@/shared/utils/download-permission'
import { logDownload } from '@/entities/download-log/api/download-log-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { showSuccessMessage, handleError } from '@/shared/utils/error-handler'
import ExcelJS from 'exceljs'

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

  const canDownload = canDownloadParticipants(currentUser || user, programId)

  const handleDownload = async () => {
    if (!currentUser && !user) return

    try {
      // Excel 파일 생성
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('참여자 목록')

      // 헤더 설정
      worksheet.columns = [
        { header: '이름', key: 'name', width: 20 },
        { header: '이메일', key: 'email', width: 30 },
        { header: '역할', key: 'role', width: 15 },
        { header: '프로그램', key: 'programName', width: 30 },
        { header: '상태', key: 'status', width: 15 },
        { header: '신청일', key: 'appliedAt', width: 20 },
      ]

      // 데이터 추가
      data.forEach(item => {
        worksheet.addRow({
          name: item.name,
          email: item.email,
          role: item.role === 'INDIVIDUAL' ? '개인' : '학교',
          programName: item.programName,
          status: getApplicationStatusLabel(item.status),
          appliedAt: new Date(item.appliedAt).toLocaleDateString('ko-KR'),
        })
      })

      // 파일 다운로드
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `참여자_목록_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // 다운로드 이력 기록
      await logDownload({
        userId: (currentUser || user)!.id,
        action: 'DOWNLOAD',
        targetType: 'PARTICIPANTS',
        filters: { programId, ...(programId ? { programId } : {}) },
        rowCount: data.length,
        ...(programId ? { programId } : {}),
      })

      showSuccessMessage('다운로드가 완료되었습니다.')
    } catch (error) {
      handleError(error, { defaultMessage: '다운로드 중 오류가 발생했습니다.' })
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
        <Tag color={role === 'INDIVIDUAL' ? 'blue' : 'green'}>
          {role === 'INDIVIDUAL' ? '개인' : '학교'}
        </Tag>
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
        <Tag color={getApplicationStatusColor(status)}>
          {getApplicationStatusLabel(status)}
        </Tag>
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
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
              size="small"
            >
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
            onClick={handleDownload}
            disabled={data.length === 0}
          >
            다운로드 ({data.length}건)
          </Button>
        )}
      </Space>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1000 }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `총 ${total}건`,
        }}
      />
    </div>
  )
}
