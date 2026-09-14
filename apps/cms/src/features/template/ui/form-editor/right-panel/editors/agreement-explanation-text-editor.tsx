import { Form } from 'antd'
import type { AgreementExplanationTextParagraph } from '@/features/template/model/writing-form-draft.schema'
import { DeferredCmsInput } from '@/features/template/ui/shared/deferred-cms-input'
import { DeferredCmsTextArea } from '@/features/template/ui/shared/deferred-cms-textarea'
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
        <DeferredCmsInput
          width="100%"
          value={paragraph.bodyPlaceholder}
          onCommit={next =>
            updateParagraph(paragraph.id, current =>
              current.kind === 'single_item' && current.variant === 'agreement_explanation_text'
                ? { ...current, bodyPlaceholder: next }
                : current
            )
          }
          placeholder="텍스트를 작성해 주세요"
        />
      </Form.Item>
      <Form.Item label="미리보기 기본 텍스트">
        <DeferredCmsTextArea
          width="100%"
          rows={3}
          value={paragraph.bodyText}
          onCommit={next =>
            updateParagraph(paragraph.id, current =>
              current.kind === 'single_item' && current.variant === 'agreement_explanation_text'
                ? { ...current, bodyText: next }
                : current
            )
          }
          placeholder="미리보기에 노출될 기본 텍스트를 입력해 주세요"
        />
      </Form.Item>
    </>
  )
}
