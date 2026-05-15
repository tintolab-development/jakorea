import { Form } from 'antd'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { paragraphKindLabel } from '@/features/template/model/writing-form/paragraph-labels'
import {
  DESCRIPTION_DETAIL_OPTIONS,
  PARAGRAPH_KIND_OPTIONS,
  SINGLE_ITEM_DETAIL_OPTIONS,
  TABLE_DETAIL_OPTIONS,
  type DetailSelectValue,
  type ParagraphKindSelectValue,
} from '@/features/template/model/writing-form/paragraph-selectors'
import { paragraphVariantLabel } from '@/features/template/ui/form-editor/right-panel/config/paragraph-editor.registry'

export function ParagraphMetaSection({
  active,
  outline,
  activeKindValue,
  activeDetailValue,
  activeKindLocked,
  onKindChange,
  onDetailChange,
}: {
  active: WritingFormParagraph
  outline: string
  activeKindValue: ParagraphKindSelectValue | null
  activeDetailValue: DetailSelectValue | null
  activeKindLocked: boolean
  onKindChange: (next: ParagraphKindSelectValue) => void
  onDetailChange: (next: DetailSelectValue) => void
}) {
  return (
    <Form layout="vertical" className="form-editor-right-panel__form" requiredMark={false}>
      <span className="form-editor-right-panel__section-title">{outline}</span>
      <Form.Item>
        <div className="form-editor-right-panel__kind-row">
          <>
            <CmsSelect
              width="100%"
              value={activeKindValue ?? paragraphKindLabel(active)}
              options={PARAGRAPH_KIND_OPTIONS}
              onChange={v => onKindChange(v as ParagraphKindSelectValue)}
              disabled={activeKindLocked}
            />
            <CmsSelect
              width="100%"
              value={activeDetailValue ?? paragraphVariantLabel(active)}
              options={
                activeKindValue === 'table'
                  ? TABLE_DETAIL_OPTIONS
                  : activeKindValue === 'description'
                    ? DESCRIPTION_DETAIL_OPTIONS
                    : SINGLE_ITEM_DETAIL_OPTIONS
              }
              onChange={v => onDetailChange(v as DetailSelectValue)}
              disabled={activeKindLocked}
            />
          </>
        </div>
      </Form.Item>
    </Form>
  )
}
