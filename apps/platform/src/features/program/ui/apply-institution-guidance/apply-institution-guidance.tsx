import { PFText, PFTextarea } from '@/shared/ui'
import styles from './apply-institution-guidance.module.css'

const GUIDANCE_FIELDS = [
  {
    id: 'computer-in-room',
    title: '강의 공간 내 컴퓨터 여부',
    description:
      '강의 공간 내 사용 가능한 컴퓨터가 있다면 몇대 있는지, USB 사용 가능 여부 등의 안내사항을 작성해 주세요.',
  },
  {
    id: 'waiting-place',
    title: '대기 장소 안내',
    description:
      '강사님들이 대기할 수 있는 장소를 상세히 작성해 주세요. (ex. 본관 2층 3학년 연구실)',
  },
  {
    id: 'meal',
    title: '식사 가능 여부 및 안내',
    description:
      '강사님들의 식사 방법과 관련하여 안내사항을 작성해 주세요. (ex. 식사 불가, 인당 4500원 지불 후 급식실에서 식사 가능 등)',
  },
  {
    id: 'other-notes',
    title: '기타 특이사항(주차, 전달사항 등)',
    description: '주차 안내나 기타 전달사항이 있다면 작성해 주세요.',
  },
] as const

const ANSWER_MAX_LENGTH = 1000

export type ApplyInstitutionGuidanceAnswers = Record<string, string>

export function emptyInstitutionGuidanceAnswers(): ApplyInstitutionGuidanceAnswers {
  return Object.fromEntries(GUIDANCE_FIELDS.map(field => [field.id, '']))
}

export function guidanceAnswerFromValues(
  values: ApplyInstitutionGuidanceAnswers,
): Record<string, string> {
  return Object.fromEntries(
    GUIDANCE_FIELDS.map(field => [field.id, (values[field.id] ?? '').trim()]),
  )
}

export function guidanceValuesFromDraftAnswer(
  answer: unknown,
): ApplyInstitutionGuidanceAnswers | null {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null
  const row = answer as Record<string, unknown>
  const next = emptyInstitutionGuidanceAnswers()
  let hasValue = false
  for (const field of GUIDANCE_FIELDS) {
    const raw = row[field.id]
    if (typeof raw === 'string') {
      next[field.id] = raw
      if (raw.trim()) hasValue = true
    }
  }
  return hasValue ? next : null
}

type ApplyInstitutionGuidanceProps = {
  value: ApplyInstitutionGuidanceAnswers
  onChange: (next: ApplyInstitutionGuidanceAnswers) => void
}

/** CMS 안내 사항 카드와 동일 항목·문구 */
export function ApplyInstitutionGuidance({ value, onChange }: ApplyInstitutionGuidanceProps) {
  return (
    <div className={styles.list}>
      {GUIDANCE_FIELDS.map(field => (
        <div key={field.id} className={styles.card}>
          <div className={styles.header}>
            <PFText as="p" typo="bd-md-bd" color="black" className={styles.title}>
              {field.title}
            </PFText>
            <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600" className={styles.description}>
              {field.description}
            </PFText>
          </div>
          <PFTextarea
            variant="formPage"
            size="large"
            rows={2}
            maxLength={ANSWER_MAX_LENGTH}
            placeholder="답변을 입력해 주세요"
            value={value[field.id] ?? ''}
            onValueChange={next => onChange({ ...value, [field.id]: next })}
          />
        </div>
      ))}
    </div>
  )
}
