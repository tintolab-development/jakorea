import type { MouseEvent } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import { ButtonAddIcon, ButtonCopyIcon, ButtonDeleteIcon } from '@/shared/ui/icons/ButtonIcons'

export type FormParagraphCardActionHandlers = {
  onAdd?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onAddItem?: () => void
}

export type FormParagraphCardActionsProps = FormParagraphCardActionHandlers & {
  disabled?: boolean
  /** true면 「단락 추가」만 비활성 (`disabled`와 함께 적용) */
  addDisabled?: boolean
  /** true면 「+ 항목 추가」만 비활성 (`disabled`와 함께 적용) — 단락 추가와 분리 */
  addItemDisabled?: boolean
  /** true면 「단락 복제」만 비활성 (`disabled`와 함께 적용) — 기본 템플릿 고정 단락 등 */
  duplicateDisabled?: boolean
  /** true면 「단락 삭제」만 비활성 (`disabled`와 함께 적용) */
  deleteDisabled?: boolean
}

function stopCardClick(e: MouseEvent<HTMLElement>) {
  e.stopPropagation()
}

export function FormParagraphCardActions({
  onAdd,
  onDuplicate,
  onDelete,
  onAddItem,
  disabled = false,
  addDisabled = false,
  addItemDisabled = false,
  duplicateDisabled = false,
  deleteDisabled = false,
}: FormParagraphCardActionsProps = {}) {
  const addOff = disabled || addDisabled
  const addItemOff = disabled || addItemDisabled
  const dupOff = disabled || duplicateDisabled
  const delOff = disabled || deleteDisabled
  return (
    <>
      {onAddItem ? (
        <CmsButton
          variant="primary"
          type="button"
          size="large"
          disabled={addItemOff}
          onClick={e => {
            stopCardClick(e)
            onAddItem()
          }} >
          + 항목 추가
        </CmsButton>
      ) : null}
      <CmsButton
        variant="secondary"
        type="button"
        size="large"
        icon={<ButtonAddIcon />}
        disabled={addOff}
        onClick={e => {
          stopCardClick(e)
          onAdd?.()
        }} >
        단락 추가
      </CmsButton>
      <CmsButton
        variant="secondary"
        type="button"
        size="large"
        icon={<ButtonCopyIcon />}
        disabled={dupOff}
        onClick={e => {
          stopCardClick(e)
          onDuplicate?.()
        }} >
        단락 복제
      </CmsButton>
      <CmsButton
        variant="secondary"
        type="button"
        size="large"
        icon={<ButtonDeleteIcon />}
        disabled={delOff}
        onClick={e => {
          stopCardClick(e)
          onDelete?.()
        }} >
        단락 삭제
      </CmsButton>
    </>
  )
}

export function FormParagraphCardActionsMinimal({
  onAdd,
  onDuplicate,
  onDelete,
  disabled = false,
  addDisabled = false,
  duplicateDisabled = false,
  deleteDisabled = false,
}: FormParagraphCardActionsProps = {}) {
  const addOff = disabled || addDisabled
  const dupOff = disabled || duplicateDisabled
  const delOff = disabled || deleteDisabled
  return (
    <>
      <CmsButton
        variant="secondary"
        type="button"
        size="large"
        icon={<ButtonAddIcon />}
        disabled={addOff}
        onClick={e => {
          stopCardClick(e)
          onAdd?.()
        }} >
        단락 추가
      </CmsButton>
      <CmsButton
        variant="secondary"
        type="button"
        size="large"
        icon={<ButtonCopyIcon />}
        disabled={dupOff}
        onClick={e => {
          stopCardClick(e)
          onDuplicate?.()
        }} >
        단락 복제
      </CmsButton>
      <CmsButton
        variant="secondary"
        type="button"
        size="large"
        icon={<ButtonDeleteIcon />}
        disabled={delOff}
        onClick={e => {
          stopCardClick(e)
          onDelete?.()
        }} >
        단락 삭제
      </CmsButton>
    </>
  )
}
