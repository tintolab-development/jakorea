/**
 * 프로그램 진행 현황 위젯
 * Phase 4.5: 전체 프로그램 진행 현황 (상태별 집계)
 * FR-C01: 7단계 위젯 형태로 재구성 (워크플로우/차트 제거)
 */

import { Card, Space, Typography } from 'antd'
import { BookOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  getProgramProgress7Stage,
  type ProgramProgress7Stage,
} from '../api/admin-dashboard-service'
import { handleError } from '@/shared/utils/error-handler'
import { MESSAGES } from '@/shared/constants'
import './program-progress-widget.css'

const { Text } = Typography

/** FR-C01: 7단계 라벨 */
const STAGE_LABELS: Record<keyof Omit<ProgramProgress7Stage, 'total'>, string> = {
  studentRecruitment: '수강자 모집',
  instructorRecruitment: '강사 모집',
  matchingCompleted: '매칭 완료',
  educationBeforeTextbook: '교육 진행 중 (교재 발송 전)',
  educationAfterTextbook: '교육 진행 중 (교재 발송 후)',
  educationCompleted: '교육 진행 완료',
  documentProcessingCompleted: '서류 처리 완료',
}

/** FR-C01: 7단계 순서 */
const STAGE_ORDER: Array<keyof Omit<ProgramProgress7Stage, 'total'>> = [
  'studentRecruitment',
  'instructorRecruitment',
  'matchingCompleted',
  'educationBeforeTextbook',
  'educationAfterTextbook',
  'educationCompleted',
  'documentProcessingCompleted',
]

export function ProgramProgressWidget() {
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
      <Card loading={loading} title="전체 프로그램 진행 현황">
        <div className="program-progress-widget__placeholder" />
      </Card>
    )
  }

  return (
    <Card
      title={
        <div className="program-progress-widget__title">
          <BookOutlined />
          <span>전체 프로그램 진행 현황</span>
        </div>
      }
      loading={loading}
      extra={
        <Space>
          <span className="program-progress-widget__extra-text">상세 보기</span>
          <RightOutlined
            onClick={e => {
              e.stopPropagation()
              navigate('/programs')
            }}
            className="program-progress-widget__extra-icon"
          />
        </Space>
      }
    >
      <div className="program-progress-widget">
        {/* 7단계 위젯 (수평 배치) */}
        <div className="program-progress-widget__stages">
          {STAGE_ORDER.map(stageKey => {
            const count = progress[stageKey]
            const label = STAGE_LABELS[stageKey]
            const isHighlighted = stageKey === 'matchingCompleted' || stageKey === 'educationBeforeTextbook' || stageKey === 'educationAfterTextbook'

            return (
              <div
                key={stageKey}
                className={`program-progress-widget__stage ${isHighlighted ? 'program-progress-widget__stage--highlighted' : ''}`}
                onClick={() => {
                  // 클릭 시 해당 단계 필터링된 프로그램 목록으로 이동
                  // TODO: 필터링 로직 구현
                  navigate('/programs')
                }}
              >
                <Text className="program-progress-widget__stage-label">{label}</Text>
                <Text className="program-progress-widget__stage-count">{count}건</Text>
              </div>
            )
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
