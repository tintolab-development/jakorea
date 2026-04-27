import type { ShortEssayParagraph } from '@/features/template/model/writing-form-draft.schema'
import { CmsInput } from '@/shared/ui'

/** 주관식형 (short-essay) — 단락 바디 슬롯 (추후 본문 연동) */
export function ShortEssay({
  paragraph,
  onChange,
  isEditMode,
}: {
  paragraph: ShortEssayParagraph
  onChange: (next: ShortEssayParagraph) => void
  isEditMode: boolean
}) {
  const ph = paragraph.bodyPlaceholder.trim() || '답변을 입력해주세요'

  return (
    <>
      <CmsInput
        readOnly={!isEditMode}
        width={'100%'}
        value={paragraph.bodyText}
        placeholder={ph}
        onChange={
          isEditMode ? e => onChange({ ...paragraph, bodyText: e.target.value }) : undefined
        }
      />
    </>
  )
}
