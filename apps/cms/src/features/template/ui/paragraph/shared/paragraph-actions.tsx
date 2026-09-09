import type { MouseEvent } from 'react'
import { CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { FormEditorPlusIcon } from '@/features/template/ui/shared/form-editor-plus-icon'
import { CmsButton } from '@/shared/ui/cms-button'

/** 템플릿 단락 카드 푸터 — large+icon 기본 180px 대신 시안 140×44 */
const PARAGRAPH_CARD_ACTION_BUTTON_CLASS = 'cms-button--action'

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
  duplicateDisabled = false,
  deleteDisabled = false,
}: FormParagraphCardActionsProps = {}) {
  const addOff = disabled || addDisabled
  const dupOff = disabled || duplicateDisabled
  const delOff = disabled || deleteDisabled
  return (
    <>
      {onAddItem ? (
        <CmsButton
          variant="primary"
          type="button"
          size="large"
          className={PARAGRAPH_CARD_ACTION_BUTTON_CLASS}
          disabled={addOff}
          onClick={e => {
            stopCardClick(e)
            onAddItem()
          }}
        >
          + 항목 추가
        </CmsButton>
      ) : null}
      <CmsButton
        variant="secondary"
        type="button"
        size="large"
        className={PARAGRAPH_CARD_ACTION_BUTTON_CLASS}
        icon={<FormEditorPlusIcon />}
        disabled={addOff}
        onClick={e => {
          stopCardClick(e)
          onAdd?.()
        }}
      >
        단락 추가
      </CmsButton>
      <CmsButton
        variant="secondary"
        type="button"
        size="large"
        className={PARAGRAPH_CARD_ACTION_BUTTON_CLASS}
        icon={<CopyOutlined />}
        disabled={dupOff}
        onClick={e => {
          stopCardClick(e)
          onDuplicate?.()
        }}
      >
        단락 복제
      </CmsButton>
      <CmsButton
        variant="secondary"
        type="button"
        size="large"
        className={PARAGRAPH_CARD_ACTION_BUTTON_CLASS}
        icon={<DeleteOutlined />}
        disabled={delOff}
        onClick={e => {
          stopCardClick(e)
          onDelete?.()
        }}
      >
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
        className={PARAGRAPH_CARD_ACTION_BUTTON_CLASS}
        icon={<FormEditorPlusIcon />}
        disabled={addOff}
        onClick={e => {
          stopCardClick(e)
          onAdd?.()
        }}
      >
        단락 추가
      </CmsButton>
      <CmsButton
        variant="secondary"
        type="button"
        size="large"
        className={PARAGRAPH_CARD_ACTION_BUTTON_CLASS}
        icon={<CopyOutlined />}
        disabled={dupOff}
        onClick={e => {
          stopCardClick(e)
          onDuplicate?.()
        }}
      >
        단락 복제
      </CmsButton>
      <CmsButton
        variant="secondary"
        type="button"
        size="large"
        className={PARAGRAPH_CARD_ACTION_BUTTON_CLASS}
        icon={<DeleteOutlined />}
        disabled={delOff}
        onClick={e => {
          stopCardClick(e)
          onDelete?.()
        }}
      >
        단락 삭제
      </CmsButton>
    </>
  )
}
