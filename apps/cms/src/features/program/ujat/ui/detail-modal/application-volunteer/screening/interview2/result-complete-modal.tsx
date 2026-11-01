import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import '@/features/program/shared/ui/detail-modal/components/instructor-approval-complete-modal.css'

const MODAL_WIDTH = 600
/** 풀페이지 상세 위에 완료 모달이 보이도록 */
export const UJAT_INTERVIEW2_RESULT_COMPLETE_MODAL_Z = 10000

export type UjatInterview2ResultCompleteKind = 'pass' | 'fail'

const COPY: Record<
  UjatInterview2ResultCompleteKind,
  { title: string; description: string }
> = {
  pass: {
    title: '합격 처리 완료',
    description: '면접 결과가 합격 처리되었습니다.',
  },
  fail: {
    title: '불합격 처리 완료',
    description: '면접 결과가 불합격 처리되었습니다.',
  },
}

export type UjatInterview2ResultCompleteModalProps = {
  open: boolean
  kind: UjatInterview2ResultCompleteKind | null
  onClose: () => void
  zIndex?: number
}

export function UjatInterview2ResultCompleteModal({
  open,
  kind,
  onClose,
  zIndex = UJAT_INTERVIEW2_RESULT_COMPLETE_MODAL_Z,
}: UjatInterview2ResultCompleteModalProps) {
  const copy = kind != null ? COPY[kind] : COPY.pass

  return (
    <ContentModal
      open={open && kind != null}
      onCancel={onClose}
      title={copy.title}
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="instructor-approval-complete-modal ujat-volunteer-interview2-result-complete-modal"
      description={copy.description}
      footer={
        <CmsButton variant="secondary" size="h40" type="button" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      {null}
    </ContentModal>
  )
}
