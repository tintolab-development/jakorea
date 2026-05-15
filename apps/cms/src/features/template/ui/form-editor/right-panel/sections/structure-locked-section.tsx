import { Form } from 'antd'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { writingOutlineLabel } from '@/features/template/model/writing-form-draft.schema'
import { paragraphKindLabel } from '@/features/template/model/writing-form/paragraph-labels'
import {
  DESCRIPTION_DETAIL_OPTIONS,
  PARAGRAPH_KIND_OPTIONS,
  SINGLE_ITEM_DETAIL_OPTIONS,
  TABLE_DETAIL_OPTIONS,
  paragraphDetailSelectValue,
  paragraphKindSelectValue,
} from '@/features/template/model/writing-form/paragraph-selectors'
import { paragraphVariantLabel } from '@/features/template/ui/form-editor/right-panel/config/paragraph-editor.registry'

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
              options={
                kindValue === 'table'
                  ? TABLE_DETAIL_OPTIONS
                  : kindValue === 'description'
                    ? DESCRIPTION_DETAIL_OPTIONS
                    : SINGLE_ITEM_DETAIL_OPTIONS
              }
              withAllOption={false}
              onChange={noop}
              disabled
            />
          </div>
        </Form.Item>
        <span className="form-editor-right-panel__structure-locked-hint">
          * 해당 단락은 수정 및 삭제가 불가합니다.
        </span>
      </Form>
    </>
  )
}
