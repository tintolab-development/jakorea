import {
  PROGRAM_VOLUNTEER_FREE_TEXT_MAX_LENGTH,
  PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS,
} from '@/features/template/model/program-application-form-volunteer-draft'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import './volunteer-free-text-items-paragraph.css'

const DEFAULT_PLACEHOLDER = '자유롭게 작성해 주세요'

/** 봉사자 신청·추가 등록 공통 — 자유 작성 항목 */
export function VolunteerFreeTextItemsParagraph() {
  return (
    <div className="volunteer-free-text-items__stack">
      {PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS.map(q => (
        <div key={q.id} className="volunteer-free-text-items__card">
          <div className="volunteer-free-text-items__card-header">
            <span className="volunteer-free-text-items__card-label">{q.label}</span>
            {q.hint ? (
              <span className="volunteer-free-text-items__card-hint">{q.hint}</span>
            ) : null}
          </div>
          <div className="volunteer-free-text-items__card-body">
            <CmsTextArea
              inputSize="small"
              rows={3}
              maxLength={PROGRAM_VOLUNTEER_FREE_TEXT_MAX_LENGTH}
              showCount
              placeholder={DEFAULT_PLACEHOLDER}
              width="100%"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
