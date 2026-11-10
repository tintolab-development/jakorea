import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import '@/features/program/shared/ui/detail-modal/components/instructor-approval-complete-modal.css'

const MODAL_WIDTH = 600
export const GENERAL_VOLUNTEER_INTERVIEW2_RESULT_COMPLETE_MODAL_Z = 2550

export type GeneralVolunteerInterview2Result = 'pass' | 'fail'

/** 시안 12-2·16-3(합격) / 11-2·14-2(불합격) — 단건·일괄 공통 */
export function buildGeneralVolunteerInterview2ResultCompleteCopy(
  result: GeneralVolunteerInterview2Result
): { title: string; description: string } {
  if (result === 'fail') {
    return { title: '불합격 처리 완료', description: '면접 결과가 불합격 처리되었습니다.' }
  }
  return { title: '합격 처리 완료', description: '면접 결과가 합격 처리되었습니다.' }
}

export type GeneralVolunteerInterview2ResultCompleteModalProps = {
  open: boolean
  result: GeneralVolunteerInterview2Result
  onClose: () => void
  zIndex?: number
}

/** 일반 봉사자 2차 면접 합격·불합격 완료 팝업 */
export function GeneralVolunteerInterview2ResultCompleteModal({
  open,
  result,
  onClose,
  zIndex = GENERAL_VOLUNTEER_INTERVIEW2_RESULT_COMPLETE_MODAL_Z,
}: GeneralVolunteerInterview2ResultCompleteModalProps) {
  const copy = buildGeneralVolunteerInterview2ResultCompleteCopy(result)
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={copy.title}
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="general-volunteer-interview2-result-complete-modal"
      description={copy.description}
      footer={
        <CmsButton variant="secondary" size="medium" type="button" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      {null}
    </ContentModal>
  )
}
