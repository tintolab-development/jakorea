import { ActionResultModal } from '@/shared/ui/action-result-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { ContentModal } from '@/shared/ui/content-modal'

export function UjatEducationRegionDeleteModal({
  open,
  regionName,
  onConfirm,
  onCancel,
}: {
  open: boolean
  regionName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="교육 지역 삭제"
      width={600}
      description={`[${regionName}] 지역을 UJAT 교육 대상 지역에서 삭제하시겠습니까?\n\n이전에 사용된 이력은 유지되며, 추후 생성된 프로그램부터 해당 지역이 비노출됩니다.\n삭제된 항목은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?`}
      footer={
        <>
          <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="delete"
            size="medium"
            type="button"
            className="cms-button--footer-auto"
            onClick={onConfirm}
          >
            교육 지역 삭제
          </CmsButton>
        </>
      }
    >
      <div />
    </ContentModal>
  )
}

export function UjatEducationRegionDeleteBlockedModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <ActionResultModal
      open={open}
      onClose={onClose}
      title="교육 지역 삭제 불가"
      body={
        <>
          해당 교육 지역을 사용한 이력이 있습니다.
          <br />
          사용 이력이 있는 지역은 삭제가 불가능합니다. 미사용 시 사용 여부를 변경해 주세요.
        </>
      }
    />
  )
}
