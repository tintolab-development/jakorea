import { ActionResultModal } from '@/shared/ui/action-result-modal'
import { DeleteGuideModal } from '@/shared/ui/delete-guide-modal'

/** 교육 지역 삭제 안내 본문(시안) — `[지역명]`은 DeleteGuideModal이 굵게 표시 */
function buildUjatEducationRegionDeleteGuideLines(regionName: string): string[] {
  return [
    `[${regionName}] 지역을 교육 대상에서 삭제하시겠습니까?`,
    '삭제 시 신규 프로그램부터는 표시되지 않으며, 기존 프로그램에는 계속 표시됩니다.',
    '삭제된 정보는 되돌릴 수 없습니다.',
  ]
}

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
    <DeleteGuideModal
      open={open}
      onCancel={onCancel}
      onConfirm={() => onConfirm()}
      title="교육 지역 삭제 안내"
      lines={buildUjatEducationRegionDeleteGuideLines(regionName)}
      confirmText="삭제"
    />
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
      title="교육 지역 삭제 불가 안내"
      body={
        <>
          사용 이력이 있는 교육 지역은 삭제할 수 없습니다.
          <br />
          더 이상 사용하지 않으려면 사용 여부를 &apos;미사용&apos;으로 변경해 주세요.
        </>
      }
    />
  )
}
