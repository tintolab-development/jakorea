import type { FileAttachmentParagraph } from '@/features/template/model/writing-form-draft.schema'
import { resolveParagraphTitleRequiredMark } from '@/features/template/lib/paragraph-required-mark'
import { FormParagraphSectionDescription } from '@/features/template/ui/shared/form-paragraph-section-description'
import './document-education-photos-readonly.css'

const DEFAULT_EDUCATION_PHOTOS_SLOT_COUNT = 2

function trimText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** A4 contentOnly — 제목·설명·placeholder 그리드를 한 컴포넌트에서 렌더 (헤더 숨김과 병행) */
export function DocumentEducationPhotosReadonly({
  paragraph,
  slotCount = DEFAULT_EDUCATION_PHOTOS_SLOT_COUNT,
}: {
  paragraph: FileAttachmentParagraph
  slotCount?: number
}) {
  const title = trimText(paragraph.paragraphTitle) || '교육 사진'
  const description = trimText(paragraph.paragraphDescription)

  return (
    <div className="document-education-photos-readonly">
      <div className="document-education-photos-readonly__header">
        <div className="document-education-photos-readonly__title-wrap">
          <span className="document-education-photos-readonly__title">{title}</span>
          {resolveParagraphTitleRequiredMark(paragraph) ? (
            <span className="document-education-photos-readonly__required" aria-hidden>
              *
            </span>
          ) : null}
        </div>
        {description.length > 0 ? (
          <FormParagraphSectionDescription
            surface="templateAuthoring"
            titleAligned
            className="document-education-photos-readonly__description"
          >
            {description}
          </FormParagraphSectionDescription>
        ) : null}
      </div>
      <div className="document-education-photos-readonly__grid">
        {Array.from({ length: slotCount }, (_, index) => (
          <div key={index} className="document-education-photos-readonly__slot" />
        ))}
      </div>
    </div>
  )
}
