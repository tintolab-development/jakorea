import { ContentModal, CmsButton } from '@/shared/ui'

export interface InstitutionDeleteBlockedModalProps {
  open: boolean
  onClose: () => void
  /** 선택한 기관 수(단일 삭제는 1) */
  selectedCount: number
}

export function InstitutionDeleteBlockedModal({
  open,
  onClose,
  selectedCount,
}: InstitutionDeleteBlockedModalProps) {
  const description =
    selectedCount <= 1
      ? '해당 학교는 소속된 교사 정보가 있습니다.\n소속되어 있는 교사가 있는 학교는 삭제가 불가합니다.'
      : `선택한 **${selectedCount}**개의 기관 중 소속된 교사 정보가 있는 기관이 있습니다.\n소속되어 있는 교사가 있는 학교는 삭제가 불가합니다.`

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="학교 삭제 불가 안내"
      width={480}
      description={description}
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
