/**
 * 모집 신청 현황 위젯
 * 프로그램별 모집 현황 테이블: 프로그램명, 모집 신청 현황, 참여자 모집 현황, 봉사단 모집 현황
 * td: 지원자수/전체수 nn/nn 형식 (건 단위 없음)
 * 모집 신청 현황 컬럼: 프로그램 lifecycleStatus 기반 읽기 전용 텍스트 표시 (프로그램 일정과 연동)
 */

import { Card, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingButton } from '@/shared/ui'
import type { Program } from '@/types/domain'
import { getCapacity } from '@/features/program/general/lib/program-helpers'
import { ProgramLifecycleStatusText } from '@/shared/components/program-lifecycle-status-text'
import { useDashboardSettingsStore } from '../model/dashboard-settings-store'
import { useRecruitmentStatusList } from '../hooks/use-recruitment-status-list'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import { DashboardWidgetQueryError } from './dashboard-widget-query-error'
import '@/shared/ui/widget-more-button.css'
import './dashboard-widget-table.css'

const { Text } = Typography

const WIDGET_KEY = 'recruitment-status-widget'
const EMPTY_IDS: string[] = []

export function RecruitmentStatusWidget() {
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const [halfColumn, setHalfColumn] = useState(false)
  const allowedProgramIds =
    useDashboardSettingsStore(s => s.widgetProgramIds[WIDGET_KEY]) ?? EMPTY_IDS
  const { data: programs = [], isLoading: loading, isError } = useRecruitmentStatusList(allowedProgramIds)
  const equalWidth = halfColumn ? '25%' : undefined
  useLayoutEffect(() => {
    const root = cardRef.current
    if (!root) {
      setHalfColumn(false)
      return
    }
    const slot = root.closest('.dashboard-widget-slot')
    if (!slot) {
      setHalfColumn(false)
      return
    }
    const sync = () => setHalfColumn(slot.getAttribute('data-col-span') === '12')
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(slot, { attributes: true, attributeFilter: ['data-col-span'] })
    return () => mo.disconnect()
  }, [])

  const totalCount = programs.length

  const columns: ColumnsType<Program> = useMemo(
    () => [
      {
        title: '프로그램명',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        width: equalWidth ?? '50%',
        align: 'center',
        render: (value: string) => (
          <span className="dashboard-widget-table__program-name" title={value}>
            {value}
          </span>
        ),
      },
      {
        title: '모집 신청 현황',
        key: 'lifecycleStatus',
        width: equalWidth ?? '17%',
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
        width: equalWidth ?? '17%',
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
        width: equalWidth ?? '16%',
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
    ],
    [equalWidth]
  )

  return (
    <Card
      ref={cardRef}
      className="dashboard-widget-table dashboard-widget-table--recruitment"
      title={
        <WidgetTitleWithHandle>
          <span className="widget-card-title">모집 신청 현황</span>
          <Text type="secondary" className="dashboard-widget-table__header-total-count">
            총 {totalCount}건
          </Text>
        </WidgetTitleWithHandle>
      }
      extra={
        <LoadingButton
          type="link"
          size="small"
          onClick={() => navigate('/programs/general')}
          className="widget-more-button"
        >
          더보기
        </LoadingButton>
      }
    >
      {isError ? (
        <DashboardWidgetQueryError />
      ) : (
        <Table<Program>
          columns={columns}
          dataSource={programs}
          rowKey="id"
          pagination={false}
          loading={loading}
          className="dashboard-widget-table__data"
          onRow={record => ({
            onClick: () => {
              navigate(`/programs/general?programId=${encodeURIComponent(record.id)}`)
            },
          })}
        />
      )}
    </Card>
  )
}
