/**
 * 사업 별 KPI 대비 달성률 위젯
 * 프로그램별 KPI(최종 달성 인원, 파견 학교 수, 파견 학급 수) 바 차트 + 달성/KPI/달성률
 */

import { Card, Button, Empty, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  getKpiAchievementList,
  type ProgramKpiItem,
  type KpiMetric,
} from '../api/admin-dashboard-service'
import { useDashboardSettingsStore } from '../model/dashboard-settings-store'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import '@/shared/ui/widget-more-button.css'
import './kpi-achievement-widget.css'

const { Text } = Typography
const WIDGET_KEY = 'kpi-achievement-widget'
const EMPTY_IDS: string[] = []

function getRate(achieved: number, target: number): number {
  if (target <= 0) return 0
  return Math.round((achieved / target) * 100)
}

function isAchieved(achieved: number, target: number): boolean {
  return target > 0 && achieved >= target
}

function KpiBarRow({ kpi }: { kpi: KpiMetric }) {
  const rate = getRate(kpi.achieved, kpi.target)
  const achieved = isAchieved(kpi.achieved, kpi.target)
  // 바 그래프 채움: 달성률(%)만큼만 색상 표시 (예: 80% 달성 시 80%만 채움)
  const barPercent = kpi.target > 0 ? Math.min(100, (kpi.achieved / kpi.target) * 100) : 0

  return (
    <div className="kpi-achievement-widget__kpi-row">
      <div className="kpi-achievement-widget__kpi-label">
        {kpi.label} (단위: {kpi.description})
      </div>
      <div className="kpi-achievement-widget__bar-wrap">
        <div
          className="kpi-achievement-widget__bar-bg"
          role="img"
          aria-label={`${kpi.label} ${rate}%`}
        >
          <div
            className={`kpi-achievement-widget__bar-fill ${achieved ? 'kpi-achievement-widget__bar-fill--achieved' : 'kpi-achievement-widget__bar-fill--under'}`}
            style={{ '--kpi-bar-percent': `${barPercent}%` } as React.CSSProperties}
          />
        </div>
        <div className="kpi-achievement-widget__values">
          <span className="kpi-achievement-widget__achieved-kpi">
            {kpi.achieved}/{kpi.target}
          </span>
          <span
            className={`kpi-achievement-widget__rate-badge ${achieved ? 'kpi-achievement-widget__rate-badge--achieved' : 'kpi-achievement-widget__rate-badge--under'}`}
          >
            {rate}%
          </span>
        </div>
      </div>
    </div>
  )
}

function ProgramKpiCard({ item }: { item: ProgramKpiItem }) {
  return (
    <div className="kpi-achievement-widget__card" key={item.programId}>
      <div className="kpi-achievement-widget__card-title">{item.programTitle}</div>
      <div className="kpi-achievement-widget__kpi-list">
        {item.kpis.map(kpi => (
          <KpiBarRow key={kpi.key} kpi={kpi} />
        ))}
      </div>
    </div>
  )
}

export function KpiAchievementWidget() {
  const navigate = useNavigate()
  const allowedProgramIds =
    useDashboardSettingsStore(s => s.widgetProgramIds[WIDGET_KEY]) ?? EMPTY_IDS
  const [list, setList] = useState<ProgramKpiItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const options =
      allowedProgramIds.length > 0 ? { programIds: allowedProgramIds } : undefined
    getKpiAchievementList(options)
      .then(data => {
        if (!cancelled) setList(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [allowedProgramIds.length, allowedProgramIds.join(',')])

  const totalCount = list.length

  return (
    <Card
      className="kpi-achievement-widget"
      title={
        <WidgetTitleWithHandle>
          <span className="widget-card-title">사업 별 KPI 대비 달성률</span>
          <Text type="secondary" className="kpi-achievement-widget__total-count">
            총 {totalCount}건
          </Text>
        </WidgetTitleWithHandle>
      }
      extra={
        <Button
          type="link"
          size="small"
          onClick={() => navigate('/performance')}
          className="widget-more-button"
        >
          더보기
        </Button>
      }
    >
      {loading ? (
        <div className="kpi-achievement-widget__loading" />
      ) : list.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="표시할 KPI 데이터가 없습니다"
        />
      ) : (
        <div className="kpi-achievement-widget__scroll">
          {list.map(item => (
            <ProgramKpiCard key={item.programId} item={item} />
          ))}
        </div>
      )}
    </Card>
  )
}
