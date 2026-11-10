import { useState } from 'react'
import {
  PermissionModal,
  PermissionModalMessage,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  GENERAL_INTERVIEW2_BULK_PASS_TYPE_OPTIONS,
  type GeneralInterview2BulkPassType,
} from '@/features/program/general/lib/volunteer-screening-constants'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

export type GeneralVolunteerInterview2PassTypePayload = PermissionModalPayload & {
  passType: GeneralInterview2BulkPassType
}

export type GeneralVolunteerInterview2PassTypeModalProps = {
  open: boolean
  /** single: 시안 16-1(4968:108531) / bulk: 시안 12-1(9781:52425) */
  mode: 'single' | 'bulk'
  /** 단건은 대상자 이름, 일괄은 첫 번째 선택자 이름 */
  subjectName: string
  /** bulk 전용 — 선택 인원 */
  selectionCount?: number
  onCancel: () => void
  onConfirm: (payload: GeneralVolunteerInterview2PassTypePayload) => void
  zIndex?: number
}

export function buildGeneralVolunteerInterview2PassTypeCopy({
  mode,
  subjectName,
  selectionCount = 1,
}: {
  mode: 'single' | 'bulk'
  subjectName: string
  selectionCount?: number
}): { title: string; message: string } {
  const name = subjectName.trim() || '회원'
  if (mode === 'bulk') {
    const rest = Math.max(0, selectionCount - 1)
    return {
      title: '면접 일괄 합격 안내',
      message: `**[${name}] 님 외 ${rest}명**의 면접 결과를 합격 처리하시겠습니까?\n합격 시 회원에게 합격 알림이 발송됩니다.`,
    }
  }
  return {
    title: '면접 합격 안내',
    message: `**[${name}]** 님의 면접 결과를 합격 처리하시겠습니까?\n합격 시 회원에게 합격 알림이 발송됩니다.`,
  }
}

function BulkPassInfoCallout() {
  return (
    <div className="permission-modal__info-callout">
      <p className="instructor-bulk-approve-modal__callout-text">
        일괄 승인 시 선택된 모든 봉사자의{' '}
        <span className="instructor-bulk-approve-modal__callout-em">
          기관 배정은
          <br />
          승인 후 봉사자 상세에서 개별 배정이 필요
        </span>
        합니다.
      </p>
    </div>
  )
}

/** 일반 프로그램 봉사자 2차 면접 — 합격 유형(합격·예비합격 1~4) 필수 선택 합격 팝업 */
export function GeneralVolunteerInterview2PassTypeModal({
  open,
  mode,
  subjectName,
  selectionCount,
  onCancel,
  onConfirm,
  zIndex,
}: GeneralVolunteerInterview2PassTypeModalProps) {
  const [passType, setPassType] = useState<GeneralInterview2BulkPassType | null>(null)
  const [prevOpen, setPrevOpen] = useState(open)
  // 열릴 때마다 합격 유형 초기화 (렌더 중 상태 조정 — effect setState 회피)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setPassType(null)
  }

  const copy = buildGeneralVolunteerInterview2PassTypeCopy({ mode, subjectName, selectionCount })

  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="instructor-bulk-approve-modal general-volunteer-interview2-pass-type-modal"
      title={copy.title}
      confirmLabel="합격"
      confirmDisabled={passType == null}
      onCancel={onCancel}
      onConfirm={payload => {
        if (passType == null) return
        onConfirm({ ...payload, passType })
      }}
      zIndex={zIndex}
    >
      <PermissionModalMessage text={copy.message} />
      {mode === 'bulk' ? <BulkPassInfoCallout /> : null}
      <div className="permission-modal__field">
        <span className="permission-modal__label">
          합격 유형
          <span className="permission-modal__required" aria-hidden="true">
            *
          </span>
        </span>
        <CmsSelect
          inputSize="large"
          width="100%"
          withAllOption={false}
          placeholder="합격 유형을 선택해 주세요"
          value={passType ?? undefined}
          options={[...GENERAL_INTERVIEW2_BULK_PASS_TYPE_OPTIONS]}
          onChange={value => setPassType(value as GeneralInterview2BulkPassType)}
        />
      </div>
    </PermissionModal>
  )
}
