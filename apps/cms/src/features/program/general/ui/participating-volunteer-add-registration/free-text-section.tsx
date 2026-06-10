import { CmsTextArea } from '@/shared/ui/cms-textarea'

type FreeTextQuestion = {
  label: string
  hint?: string
  placeholder?: string
}

const FREE_TEXT_QUESTIONS: readonly FreeTextQuestion[] = [
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

export function ParticipatingVolunteerAddRegistrationFreeTextSection() {
  return (
    <section className="participating-volunteer-add-registration-modal__section">
      <header className="detail-info-form__header form-paragraph-section-header">
        <h3 className="detail-info-form__title form-paragraph-section-header__title">
          자유 작성 항목
        </h3>
        <p className="form-paragraph-section-description form-paragraph-section-description--response-entry">
          1~3번 문항은 자유롭게 작성 가능합니다.
        </p>
      </header>
      <div className="participating-volunteer-add-registration-modal__free-text-stack">
        {FREE_TEXT_QUESTIONS.map((q, idx) => (
          <div key={idx} className="participating-volunteer-add-registration-modal__free-text-card">
            <div className="participating-volunteer-add-registration-modal__free-text-card-header">
              <span className="participating-volunteer-add-registration-modal__free-text-card-label">
                {q.label}
              </span>
              {q.hint ? (
                <span className="participating-volunteer-add-registration-modal__free-text-card-hint">
                  {q.hint}
                </span>
              ) : null}
            </div>
            <div className="participating-volunteer-add-registration-modal__free-text-card-body">
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
    </section>
  )
}
