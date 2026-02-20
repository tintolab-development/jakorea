/**
 * 가로형 스텝 진행 바 (원형 42px + 연결 막대 4px)
 * 완료: 청록 원 + 체크, 진행중: 청록 테두리 + 내부 점, 대기: 회색 빈 원
 */

import { Fragment } from 'react'
import { CheckOutlined } from '@ant-design/icons'
import './progress-step-bar.css'

export type StepStatus = 'completed' | 'current' | 'pending'

export interface ProgressStepBarItem {
  key: string
  label: string
  status: StepStatus
}

export interface ProgressStepBarProps {
  stages: ProgressStepBarItem[]
  loading?: boolean
  className?: string
}

export function ProgressStepBar({
  stages,
  loading = false,
  className,
}: ProgressStepBarProps) {
  if (loading) {
    return (
      <div className={[className, 'progress-step-bar'].filter(Boolean).join(' ')}>
        <div className="progress-step-bar__track">
          {Array.from({ length: 6 }).map((_, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <div
                  className="progress-step-bar__bar progress-step-bar__bar--skeleton"
                  aria-hidden
                />
              )}
              <div className="progress-step-bar__cell">
                <div className="progress-step-bar__node progress-step-bar__node--skeleton" />
                <span className="progress-step-bar__label progress-step-bar__label--skeleton">
                  &nbsp;
                </span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    )
  }

  if (stages.length === 0) return null

  return (
    <div className={[className, 'progress-step-bar'].filter(Boolean).join(' ')}>
      <div className="progress-step-bar__track">
        {stages.map((item, index) => {
          /* 막대는 '진행 중' 이전(완료된 단계)까지만 청록, 그 다음 막대는 비활성 */
          const prevStatus = index > 0 ? stages[index - 1].status : null
          const barActive = prevStatus === 'completed'

          return (
            <Fragment key={item.key}>
              {index > 0 && (
                <div
                  className={`progress-step-bar__bar ${barActive ? 'progress-step-bar__bar--active' : 'progress-step-bar__bar--inactive'}`}
                  aria-hidden
                />
              )}
              <div className="progress-step-bar__cell">
                <div
                  className={`progress-step-bar__node progress-step-bar__node--${item.status}`}
                  aria-current={item.status === 'current' ? 'step' : undefined}
                >
                  {item.status === 'completed' && (
                    <CheckOutlined className="progress-step-bar__check" />
                  )}
                  {item.status === 'current' && (
                    <span className="progress-step-bar__dot" aria-hidden />
                  )}
                </div>
                <span
                  className={`progress-step-bar__label progress-step-bar__label--${item.status}`}
                >
                  {item.label}
                </span>
              </div>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
