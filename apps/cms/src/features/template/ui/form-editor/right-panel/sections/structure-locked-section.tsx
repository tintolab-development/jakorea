import { Form } from 'antd'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { formEditorRightPanelSectionTitle, paragraphKindLabel } from '@/features/template/model/writing-form/paragraph-labels'
import {
  PARAGRAPH_KIND_OPTIONS,
  detailSelectOptionsForValue,
  paragraphDetailSelectValue,
  paragraphKindSelectValue,
  type ParagraphKindSelectValue,
} from '@/features/template/model/writing-form/paragraph-selectors'
import { paragraphVariantLabel } from '@/features/template/ui/form-editor/right-panel/config/paragraph-editor.registry'
import { resolveStructureLockedParagraphHint } from '@/features/template/lib/structure-locked-paragraph-hint'
import { resolveStructureLockedDisplayKind } from '@/features/template/lib/structure-locked-type-select'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import {
  isTitleWithPeriodSectionParagraph,
  TEMPLATE_TITLE_PARAGRAPH_SECTION_TITLE,
} from '@/features/template/ui/form-editor/right-panel/hooks/use-active-paragraph'

/**
 * - `table_system_settings`: 등록·모집 시드 — 「테이블 / 시스템 설정」고정
 * - `paragraph_kind_system_settings`: 신청 시드 등 — 단락별 유형 + 「시스템 설정」고정
 */
export type StructureLockedTypeSelectPreset =
  | 'default'
  | 'table_system_settings'
  | 'paragraph_kind_system_settings'

const SYSTEM_SETTINGS_DETAIL_OPTIONS = [{ value: 'system_settings', label: '시스템 설정' }] as const

const LOCKED_KIND_OPTIONS_BY_VALUE: Record<
  ParagraphKindSelectValue,
  { value: ParagraphKindSelectValue; label: string }[]
> = {
  table: [{ value: 'table', label: '테이블' }],
  single_item: [{ value: 'single_item', label: '단일항목' }],
  description: [{ value: 'description', label: '설명글' }],
}

export function StructureLockedParagraphSection({
  paragraph,
  typeSelectPreset = 'default',
}: {
  paragraph: WritingFormParagraph
  typeSelectPreset?: StructureLockedTypeSelectPreset
}) {
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  /** 템플릿 관리 제목형 단락 — 시안: 섹션 타이틀 「제목 없음」, 잠금 안내 문구 없음 */
  const templateTitleParagraph =
    isTemplateManagementScreen && isTitleWithPeriodSectionParagraph(paragraph)
  const outline =
    paragraph.kind === 'description' && paragraph.variant === 'closing'
      ? `${paragraphKindLabel(paragraph)}_${paragraphVariantLabel(paragraph)}`
      : templateTitleParagraph
        ? TEMPLATE_TITLE_PARAGRAPH_SECTION_TITLE
        : formEditorRightPanelSectionTitle(paragraph)
  const useTableSystemSettings = typeSelectPreset === 'table_system_settings'
  const useParagraphKindSystemSettings = typeSelectPreset === 'paragraph_kind_system_settings'
  const useSystemSettingsDetail = useTableSystemSettings || useParagraphKindSystemSettings
  const paragraphKindValue = paragraphKindSelectValue(paragraph)
  const paragraphDetailValue = paragraphDetailSelectValue(paragraph)
  const kindValue: ParagraphKindSelectValue = useTableSystemSettings
    ? 'table'
    : useParagraphKindSystemSettings
      ? resolveStructureLockedDisplayKind(paragraph.id, paragraphKindValue)
      : paragraphKindValue
  const detailValue = useSystemSettingsDetail ? 'system_settings' : paragraphDetailValue
  const kindOptions = useSystemSettingsDetail
    ? LOCKED_KIND_OPTIONS_BY_VALUE[kindValue]
    : PARAGRAPH_KIND_OPTIONS
  const detailOptions = useSystemSettingsDetail
    ? [...SYSTEM_SETTINGS_DETAIL_OPTIONS]
    : detailSelectOptionsForValue(paragraphKindValue, paragraphDetailValue)
  const noop = () => {}

  return (
    <>
      <Form layout="vertical" className="form-editor-right-panel__form" requiredMark={false}>
        <span className="form-editor-right-panel__section-title">{outline}</span>
        <Form.Item>
          <div className="form-editor-right-panel__kind-row">
            <div className="form-editor-right-panel__kind-cell">
              <CmsSelect
                width="100%"
                value={kindValue}
                options={kindOptions}
                withAllOption={false}
                onChange={noop}
                disabled
              />
            </div>
            <div className="form-editor-right-panel__kind-cell">
              <CmsSelect
                width="100%"
                value={detailValue}
                options={detailOptions}
                withAllOption={false}
                onChange={noop}
                disabled
              />
            </div>
          </div>
        </Form.Item>
        {templateTitleParagraph ? null : (
          <span className="form-editor-right-panel__structure-locked-hint">
            {resolveStructureLockedParagraphHint(paragraph.id)}
          </span>
        )}
      </Form>
    </>
  )
}
