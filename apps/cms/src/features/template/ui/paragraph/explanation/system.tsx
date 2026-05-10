import type {
  AgreementSystemBodyDisplayMode,
  SystemParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import '@/features/template/ui/form-editor/form-editor.css'
import './explanation-system.css'

const AUTHORING_DATE_LABEL = 'YYYY년 MM월 DD일'
const AUTHORING_SIGNATURE_LABEL = '동의자 (서명)'

function formatKoreanFullDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}년 ${m}월 ${day}일`
}

/** 설명글·기타형 — `systemPreset`이 동의 고정 항목일 때만 본문 슬롯 렌더 */
export function ExplanationSystem({
  paragraph,
  displayMode = 'authoring',
  participantName,
  now,
}: {
  paragraph: SystemParagraph
  onChange: (next: SystemParagraph) => void
  isEditMode: boolean
  displayMode?: AgreementSystemBodyDisplayMode
  /** write 모드 서명란 — 사용자 이름 */
  participantName?: string
  /** write 모드 날짜(미주입 시 `new Date()`) */
  now?: Date
}) {
  const preset = paragraph.systemPreset
  if (preset !== 'agreement_date' && preset !== 'agreement_signature') {
    return null
  }

  const bodyText =
    preset === 'agreement_date'
      ? displayMode === 'write' || displayMode === 'document'
        ? formatKoreanFullDate(now ?? new Date())
        : AUTHORING_DATE_LABEL
      : displayMode === 'write'
        ? `동의자 : ${(participantName ?? '').trim() || '000'} (서명)`
        : AUTHORING_SIGNATURE_LABEL

  const documentSignatureBody =
    preset === 'agreement_signature' && displayMode === 'document' ? (
      <div className="explanation-system-signature-document">
        <span className="explanation-system-signature-document__name">동의자</span>
        <span className="explanation-system-signature-document__mark">(서명)</span>
      </div>
    ) : null

  return (
    <div
      className={['form-editor-body', displayMode === 'document' ? 'explanation-system--document' : '']
        .filter(Boolean)
        .join(' ')}
    >
      <div className="explanation-system-row">
        <div className="explanation-system-pill">{documentSignatureBody ?? bodyText}</div>
      </div>
    </div>
  )
}
