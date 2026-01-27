/**
 * 프로그램 진행 현황 위젯
 * Phase 4.5: 전체 프로그램 진행 현황 (상태별 집계)
 * FR-C01: 7단계 위젯 형태로 재구성 (워크플로우/차트 제거)
 * 화살표: 강사모집↔매칭완료, 교재발송후↔교육진행완료 사이
 */

import { Card, Typography } from 'antd'
import { BookOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  getProgramProgress7Stage,
  type ProgramProgress7Stage,
} from '../api/admin-dashboard-service'
import {
  PROGRAM_PROGRESS_STAGE_LABELS,
  PROGRAM_PROGRESS_STAGE_ORDER,
  STAGE_TO_PROGRAMS_QUERY,
  STAGE_HAS_ARROW_AFTER,
  type ProgramProgressStageKey,
} from '@/shared/config/program-progress-stages'
import { handleError } from '@/shared/utils/error-handler'
import { MESSAGES } from '@/shared/constants'
import './program-progress-widget.css'

const { Text } = Typography

interface ProgramProgressWidgetProps {
  title?: string | null
  showDetailLink?: boolean
}

export function ProgramProgressWidget({
  title = '전체 프로그램 진행 현황',
  showDetailLink = true,
}: ProgramProgressWidgetProps = {}) {
  const navigate = useNavigate()
  const [progress, setProgress] = useState<ProgramProgress7Stage | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const data = await getProgramProgress7Stage()
        setProgress(data)
      } catch (error) {
        handleError(error, { defaultMessage: MESSAGES.error.programProgressLoadFailed })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (!progress) {
    return (
      <Card
        loading={loading}
        title={
          title ? (
            <div className="program-progress-widget__title">
              <BookOutlined />
              <span>{title}</span>
            </div>
          ) : undefined
        }
      >
        <div className="program-progress-widget__placeholder" />
      </Card>
    )
  }

  return (
    <Card
      title={
        title ? (
          <div className="program-progress-widget__title">
            <BookOutlined />
            <span>{title}</span>
          </div>
        ) : undefined
      }
      loading={loading}
      extra={
        showDetailLink ? (
          <button
            type="button"
            className="program-progress-widget__detail-link"
            onClick={() => navigate('/programs')}
          >
            <span className="program-progress-widget__extra-text">상세 보기</span>
            <RightOutlined className="program-progress-widget__extra-icon" />
          </button>
        ) : null
      }
    >
      <div className="program-progress-widget">
        {/* 7단계 위젯 (수평 배치) + 화살표 */}
        <div className="program-progress-widget__stages">
          {PROGRAM_PROGRESS_STAGE_ORDER.flatMap((stageKey: ProgramProgressStageKey) => {
            const count = progress[stageKey]
            const label = PROGRAM_PROGRESS_STAGE_LABELS[stageKey]
            const isHighlighted =
              stageKey === 'matchingCompleted' ||
              stageKey === 'educationBeforeTextbook' ||
              stageKey === 'educationAfterTextbook'
            const { value } = STAGE_TO_PROGRAMS_QUERY[stageKey]
            const href = `/programs?status=${encodeURIComponent(value)}`
            const showArrowAfter = STAGE_HAS_ARROW_AFTER.has(stageKey)

            const card = (
              <div
                key={stageKey}
                className={`program-progress-widget__stage ${isHighlighted ? 'program-progress-widget__stage--highlighted' : ''}`}
                onClick={() => navigate(href)}
              >
                <Text className="program-progress-widget__stage-label">{label}</Text>
                <Text className="program-progress-widget__stage-count">{count}건</Text>
              </div>
            )
            const arrow = showArrowAfter ? (
              <RightOutlined key={`${stageKey}-arrow`} className="program-progress-widget__arrow" />
            ) : null
            return arrow ? [card, arrow] : [card]
          })}
        </div>

        {/* 합계 위젯 */}
        <div className="program-progress-widget__total">
          <Text className="program-progress-widget__total-label">합계</Text>
          <Text className="program-progress-widget__total-count">{progress.total}건</Text>
        </div>
      </div>
    </Card>
  )
}
