/**
 * 모집 신청 현황 위젯
 * 프로그램별 모집 현황 테이블: 프로그램명, 프로그램 진행 현황, 수강자 모집 현황, 강사 모집 현황
 * 위젯에서는 배지만 표시(읽기 전용). 프로그램 진행 현황 드롭다운은 상세 테이블(프로그램 목록)에서만 노출.
 */

import { Card, Button, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { Program } from '@/types/domain'
import { ProgramLifecycleStatusBadge } from '@/shared/components/program-lifecycle-status-badge'
import { getCapacity } from '@/features/program/lib/program-helpers'
import { getRecruitmentStatusList } from '../api/admin-dashboard-service'
import { useDashboardSettingsStore } from '../model/dashboard-settings-store'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import '@/shared/ui/widget-more-button.css'
import './recruitment-status-widget.css'

const WIDGET_KEY = 'recruitment-status-widget'
const EMPTY_IDS: string[] = []

export function RecruitmentStatusWidget() {
  const navigate = useNavigate()
  const allowedProgramIds =
    useDashboardSettingsStore(s => s.widgetProgramIds[WIDGET_KEY]) ?? EMPTY_IDS
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)

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
      title: '프로그램 진행 현황',
      key: 'lifecycleStatus',
      width: '20%',
      align: 'center',
      render: (_: unknown, record: Program) =>
        record.lifecycleStatus ? (
          <ProgramLifecycleStatusBadge status={record.lifecycleStatus} />
        ) : (
          <span className="recruitment-status-widget__status-empty">-</span>
        ),
    },
    {
      title: '수강자 모집 현황',
      key: 'studentRecruitment',
      width: '15%',
      align: 'center',
      render: (_: unknown, record: Program) => {
        const approved = record.approvedStudentCount ?? 0
        const capacity = getCapacity(record)
        if (capacity !== undefined) return `${approved}/${capacity}건`
        return `${approved}건`
      },
    },
    {
      title: '강사 모집 현황',
      key: 'instructorRecruitment',
      width: '15%',
      align: 'center',
      render: (_: unknown, record: Program) => {
        const current = record.instructors ?? 0
        const cap = record.instructorCapacity
        if (cap !== undefined && cap !== null) return `${current}/${cap}건`
        return `${current}건`
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
