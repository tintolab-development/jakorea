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

/** 등록·모집 시드 — 유형 셀렉트를 「테이블 / 시스템 설정」으로 고정 표시 */
export type StructureLockedTypeSelectPreset = 'default' | 'table_system_settings'

const TABLE_SYSTEM_SETTINGS_KIND_OPTIONS = [{ value: 'table', label: '테이블' }] as const
const TABLE_SYSTEM_SETTINGS_DETAIL_OPTIONS = [
  { value: 'system_settings', label: '시스템 설정' },
] as const

export function StructureLockedParagraphSection({
  paragraph,
  typeSelectPreset = 'default',
}: {
  paragraph: WritingFormParagraph
  typeSelectPreset?: StructureLockedTypeSelectPreset
}) {
  const outline =
    paragraph.kind === 'description' && paragraph.variant === 'closing'
      ? `${paragraphKindLabel(paragraph)}_${paragraphVariantLabel(paragraph)}`
      : writingOutlineLabel(paragraph)
  const useTableSystemSettings = typeSelectPreset === 'table_system_settings'
  const paragraphKindValue = paragraphKindSelectValue(paragraph)
  const paragraphDetailValue = paragraphDetailSelectValue(paragraph)
  const kindValue = useTableSystemSettings ? 'table' : paragraphKindValue
  const detailValue = useTableSystemSettings ? 'system_settings' : paragraphDetailValue
  const kindOptions = useTableSystemSettings
    ? [...TABLE_SYSTEM_SETTINGS_KIND_OPTIONS]
    : PARAGRAPH_KIND_OPTIONS
  const detailOptions = useTableSystemSettings
    ? [...TABLE_SYSTEM_SETTINGS_DETAIL_OPTIONS]
    : detailSelectOptionsForValue(paragraphKindValue, paragraphDetailValue)
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
              options={kindOptions}
              withAllOption={false}
              onChange={noop}
              disabled
            />
            <CmsSelect
              width="100%"
              value={detailValue}
              options={detailOptions}
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
