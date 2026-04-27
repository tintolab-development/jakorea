import type { MouseEvent } from 'react'
import { CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { FormEditorPlusIcon } from '@/features/template/ui/paragraph/shared/form-editor-plus-icon'
import { CmsButton } from '@/shared/ui/cms-button'

export type FormParagraphCardActionHandlers = {
  onAdd?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}

function stopCardClick(e: MouseEvent<HTMLElement>) {
  e.stopPropagation()
}

export function FormParagraphCardActions({
  onAdd,
  onDuplicate,
  onDelete,
}: FormParagraphCardActionHandlers = {}) {
  return (
    <>
      <CmsButton
        variant="secondary"
        type="button"
        size="large"
        icon={<FormEditorPlusIcon />}
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
}: FormParagraphCardActionHandlers = {}) {
  return (
    <>
      <CmsButton
        variant="secondary"
        type="button"
        size="large"
        icon={<FormEditorPlusIcon />}
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
