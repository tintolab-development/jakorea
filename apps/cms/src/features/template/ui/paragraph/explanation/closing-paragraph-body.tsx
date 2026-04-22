import { Input } from 'antd'
import type { ClosingParagraph } from '@/features/template/model/writing-form-draft.schema'
import '@/features/template/ui/form-editor/form-editor.css'

export function ClosingParagraphBody({
  paragraph,
  onChange,
  isEditMode,
}: {
  paragraph: ClosingParagraph
  onChange: (next: ClosingParagraph) => void
  isEditMode: boolean
}) {
  if (!isEditMode) {
    const text = paragraph.body.trim()
    return (
      <div className="form-editor-body form-editor-body--view form-editor-body--closing-view">
        <p className="form-editor-closing-view__text">{text || '마무리글 없음'}</p>
        {paragraph.showAgreementFooter ? (
          <>
            <div className="form-editor-agreement-footer__bar">YYYY년 MM월 DD일</div>
            <div className="form-editor-agreement-footer__bar">동의자 (서명)</div>
          </>
        ) : null}
      </div>
    )
  }

  return (
    <div className="form-editor-body form-editor-body--closing">
      <Input.TextArea
        value={paragraph.body}
        onChange={e => onChange({ ...paragraph, body: e.target.value })}
        rows={4}
        placeholder="마무리 문구를 입력해 주세요"
      />
      {paragraph.showAgreementFooter ? (
        <>
          <div className="form-editor-agreement-footer__bar form-editor-agreement-footer__bar--preview">
            YYYY년 MM월 DD일
          </div>
          <div className="form-editor-agreement-footer__bar form-editor-agreement-footer__bar--preview">
            동의자 (서명)
          </div>
        </>
      ) : null}
    </div>
  )
}
