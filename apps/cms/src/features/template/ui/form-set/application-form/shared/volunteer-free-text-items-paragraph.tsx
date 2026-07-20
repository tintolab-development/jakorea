import { CmsTextArea } from '@/shared/ui/cms-textarea'
import './volunteer-free-text-items-paragraph.css'

type FreeTextQuestion = {
  label: string
  hint?: string
  placeholder?: string
}

export const VOLUNTEER_FREE_TEXT_QUESTIONS: readonly FreeTextQuestion[] = [
  { label: '1. 자기소개 및 지원동기를 자유롭게 작성해 주세요.' },
  { label: '2. 교육봉사, 강사 아르바이트 등 교육 진행 경험을 간략히 적어주세요.' },
  { label: '3. 초등학생 대상 경제 교육의 필요성에 대해 본인의 생각을 자유롭게 작성해 주세요.' },
  {
    label:
      '4. 초·중·고 당시 학교에서 JA Korea 경제금융교육을 들은 경험 혹은 진행하는 프로그램에 지원하여 참여한 경험 등을 간략하게 적어 주세요.',
    hint: "(경험이 없을 경우 '없음'으로 작성해 주세요.)",
  },
]

const DEFAULT_PLACEHOLDER = '자유롭게 작성해 주세요'

/** 봉사자 신청·추가 등록 공통 — 자유 작성 항목 */
export function VolunteerFreeTextItemsParagraph() {
  return (
    <div className="volunteer-free-text-items__stack">
      {VOLUNTEER_FREE_TEXT_QUESTIONS.map((q, idx) => (
        <div key={idx} className="volunteer-free-text-items__card">
          <div className="volunteer-free-text-items__card-header">
            <span className="volunteer-free-text-items__card-label">{q.label}</span>
            {q.hint ? (
              <span className="volunteer-free-text-items__card-hint">{q.hint}</span>
            ) : null}
          </div>
          <div className="volunteer-free-text-items__card-body">
            <CmsTextArea
              inputSize="medium"
              rows={3}
              placeholder={q.placeholder ?? DEFAULT_PLACEHOLDER}
              width="100%"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
