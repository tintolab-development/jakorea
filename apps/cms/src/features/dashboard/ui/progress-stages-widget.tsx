/**
 * 진행 단계 위젯 (범용)
 * 페이지별로 다른 데이터를 props로 받아 동일한 카드 UI로 표시.
 * - firstCardVariant: 'teal' = 첫 카드 청록 배경(목록용), 'white' = 첫 카드 흰색(상세용)
 */

import { CaretRightOutlined } from '@ant-design/icons'
import { DividerVertical } from '@/shared/components/divider-vertical'
import './program-status-widget.css'

export interface ProgressStageItem {
  key: string
  label: string
  count: number
  showArrowAfter?: boolean
  isMatchingStyle?: boolean
  isSelected?: boolean
}

export interface ProgressStagesWidgetProps {
  /** 단계별 카드 데이터 (순서대로 렌더) */
  stages: ProgressStageItem[]
  /** 첫 번째 카드 배경: 'teal' = 청록(전체 프로그램), 'white' = 흰색 */
  firstCardVariant?: 'teal' | 'white'
  /** 첫 카드 다음에 세로 디바이더 표시 (목록 페이지 '전체 프로그램' 옆) */
  showDividerAfterFirstCard?: boolean
  /** 하단 가로 디바이더 표시 */
  showBottomDivider?: boolean
  /** 카드 클릭 (없으면 비활성) */
  onStageClick?: (key: string) => void
  /** 로딩 시 스켈레톤 카드 개수 */
  loading?: boolean
  /** 로딩 시 표시할 카드 수 (기본: stages.length 또는 6) */
  loadingCardCount?: number
  /** 컨테이너 wrapper className */
  className?: string
}

export function ProgressStagesWidget({
  stages,
  firstCardVariant = 'teal',
  showDividerAfterFirstCard = false,
  showBottomDivider = true,
  onStageClick,
  loading = false,
  loadingCardCount,
  className,
}: ProgressStagesWidgetProps) {
  const cardCount = loadingCardCount ?? stages.length

  if (loading) {
    const n = firstCardVariant === 'teal' ? 1 + Math.max(6, cardCount) : Math.max(6, cardCount)
    const skeletons: React.ReactNode[] = []
    if (firstCardVariant === 'teal') {
      skeletons.push(
        <div
          key="skeleton-total"
          className="program-progress-widget__stage program-progress-widget__stage--total program-progress-widget__stage--skeleton"
        />
      )
      skeletons.push(<div key="skeleton-divider" className="program-progress-widget__divider" />)
    }
    for (let i = 0; i < (firstCardVariant === 'teal' ? 6 : n); i++) {
      skeletons.push(
        <div
          key={`skeleton-${i}`}
          className="program-progress-widget__stage program-progress-widget__stage--skeleton"
        />
      )
    }
    return (
      <div className={className}>
        <div className="program-progress-widget-container">
          <div className="program-progress-widget">
            <div className="program-progress-widget__stages">{skeletons}</div>
          </div>
          {showBottomDivider && <div className="program-progress-widget__bottom-divider" />}
        </div>
      </div>
    )
  }

  if (stages.length === 0) {
    return null
  }

  const elements: React.ReactNode[] = []

  stages.forEach((item, index) => {
    const isFirst = index === 0
    const firstIsTeal = isFirst && firstCardVariant === 'teal'
    const cardClass = [
      'program-progress-widget__stage',
      firstIsTeal ? 'program-progress-widget__stage--total' : '',
      item.isMatchingStyle ? 'program-progress-widget__stage--matching' : '',
      item.isSelected ? 'program-progress-widget__stage--selected' : '',
    ]
      .filter(Boolean)
      .join(' ')

    const card = (
      <div
        key={item.key}
        className={`${cardClass} ${onStageClick ? 'program-progress-widget__stage--clickable' : ''}`.trim()}
        onClick={onStageClick ? () => onStageClick(item.key) : undefined}
      >
        <span className="program-progress-widget__stage-label">{item.label}</span>
        <div className="program-progress-widget__stage-count-wrapper">
          <span className={`program-progress-widget__stage-count`}>{item.count}</span>
          <span className="program-progress-widget__stage-count-unit">건</span>
        </div>
      </div>
    )
    elements.push(card)

    if (isFirst && showDividerAfterFirstCard && firstCardVariant === 'teal') {
      elements.push(
        <div key={`divider-${item.key}`} className="program-progress-widget__divider" />
      )
    }
    if (item.showArrowAfter) {
      if (isFirst) {
        elements.push(
          <DividerVertical
            key={`arrow-divider-${item.key}`}
            height={60}
            className="program-progress-widget__divider-vertical--wrapper"
          />
        )
      } else {
        elements.push(
          <CaretRightOutlined
            key={`arrow-${item.key}`}
            className="program-progress-widget__arrow"
          />
        )
      }
    }
  })

  return (
    <div className={className}>
      <div className="program-progress-widget-container">
        <div className="program-progress-widget">
          <div className="program-progress-widget__stages">{elements}</div>
        </div>
        {showBottomDivider && <div className="program-progress-widget__bottom-divider" />}
      </div>
    </div>
  )
}
