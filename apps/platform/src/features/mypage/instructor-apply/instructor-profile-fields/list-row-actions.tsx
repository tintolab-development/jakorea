import { PFCircleAddButton, PFItemDeleteButton } from '@/shared/ui'

export function ListRowActions({
  isFirst,
  onAdd,
  onRemove,
}: {
  isFirst: boolean
  onAdd: () => void
  onRemove: () => void
}) {
  return isFirst ? (
    <PFCircleAddButton onClick={onAdd} aria-label="항목 추가" />
  ) : (
    <PFItemDeleteButton onClick={onRemove} aria-label="항목 삭제" />
  )
}
