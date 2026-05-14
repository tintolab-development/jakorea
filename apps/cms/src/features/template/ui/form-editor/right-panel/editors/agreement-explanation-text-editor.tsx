import { Form } from 'antd'
import type { AgreementExplanationTextParagraph } from '@/features/template/model/writing-form-draft.schema'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import type { FormEditorRightPanelUpdateParagraph } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel.types'

export function AgreementExplanationTextEditor({
  paragraph,
  updateParagraph,
}: {
  paragraph: AgreementExplanationTextParagraph
  updateParagraph: FormEditorRightPanelUpdateParagraph
}) {
  return (
    <>
      <Form.Item label="입력창 안내 텍스트">
        <CmsInput
          width="100%"
          value={paragraph.bodyPlaceholder}
          onChange={event =>
            updateParagraph(paragraph.id, current =>
              current.kind === 'single_item' && current.variant === 'agreement_explanation_text'
                ? { ...current, bodyPlaceholder: event.target.value }
                : current
            )
          }
          placeholder="텍스트를 작성해 주세요"
        />
      </Form.Item>
      <Form.Item label="미리보기 기본 텍스트">
        <CmsTextArea
          width="100%"
          rows={3}
          value={paragraph.bodyText}
          onChange={event =>
            updateParagraph(paragraph.id, current =>
              current.kind === 'single_item' && current.variant === 'agreement_explanation_text'
                ? { ...current, bodyText: event.target.value }
                : current
            )
          }
          placeholder="미리보기에 노출될 기본 텍스트를 입력해 주세요"
        />
      </Form.Item>
    </>
  )
}
