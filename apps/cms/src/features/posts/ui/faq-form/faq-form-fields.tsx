import type { RefObject } from 'react'
import { Form } from 'antd'
import { CmsInput, CmsRadioGroup, CmsSelect } from '@/shared/ui'

export type FaqFormFieldsProps = {
  editorHostRef: RefObject<HTMLDivElement | null>
  categoryOptions: { label: string; value: string }[]
}

/**
 * FAQ 등록/수정 폼 본문 — 부모 `Form` 안에서만 사용.
 * 모달·상세 등 레이아웃은 래퍼에서 담당.
 */
export function FaqFormFields({ editorHostRef, categoryOptions }: FaqFormFieldsProps) {
  return (
    <div className="faq-form-modal__fields">
      <div className="faq-form-modal__row-split">
        <Form.Item
          name="category"
          label="카테고리"
          className="faq-form-modal__field faq-form-modal__field--category"
          rules={[{ required: true, message: '카테고리를 선택해주세요.' }]}
        >
          <CmsSelect
            placeholder="전체"
            options={categoryOptions}
            allowClear
            width={240}
            inputSize="large"
          />
        </Form.Item>
        <Form.Item
          name="visibility"
          label="공개 여부"
          className="faq-form-modal__field faq-form-modal__field--visibility"
          initialValue="public"
          rules={[{ required: true }]}
        >
          <CmsRadioGroup
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
        label="제목 (질문)"
        rules={[{ required: true, message: '제목을 입력해주세요.' }]}
      >
        <CmsInput
          placeholder="제목을 입력해주세요"
          inputSize="large"
          width="100%"
          maxLength={500}
        />
      </Form.Item>
      <div className="faq-form-modal__editor-section">
        <div className="faq-form-modal__editor-label">내용 (답변)</div>
        <div ref={editorHostRef} className="faq-form-modal__editor-host" />
      </div>
    </div>
  )
}
