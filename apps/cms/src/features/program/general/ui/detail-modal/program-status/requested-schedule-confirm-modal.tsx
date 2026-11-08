import { useState } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import {
  ORGANIZATION_APPROVE_REQUESTED_SCHEDULE_COUNT_EXCEEDED_MESSAGE,
  resolveRequestedScheduleSelectionLimit,
} from '@/features/program/general/lib/organization-application-approve-slots'
import {
  hasConfirmedRequestedSchedule,
  initialRequestedScheduleConfirmSelection,
  type RequestedScheduleConfirmOption,
} from '@/features/program/general/lib/organization-requested-schedule-confirm'
import './requested-schedule-confirm-modal.css'

const MODAL_WIDTH = 600
const MODAL_Z_INDEX = 2500

export interface RequestedScheduleConfirmModalProps {
  open: boolean
  schoolName: string
  options: readonly RequestedScheduleConfirmOption[]
  /** 모집 maxScheduleCount. null·0이면 상한 없음 */
  maxScheduleCount?: number | null
  confirmLoading?: boolean
  onCancel: () => void
  onConfirm: (requestedScheduleIds: number[]) => void
  /** 상한 초과 등 안내 */
  onNotice: (message: string) => void
}

/**
 * 일반 기관 · 기간 지정 — 승인 후 희망 일정 확정(PUT schedule-assignments { requestedScheduleIds }).
 * 저장하면 아직 시작하지 않은 기관 일정 배정이 선택 목록으로 교체된다.
 */
export function RequestedScheduleConfirmModal({
  open,
  schoolName,
  options,
  maxScheduleCount = null,
  confirmLoading = false,
  onCancel,
  onConfirm,
  onNotice,
}: RequestedScheduleConfirmModalProps) {
  // 부모가 열 때마다 key로 다시 마운트한다 — 처음 선택은 현재 확정된 행
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    initialRequestedScheduleConfirmSelection(options)
  )
  const limit = resolveRequestedScheduleSelectionLimit(maxScheduleCount)
  const alreadyConfirmed = hasConfirmedRequestedSchedule(options)

  const toggle = (requestedScheduleId: number, checked: boolean) => {
    setSelectedIds(prev => {
      if (!checked) return prev.filter(id => id !== requestedScheduleId)
      if (prev.includes(requestedScheduleId)) return prev
      if (limit === 1) return [requestedScheduleId]
      if (limit != null && prev.length >= limit) {
        onNotice(ORGANIZATION_APPROVE_REQUESTED_SCHEDULE_COUNT_EXCEEDED_MESSAGE)
        return prev
      }
      return [...prev, requestedScheduleId]
    })
  }

  return (
    <ContentModal
      open={open}
      onCancel={confirmLoading ? () => undefined : onCancel}
      title={alreadyConfirmed ? '희망 일정 변경' : '희망 일정 확정'}
      width={MODAL_WIDTH}
      zIndex={MODAL_Z_INDEX}
      footer={
        <div className="requested-schedule-confirm__footer">
          <CmsButton variant="secondary" size="medium" onClick={onCancel} disabled={confirmLoading}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            loading={confirmLoading}
            disabled={confirmLoading || selectedIds.length === 0}
            onClick={() => onConfirm(selectedIds)}
          >
            확정
          </CmsButton>
        </div>
      }
    >
      <div className="requested-schedule-confirm">
        <p className="requested-schedule-confirm__message">
          <strong>[{schoolName}]</strong>의 희망 일정 중 교육을 진행할 일정을 선택해 주세요.
        </p>
        <p className="requested-schedule-confirm__hint">
          {limit != null
            ? `최대 ${limit}개까지 확정할 수 있습니다.`
            : '확정할 희망 일정을 모두 선택해 주세요.'}
          {alreadyConfirmed
            ? ' 저장하면 아직 시작하지 않은 확정 일정이 선택한 목록으로 교체됩니다.'
            : ''}
        </p>
        <div className="requested-schedule-confirm__list">
          {options.map(option => (
            <CmsCheckbox
              key={option.requestedScheduleId}
              checkboxSize="medium"
              checked={selectedIds.includes(option.requestedScheduleId)}
              disabled={confirmLoading}
              onChange={event => toggle(option.requestedScheduleId, event.target.checked)}
            >
              <span className="requested-schedule-confirm__label">
                {option.label}
                {option.confirmed ? (
                  <span className="requested-schedule-confirm__note">확정됨</span>
                ) : null}
              </span>
            </CmsCheckbox>
          ))}
        </div>
      </div>
    </ContentModal>
  )
}
