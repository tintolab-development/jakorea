import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { formatAssignedInstructorCountLine } from '@/features/program/general/lib/institution-select-assign'
import './institution-select-assign-modals.css'

const MODAL_WIDTH = 600
const MODAL_Z_INDEX = 2500

/**
 * 선택 배정 안내 (모든 프로그램 유형 · 참여 강사/봉사자 상세 공통)
 * - 1건: `{대상} 선택 배정 안내` · "[A]에 [이름] 님을 배정하시겠습니까?"
 * - 2건 이상: `{대상} 일괄 선택 배정 안내` · "[A] 외 N개의 {대상}에 [이름] 님을 배정하시겠습니까?"
 * - 대상: 기관형 = 기관, 개인형 = 일정
 */
export type SelectAssignTargetNoun = '기관' | '일정'

export interface InstitutionSelectAssignConfirmModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  /** 첫 번째 배정 대상명 (기관명 또는 일정) */
  institutionName: string
  /** 배정할 강사·봉사자 이름 */
  instructorName: string
  currentCount: number | null
  requiredCount: number | null
  /** `3/4명`처럼 이미 만들어진 인원 라벨 — 있으면 currentCount/requiredCount 대신 사용 (`-`·빈 값은 미노출) */
  countLabel?: string | null
  /** 첫 대상 외 추가 대상 수 (0이면 단건) */
  extraTargetCount?: number
  targetNoun?: SelectAssignTargetNoun
  confirmLoading?: boolean
}

function resolveCountLine(
  countLabel: string | null | undefined,
  currentCount: number | null,
  requiredCount: number | null
): string | null {
  if (countLabel !== undefined) {
    const trimmed = countLabel?.trim() ?? ''
    if (!trimmed || trimmed === '-') return null
    return `(현재 배정 인원 : ${trimmed})`
  }
  return formatAssignedInstructorCountLine(currentCount, requiredCount)
}

export function InstitutionSelectAssignConfirmModal({
  open,
  onCancel,
  onConfirm,
  institutionName,
  instructorName,
  currentCount,
  requiredCount,
  countLabel,
  extraTargetCount = 0,
  targetNoun = '기관',
  confirmLoading = false,
}: InstitutionSelectAssignConfirmModalProps) {
  const countLine = resolveCountLine(countLabel, currentCount, requiredCount)
  const isBulk = extraTargetCount > 0

  return (
    <ContentModal
      open={open}
      onCancel={confirmLoading ? () => undefined : onCancel}
      title={`${targetNoun} ${isBulk ? '일괄 ' : ''}선택 배정 안내`}
      width={MODAL_WIDTH}
      zIndex={MODAL_Z_INDEX}
      footer={
        <div className="institution-assign-confirm__footer">
          <CmsButton
            variant="secondary"
            size="medium"
            onClick={onCancel}
            disabled={confirmLoading} >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            loading={confirmLoading}
            disabled={confirmLoading}
            onClick={onConfirm} >
            배정
          </CmsButton>
        </div>
      }
    >
      <div className="institution-assign-confirm">
        <div>
          <p className="institution-assign-confirm__message">
            <strong>[{institutionName}]</strong>
            {isBulk ? (
              <>
                {' '}
                <strong>외 {extraTargetCount}개의</strong>
                {` ${targetNoun}에 `}
              </>
            ) : (
              '에 '
            )}
            <strong>[{instructorName}]</strong>
            {' 님을 배정하시겠습니까?'}
          </p>
          {countLine ? (
            <p className="institution-assign-confirm__count">{countLine}</p>
          ) : null}
        </div>
      </div>
    </ContentModal>
  )
}
