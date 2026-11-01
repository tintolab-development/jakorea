import {
  PROGRAM_VOLUNTEER_FREE_TEXT_MAX_LENGTH,
  PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS,
} from '@/features/template/model/program-application-form-volunteer-draft'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import { ujatVolunteerFreeTextOverlayKey } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-keys'
import { useUjatApplicationVolunteerOverlayKv } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraphs/ujat-program-application-volunteer-basic-info-paragraph'
import '@/features/template/ui/form-set/application-form/shared/volunteer-free-text-items-paragraph.css'

const DEFAULT_PLACEHOLDER = '자유롭게 작성해 주세요'

function UjatVolunteerFreeTextQuestion({ questionId }: { questionId: string }) {
  const [value, setValue] = useUjatApplicationVolunteerOverlayKv<string>(
    ujatVolunteerFreeTextOverlayKey(questionId),
    ''
  )
  return (
    <CmsTextArea
      inputSize="small"
      rows={3}
      maxLength={PROGRAM_VOLUNTEER_FREE_TEXT_MAX_LENGTH}
      showCount
      placeholder={DEFAULT_PLACEHOLDER}
      width="100%"
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  )
}

/** UJAT 프로그램 봉사자 신청 폼 — 자유 작성 항목(1~4번) */
export function UjatProgramApplicationVolunteerFreeTextParagraph() {
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
            <UjatVolunteerFreeTextQuestion questionId={q.id} />
          </div>
        </div>
      ))}
    </div>
  )
}
