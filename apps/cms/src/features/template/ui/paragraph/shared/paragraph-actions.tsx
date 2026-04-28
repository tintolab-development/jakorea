import type { MouseEvent } from 'react'
import { CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { FormEditorPlusIcon } from '@/features/template/ui/paragraph/shared/form-editor-plus-icon'
import { CmsButton } from '@/shared/ui/cms-button'

export type FormParagraphCardActionHandlers = {
  onAdd?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onAddItem?: () => void
}

export type FormParagraphCardActionsProps = FormParagraphCardActionHandlers & {
  disabled?: boolean
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
}: FormParagraphCardActionsProps = {}) {
  return (
    <>
      {onAddItem ? (
        <CmsButton
          variant="primary"
          type="button"
          disabled={disabled}
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
        icon={<FormEditorPlusIcon />}
        disabled={disabled}
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
        icon={<CopyOutlined />}
        disabled={disabled}
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
        icon={<DeleteOutlined />}
        disabled={disabled}
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
}: FormParagraphCardActionsProps = {}) {
  return (
    <>
      <CmsButton
        variant="secondary"
        type="button"
        size="large"
        icon={<FormEditorPlusIcon />}
        disabled={disabled}
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
        icon={<CopyOutlined />}
        disabled={disabled}
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
        icon={<DeleteOutlined />}
        disabled={disabled}
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
