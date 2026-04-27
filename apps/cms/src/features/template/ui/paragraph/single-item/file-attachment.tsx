import type { FileAttachmentParagraph } from '@/features/template/model/writing-form-draft.schema'

/** 파일 첨부형 (file-attachment) — 단락 바디 슬롯 (추후 본문 연동) */
export function FileAttachment(_props: {
  paragraph: FileAttachmentParagraph
  onChange?: (next: FileAttachmentParagraph) => void
  isEditMode: boolean
}) {
  return null
}
