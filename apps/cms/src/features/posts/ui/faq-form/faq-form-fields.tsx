import { Form } from 'antd'
import { CmsInput, CmsRadioGroup, CmsSelect, CmsTextArea } from '@/shared/ui'

export type FaqFormFieldsProps = {
  categoryOptions: { label: string; value: string }[]
}

function isRegisterableFaqCategory(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const v = value.trim()
  return v.length > 0 && v !== 'ALL' && v !== '전체'
}

/**
 * FAQ 등록/수정 폼 본문 — 부모 `Form` 안에서만 사용.
 * 모달·상세 등 레이아웃은 래퍼에서 담당.
 */
export function FaqFormFields({ categoryOptions }: FaqFormFieldsProps) {
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
            width={260}
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
        {/* 시안: 서식 편집기 없이 일반 텍스트 입력 — 홈페이지 FAQ도 답변을 텍스트로 표시한다 */}
        <CmsTextArea
          className="faq-form-modal__section faq-form-modal__answer"
          label="내용 (답변)"
          required
          inputSize="large"
          width="100%"
          rows={8}
          placeholder="내용을 입력해 주세요"
        />
      </Form.Item>
    </div>
  )
}
