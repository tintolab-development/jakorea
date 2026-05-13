import { Form } from 'antd'
import { FormEditorMultipleChoiceItems } from '@/features/template/ui/form-editor/form-editor-multiple-choice-items'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { MultipleChoiceParagraph } from '@/features/template/model/writing-form-draft.schema'
import { FORM_EDITOR_MULTIPLE_CHOICE_ITEMS_FOCUS_ID } from '@/features/template/model/writing-form-draft.schema'
import { paragraphVariantLabel } from '@/features/template/ui/form-editor/right-panel/config/paragraph-editor.registry'
import type { FormEditorRightPanelUpdateParagraph } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel.types'

export function MultipleChoiceEditor({
  paragraph,
  updateParagraph,
  singleItemListActiveItemId,
}: {
  paragraph: MultipleChoiceParagraph
  updateParagraph: FormEditorRightPanelUpdateParagraph
  singleItemListActiveItemId?: string | null
}) {
  return (
    <>
      <Form.Item label="항목 유형">
        <CmsSelect
          width="100%"
          value={paragraphVariantLabel(paragraph)}
          options={[
            {
              value: paragraphVariantLabel(paragraph),
              label: paragraphVariantLabel(paragraph),
            },
          ]}
          disabled
        />
      </Form.Item>
      {singleItemListActiveItemId === FORM_EDITOR_MULTIPLE_CHOICE_ITEMS_FOCUS_ID ||
      singleItemListActiveItemId === undefined ? (
        <FormEditorMultipleChoiceItems paragraph={paragraph} updateParagraph={updateParagraph} />
      ) : null}
    </>
  )
}
