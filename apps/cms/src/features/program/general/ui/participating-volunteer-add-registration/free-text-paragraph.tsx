import { PROGRAM_VOLUNTEER_FREE_TEXT_MAX_LENGTH, PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import { useParticipatingVolunteerAddRegistrationPluginState } from '@/features/program/general/lib/participating-volunteer-add-registration-plugin-state'
import type { ParticipatingVolunteerAddRegistrationSectionContext } from './add-registration-form-types'
import '@/features/template/ui/form-set/application-form/shared/volunteer-free-text-items-paragraph.css'

const DEFAULT_PLACEHOLDER = '자유롭게 작성해 주세요'

/** 참여 봉사자 추가 등록 — 자유 작성 항목 plugin 본문 */
export function ParticipatingVolunteerAddRegistrationFreeTextParagraph(
  _props: ParticipatingVolunteerAddRegistrationSectionContext
) {
  const { values, setFreeText } = useParticipatingVolunteerAddRegistrationPluginState()

  return (
    <div className="volunteer-free-text-items__stack">
      {PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS.map(q => (
        <div key={q.id} className="volunteer-free-text-items__card">
          <div className="volunteer-free-text-items__card-header">
            <span className="volunteer-free-text-items__card-label">
              {q.label}
              <span className="detail-info-form__field-required" aria-hidden>
                *
              </span>
            </span>
            {q.hint ? (
              <span className="volunteer-free-text-items__card-hint">{q.hint}</span>
            ) : null}
          </div>
          <div className="volunteer-free-text-items__card-body">
            <CmsTextArea
              inputSize="small"
              rows={3}
              maxLength={PROGRAM_VOLUNTEER_FREE_TEXT_MAX_LENGTH}
              showCount={false}
              placeholder={DEFAULT_PLACEHOLDER}
              width="100%"
              value={values.freeTextById[q.id] ?? ''}
              onChange={e => setFreeText(q.id, e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
