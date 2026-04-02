/**
 * 모집 신청 현황 위젯
 * 프로그램별 모집 현황 테이블: 프로그램명, 모집 신청 현황, 참여자 모집 현황, 봉사단 모집 현황
 * td: 지원자수/전체수 nn/nn 형식 (건 단위 없음)
 * 모집 신청 현황 컬럼: 프로그램 lifecycleStatus 기반 읽기 전용 텍스트 표시 (프로그램 일정과 연동)
 */

import { Card, Button, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'
import type { Program } from '@/types/domain'
import { getCapacity } from '@/features/program/lib/program-helpers'
import { ProgramLifecycleStatusText } from '@/shared/components/program-lifecycle-status-text'
import { getRecruitmentStatusList } from '../api/admin-dashboard-service'
import { useDashboardSettingsStore } from '../model/dashboard-settings-store'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import { WIDGET_MORE_ALERT_MESSAGE } from '@/shared/constants/widget-styles'
import '@/shared/ui/widget-more-button.css'
import './dashboard-widget-table.css'

const WIDGET_KEY = 'recruitment-status-widget'
const EMPTY_IDS: string[] = []

export function RecruitmentStatusWidget() {
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
      width: '38%',
      align: 'center',
    },
    {
      title: '모집 신청 현황',
      key: 'lifecycleStatus',
      width: '18%',
      align: 'center',
      className: 'dashboard-widget-table__cell--status',
      render: (_: unknown, record: Program) =>
        record.lifecycleStatus ? (
          <ProgramLifecycleStatusText status={record.lifecycleStatus} />
        ) : (
          '-'
        ),
    },
    {
      title: '참여자 모집 현황',
      key: 'studentRecruitment',
      width: '22%',
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
      width: '22%',
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
      className="dashboard-widget-table dashboard-widget-table--recruitment"
      title={
        <WidgetTitleWithHandle>
          <span className="widget-card-title">모집 신청 현황</span>
        </WidgetTitleWithHandle>
      }
      extra={
        <Button
          type="link"
          size="small"
          onClick={() => window.alert(WIDGET_MORE_ALERT_MESSAGE)}
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
        loading={loading}
        className="dashboard-widget-table__data"
      />
    </Card>
  )
}
