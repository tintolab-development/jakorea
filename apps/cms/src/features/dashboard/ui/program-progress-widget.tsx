/**
 * 프로그램 진행 현황 위젯
 * Phase 4.5: 전체 프로그램 진행 현황 (상태별 집계)
 * FR-C01: 7단계 위젯 형태로 재구성 (워크플로우/차트 제거)
 * 화살표: 강사모집↔매칭완료, 교재발송후↔교육진행완료 사이
 */

import { Typography } from 'antd'
import { RightOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import {
  getProgramProgress7Stage,
  type ProgramProgress7Stage,
} from '../api/admin-dashboard-service'
import {
  PROGRAM_PROGRESS_STAGE_LABELS,
  PROGRAM_PROGRESS_STAGE_ORDER,
  STAGE_TO_PROGRAMS_QUERY,
  STAGE_HAS_ARROW_AFTER,
  STAGE_TO_LIFECYCLE,
  type ProgramProgressStageKey,
} from '@/shared/config/program-progress-stages'
import { handleError } from '@/shared/utils/error-handler'
import { MESSAGES } from '@/shared/constants'
import type { ProgramLifecycleStatus } from '@/types/domain'
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
  const location = useLocation()
  const [progress, setProgress] = useState<ProgramProgress7Stage | null>(null)
  const [loading, setLoading] = useState(false)

  // 현재 선택된 상태 확인 (URL 쿼리 파라미터에서)
  const selectedStatus = useMemo<ProgramLifecycleStatus | null>(() => {
    const searchParams = new URLSearchParams(location.search)
    const status = searchParams.get('status') as ProgramLifecycleStatus | null
    return status || null
  }, [location.search])

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

  // 스켈레톤 렌더링
  const renderSkeleton = () => {
    return (
      <div className="program-progress-widget-container">
        <div className="program-progress-widget">
          <div className="program-progress-widget__stages">
            {/* 전체 프로그램 스켈레톤 */}
            <div className="program-progress-widget__stage program-progress-widget__stage--total program-progress-widget__stage--skeleton">
              {/* 텍스트 영역은 빈 상태로 유지 */}
            </div>

            {/* 세로 디바이더 */}
            <div className="program-progress-widget__divider" />

            {/* 6개 단계 스켈레톤 + 화살표 */}
            {PROGRAM_PROGRESS_STAGE_ORDER.filter(
              stageKey => stageKey !== 'educationBeforeTextbook'
            ).map(stageKey => {
              const showArrowAfter = STAGE_HAS_ARROW_AFTER.has(stageKey)
              const elements = [
                <div
                  key={stageKey}
                  className="program-progress-widget__stage program-progress-widget__stage--skeleton"
                >
                  {/* 텍스트 영역은 빈 상태로 유지 */}
                </div>,
              ]
              if (showArrowAfter) {
                elements.push(
                  <RightOutlined
                    key={`${stageKey}-arrow`}
                    className="program-progress-widget__arrow"
                    style={{ opacity: 0.3 }}
                  />
                )
              }
              return elements
            })}
          </div>
        </div>
        <div className="program-progress-widget__bottom-divider" />
      </div>
    )
  }

  if (loading || !progress) {
    return renderSkeleton()
  }

  return (
    <div className="program-progress-widget-container">
      <div className="program-progress-widget">
        {/* 전체 프로그램 위젯 (첫 번째) */}
        <div className="program-progress-widget__stages">
          <div
            className={`program-progress-widget__stage program-progress-widget__stage--total ${!selectedStatus ? 'program-progress-widget__stage--selected' : ''}`}
            onClick={() => {
              const searchParams = new URLSearchParams(location.search)
              searchParams.delete('status')
              navigate(`${location.pathname}?${searchParams.toString()}`, { replace: false })
            }}
          >
            <Text className="program-progress-widget__stage-label">전체 프로그램</Text>
            <div className="program-progress-widget__stage-count-wrapper">
              <Text className="program-progress-widget__stage-count">{progress.total}</Text>
              <Text className="program-progress-widget__stage-count-unit">건</Text>
            </div>
          </div>

          {/* 세로 디바이더 (전체 프로그램 옆) */}
          <div className="program-progress-widget__divider" />

          {/* 7단계 위젯 (수평 배치) + 화살표 */}
          {PROGRAM_PROGRESS_STAGE_ORDER.flatMap((stageKey: ProgramProgressStageKey) => {
            // matchingCompleted와 educationBeforeTextbook을 하나로 합침
            let count = progress[stageKey]
            let label = PROGRAM_PROGRESS_STAGE_LABELS[stageKey]
            let lifecycleStatus = STAGE_TO_LIFECYCLE[stageKey]
            let showArrowAfter = STAGE_HAS_ARROW_AFTER.has(stageKey)

            // matchingCompleted와 educationBeforeTextbook을 하나로 합침
            if (stageKey === 'matchingCompleted') {
              count = progress.matchingCompleted + progress.educationBeforeTextbook
              label = '매칭 완료 / 교재 준비 중'
              // 두 상태 모두 선택 가능하도록 처리
              lifecycleStatus = 'matching_completed' // 기본값
            } else if (stageKey === 'educationBeforeTextbook') {
              // educationBeforeTextbook은 표시하지 않음 (matchingCompleted에 통합)
              return []
            }

            const { value } = STAGE_TO_PROGRAMS_QUERY[stageKey]

            // 현재 선택된 상태인지 확인 (matchingCompleted의 경우 두 상태 모두 확인)
            const isSelected =
              selectedStatus === lifecycleStatus ||
              (stageKey === 'matchingCompleted' &&
                (selectedStatus === 'matching_completed' ||
                  selectedStatus === 'education_before_textbook'))

            // 선택된 상태이거나 기본 하이라이트 상태인 경우
            const isHighlighted =
              isSelected ||
              stageKey === 'matchingCompleted' ||
              stageKey === 'educationAfterTextbook' ||
              stageKey === 'studentRecruitment' ||
              stageKey === 'instructorRecruitment'

            // 현재 경로를 유지하면서 status 쿼리 파라미터만 업데이트
            const handleStageClick = () => {
              const searchParams = new URLSearchParams(location.search)
              if (isSelected) {
                // 이미 선택된 상태를 클릭하면 필터 제거
                searchParams.delete('status')
              } else {
                // matchingCompleted의 경우 두 상태 모두 필터링하도록 처리
                if (stageKey === 'matchingCompleted') {
                  // 두 상태 중 하나라도 선택되어 있으면 제거, 아니면 matching_completed로 설정
                  if (
                    selectedStatus === 'matching_completed' ||
                    selectedStatus === 'education_before_textbook'
                  ) {
                    searchParams.delete('status')
                  } else {
                    searchParams.set('status', 'matching_completed')
                  }
                } else {
                  searchParams.set('status', value)
                }
              }
              navigate(`${location.pathname}?${searchParams.toString()}`, { replace: false })
            }

            const card = (
              <div
                key={stageKey}
                className={`program-progress-widget__stage ${isHighlighted ? 'program-progress-widget__stage--highlighted' : ''} ${isSelected ? 'program-progress-widget__stage--selected' : ''} ${stageKey === 'matchingCompleted' ? 'program-progress-widget__stage--matching' : ''}`}
                onClick={handleStageClick}
              >
                <Text className="program-progress-widget__stage-label">{label}</Text>
                <div className="program-progress-widget__stage-count-wrapper">
                  <Text
                    className={`program-progress-widget__stage-count ${stageKey === 'matchingCompleted' ? 'program-progress-widget__stage-count--teal' : ''}`}
                  >
                    {count}
                  </Text>
                  <Text className="program-progress-widget__stage-count-unit">건</Text>
                </div>
              </div>
            )
            const arrow = showArrowAfter ? (
              <RightOutlined key={`${stageKey}-arrow`} className="program-progress-widget__arrow" />
            ) : null
            return arrow ? [card, arrow] : [card]
          })}
        </div>
      </div>
      {/* 하단 디바이더 */}
      <div className="program-progress-widget__bottom-divider" />
    </div>
  )
}
