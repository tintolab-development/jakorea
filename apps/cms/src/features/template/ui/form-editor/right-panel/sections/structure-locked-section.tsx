import { Form } from 'antd'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { writingOutlineLabel } from '@/features/template/model/writing-form-draft.schema'
import { paragraphKindLabel } from '@/features/template/model/writing-form/paragraph-labels'
import {
  PARAGRAPH_KIND_OPTIONS,
  detailSelectOptionsForValue,
  paragraphDetailSelectValue,
  paragraphKindSelectValue,
} from '@/features/template/model/writing-form/paragraph-selectors'
import { paragraphVariantLabel } from '@/features/template/ui/form-editor/right-panel/config/paragraph-editor.registry'
import { resolveStructureLockedParagraphHint } from '@/features/template/lib/structure-locked-paragraph-hint'

export function StructureLockedParagraphSection({ paragraph }: { paragraph: WritingFormParagraph }) {
  const outline =
    paragraph.kind === 'description' && paragraph.variant === 'closing'
      ? `${paragraphKindLabel(paragraph)}_${paragraphVariantLabel(paragraph)}`
      : writingOutlineLabel(paragraph)
  const kindValue = paragraphKindSelectValue(paragraph)
  const detailValue = paragraphDetailSelectValue(paragraph)
  const noop = () => {}

  return (
    <>
      <Form layout="vertical" className="form-editor-right-panel__form" requiredMark={false}>
        <span className="form-editor-right-panel__section-title">{outline}</span>
        <Form.Item>
          <div className="form-editor-right-panel__kind-row">
            <CmsSelect
              width="100%"
              value={kindValue}
              options={PARAGRAPH_KIND_OPTIONS}
              withAllOption={false}
              onChange={noop}
              disabled
            />
            <CmsSelect
              width="100%"
              value={detailValue}
              options={detailSelectOptionsForValue(kindValue, detailValue)}
              withAllOption={false}
              onChange={noop}
              disabled
            />
          </div>
        </Form.Item>
        <span className="form-editor-right-panel__structure-locked-hint">
          {resolveStructureLockedParagraphHint(paragraph.id)}
        </span>
      </Form>
    </>
  )
}
