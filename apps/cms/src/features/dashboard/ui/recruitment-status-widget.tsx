/**
 * 모집 신청 현황 위젯
 * 프로그램별 모집 현황 테이블: 프로그램명, 모집 신청 현황, 참여자 모집 현황, 봉사단 모집 현황
 * td: 지원자수/전체수 nn/nn 형식 (건 단위 없음)
 * 모집 신청 현황 셀: 태그 클릭 시 드롭다운으로 모든 상태 표시 및 변경 가능, 데이터 동기화
 */

import { Card, Button, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import type { Program } from '@/types/domain'
import type { ProgramLifecycleStatus } from '@/types/domain'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import { getCapacity } from '@/features/program/lib/program-helpers'
import { ProgramLifecycleStatusCell } from '@/shared/components/program-lifecycle-status-cell'
import { getRecruitmentStatusList } from '../api/admin-dashboard-service'
import { useDashboardSettingsStore } from '../model/dashboard-settings-store'
import { useProgramStore } from '@/features/program/model/program-store'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import '@/shared/ui/widget-more-button.css'
import './recruitment-status-widget.css'

const WIDGET_KEY = 'recruitment-status-widget'
const EMPTY_IDS: string[] = []

export function RecruitmentStatusWidget() {
  const navigate = useNavigate()
  const updateProgram = useProgramStore(s => s.updateProgram)
  const allowedProgramIds =
    useDashboardSettingsStore(s => s.widgetProgramIds[WIDGET_KEY]) ?? EMPTY_IDS
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getRecruitmentStatusList(
      allowedProgramIds.length > 0 ? { programIds: allowedProgramIds } : undefined
    )
      .then(data => {
        if (!cancelled) setPrograms(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [allowedProgramIds.length, allowedProgramIds.join(',')])

  const handleStatusChange = useCallback(
    async (record: Program, newStatus: ProgramLifecycleStatus) => {
      if (record.lifecycleStatus === newStatus) return
      setUpdatingId(record.id)
      try {
        await updateProgram(record.id, { lifecycleStatus: newStatus })
        setPrograms(prev =>
          prev.map(p => (p.id === record.id ? { ...p, lifecycleStatus: newStatus } : p))
        )
        showSuccessMessage(
          `"${record.title}" 상태가 "${getProgramLifecycleLabel(newStatus)}"로 변경되었습니다`
        )
      } catch (error) {
        handleError(error, {
          defaultMessage: '상태 변경 중 오류가 발생했습니다',
          context: 'RecruitmentStatusWidget',
        })
      } finally {
        setUpdatingId(null)
      }
    },
    [updateProgram]
  )

  const columns: ColumnsType<Program> = [
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: '50%',
      align: 'center',
    },
    {
      title: '모집 신청 현황',
      key: 'lifecycleStatus',
      width: '20%',
      align: 'center',
      className: 'recruitment-status-widget__cell-status status-dropdown-cell__cell-status',
      render: (_: unknown, record: Program) => (
        <ProgramLifecycleStatusCell
          record={record}
          onStatusChange={handleStatusChange}
          isUpdating={updatingId === record.id}
          openDropdownId={openStatusDropdownId}
          onOpenDropdownChange={setOpenStatusDropdownId}
        />
      ),
    },
    {
      title: '참여자 모집 현황',
      key: 'studentRecruitment',
      width: '15%',
      align: 'center',
      render: (_: unknown, record: Program) => {
        const supportCount = record.approvedStudentCount ?? 0
        const total = getCapacity(record)
        if (total === undefined || total === null) {
          return supportCount > 0 ? `${supportCount} / -` : '-'
        }
        return `${supportCount} / ${total}`
      },
    },
    {
      title: '봉사단 모집 현황',
      key: 'instructorRecruitment',
      width: '15%',
      align: 'center',
      render: (_: unknown, record: Program) => {
        const supportCount = record.instructors ?? 0
        const total = record.instructorCapacity
        if (total === undefined || total === null) {
          return supportCount > 0 ? `${supportCount} / -` : '-'
        }
        return `${supportCount} / ${total}`
      },
    },
  ]

  return (
    <Card
      className="recruitment-status-widget"
      title={
        <WidgetTitleWithHandle>
          <span className="widget-card-title">모집 신청 현황</span>
        </WidgetTitleWithHandle>
      }
      extra={
        <Button
          type="link"
          size="small"
          onClick={() => navigate('/applications')}
          className="widget-more-button"
        >
          더보기
        </Button>
      }
    >
      <Table<Program>
        columns={columns}
        dataSource={programs}
        rowKey="id"
        pagination={false}
        size="small"
        loading={loading}
        className="recruitment-status-widget__table"
      />
    </Card>
  )
}
