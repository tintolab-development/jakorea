import { Form } from 'antd'
import type { Editor } from '@/shared/rich-text'
import { RichTextEditor } from '@/shared/rich-text'
import type { AdminFileUploadOwner } from '@/shared/lib/admin-file-upload'
import { CmsFieldFrame, CmsInput, CmsRadioGroup, CmsSelect, useCmsFieldStatus } from '@/shared/ui'

export type FaqFormFieldsProps = {
  categoryOptions: { label: string; value: string }[]
  editor: Editor | null
  editorMinHeight: string
  fileUploadOwner: AdminFileUploadOwner | null
}

function isRegisterableFaqCategory(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const v = value.trim()
  return v.length > 0 && v !== 'ALL' && v !== '전체'
}

function FaqAnswerEditor({
  editor,
  editorMinHeight,
  fileUploadOwner,
}: {
  editor: Editor | null
  editorMinHeight: string
  fileUploadOwner: AdminFileUploadOwner | null
}) {
  const { isError, message, hasMessage } = useCmsFieldStatus({})

  return (
    <CmsFieldFrame
      size="large"
      label="내용 (답변)"
      required
      isError={isError}
      message={hasMessage ? message : undefined}
      className="faq-form-modal__section faq-form-modal__section--editor"
    >
      <div className="faq-form-modal__editor-host">
        <RichTextEditor
          editor={editor}
          minHeight={editorMinHeight}
          fileUploadOwner={fileUploadOwner}
        />
      </div>
    </CmsFieldFrame>
  )
}

/**
 * FAQ 등록/수정 폼 본문 — 부모 `Form` 안에서만 사용.
 * 모달·상세 등 레이아웃은 래퍼에서 담당.
 */
export function FaqFormFields({
  categoryOptions,
  editor,
  editorMinHeight,
  fileUploadOwner,
}: FaqFormFieldsProps) {
  const registerOptions = categoryOptions.filter(opt => isRegisterableFaqCategory(opt.value))

  return (
    <div className="faq-form-modal__fields">
      <div className="faq-form-modal__row-split">
        <Form.Item
          name="category"
          className="faq-form-modal__field faq-form-modal__field--category"
          normalize={value => (isRegisterableFaqCategory(value) ? value.trim() : undefined)}
          rules={[
            {
              validator: async (_, value) => {
                if (!isRegisterableFaqCategory(value)) {
                  throw new Error('카테고리를 선택해 주세요.')
                }
              },
            },
          ]}
        >
          <CmsSelect
            label="카테고리"
            required
            placeholder="카테고리 선택"
            options={registerOptions}
            width={240}
            inputSize="large"
            withAllOption={false}
            allowClear={false}
          />
        </Form.Item>
        <Form.Item
          name="visibility"
          className="faq-form-modal__field faq-form-modal__field--visibility"
          initialValue="public"
          rules={[
            {
              validator: async (_, value) => {
                if (value !== 'public' && value !== 'private') {
                  throw new Error('공개 여부를 선택해 주세요.')
                }
              },
            },
          ]}
        >
          <CmsRadioGroup
            label="공개 여부"
            required
            size="large"
            options={[
              { label: '공개', value: 'public' },
              { label: '비공개', value: 'private' },
            ]}
          />
        </Form.Item>
      </div>
      <Form.Item
        name="question"
        className="faq-form-modal__section"
        rules={[{ required: true, whitespace: true, message: '제목을 입력해 주세요.' }]}
      >
        <CmsInput
          label="제목 (질문)"
          required
          placeholder="제목을 입력해 주세요"
          inputSize="large"
          width="100%"
          maxLength={500}
        />
      </Form.Item>
      <Form.Item
        name="answer"
        rules={[{ required: true, whitespace: true, message: '내용을 입력해 주세요.' }]}
      >
        <FaqAnswerEditor
          editor={editor}
          editorMinHeight={editorMinHeight}
          fileUploadOwner={fileUploadOwner}
        />
      </Form.Item>
    </div>
  )
}
