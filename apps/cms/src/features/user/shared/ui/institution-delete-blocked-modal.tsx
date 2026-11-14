import { ContentModal, CmsButton } from '@/shared/ui'

export interface InstitutionDeleteBlockedModalProps {
  open: boolean
  onClose: () => void
  /** 선택한 기관 수(단일 삭제는 1). 안내 문구는 단건·일괄 공통이라 표시에 쓰지 않는다. */
  selectedCount: number
}

/** 단건·일괄 삭제 공통 1줄 안내 (QA 2026-11-13 회원 #10) */
const INSTITUTION_DELETE_BLOCKED_DESCRIPTION =
  '소속된 교사 또는 참여 이력이 있는 학교는 삭제할 수 없습니다.'

export function InstitutionDeleteBlockedModal({ open, onClose }: InstitutionDeleteBlockedModalProps) {

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="학교 삭제 불가 안내"
      width={600}
      description={INSTITUTION_DELETE_BLOCKED_DESCRIPTION}
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
