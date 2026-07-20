import { useState } from 'react'
import { INSTITUTION_GUIDANCE_FIELDS } from '@/features/template/lib/institution-guidance-field-definitions'
import { InstitutionGuidanceFieldCard } from '@/features/template/ui/form-set/application-form/institution/paragraphs/institution-guidance-field-card'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

/** 1사1교 프로그램 참여자 신청 폼 — 안내 사항 */
export function EconomyProgramApplicationGuidanceParagraph() {
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(INSTITUTION_GUIDANCE_FIELDS.map(field => [field.id, '']))
  )

  return (
    <div className="program-application-form-institution__paragraph program-application-form-institution__guidance">
      <div className="institution-guidance-fields">
        {INSTITUTION_GUIDANCE_FIELDS.map(field => (
          <InstitutionGuidanceFieldCard
            key={field.id}
            field={field}
            value={answers[field.id] ?? ''}
            onChange={value =>
              setAnswers(current => ({
                ...current,
                [field.id]: value,
              }))
            }
          />
        ))}
      </div>
    </div>
  )
}
