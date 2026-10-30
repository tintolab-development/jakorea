import { Radio } from 'antd'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { PFTextInput } from '@/shared/ui'
import { isProgramSponsorVisible } from '../../lib/portal-sponsor-display.ts'
import { ApplyFormRadioGroup } from '../apply-form-radio'
import hostStyles from '../apply-form-field-host.module.css'
import styles from './apply-economy-institution-choices.module.css'

/**
 * 1사1교(institution-economy) 신청 — 결연 금융 회사명 · 전년도 1사1교 진행 여부.
 * 시드 단락은 "항목/내용" placeholder 표라서 CMS `1c-1s/paragraphs/*`처럼 슬롯으로 덮어쓴다.
 * 답 형식은 CMS `parseEconomyDisplayFieldsFromForm`이 읽는 형식과 맞춘다.
 */

export function isEconomyLessonReplyParagraphId(id: string): boolean {
  return id === PROGRAM_APPLICATION_FORM_ECONOMY_IDS.lessonReply
}

export function isEconomyEducationExperienceParagraphId(id: string): boolean {
  return id === PROGRAM_APPLICATION_FORM_ECONOMY_IDS.educationExperience
}

/* ── 결연 금융 회사명 ── */

export type ApplyEconomyLessonReplyCompanyType = 'partner' | 'none' | 'custom' | ''

export type ApplyEconomyLessonReplyValues = {
  companyType: ApplyEconomyLessonReplyCompanyType
  customCompanyName: string
}

/** CMS `lesson-reply-paragraph.tsx` — 후원사가 없을 때 user-write 라벨 */
const PARTNER_RADIO_USER_WRITE_HINT = '프로그램 후원사 명이 노출됩니다.'

export function emptyEconomyLessonReply(): ApplyEconomyLessonReplyValues {
  return { companyType: '', customCompanyName: '' }
}

function asCompanyType(raw: unknown): ApplyEconomyLessonReplyCompanyType {
  return raw === 'partner' || raw === 'none' || raw === 'custom' ? raw : ''
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (typeof raw === 'string') {
    try {
      return asRecord(JSON.parse(raw))
    } catch {
      return null
    }
  }
  return raw != null && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : null
}

export function economyLessonReplyValuesFromDraftAnswer(
  raw: unknown
): ApplyEconomyLessonReplyValues | null {
  const record = asRecord(raw)
  if (!record) return null
  const companyType = asCompanyType(record.companyType)
  if (!companyType) return null
  return {
    companyType,
    customCompanyName:
      typeof record.customCompanyName === 'string' ? record.customCompanyName : '',
  }
}

/** CMS: `program-application-economy-seed-lesson-reply` → `{ companyType, customCompanyName }` */
export function economyLessonReplyAnswerFromValues(
  value: ApplyEconomyLessonReplyValues
): { companyType: Exclude<ApplyEconomyLessonReplyCompanyType, ''>; customCompanyName: string } | null {
  if (!value.companyType) return null
  return {
    companyType: value.companyType,
    customCompanyName: value.companyType === 'custom' ? value.customCompanyName.trim() : '',
  }
}

export function isEconomyLessonReplyIncomplete(value: ApplyEconomyLessonReplyValues): boolean {
  if (!value.companyType) return true
  return value.companyType === 'custom' && value.customCompanyName.trim().length === 0
}

type LessonReplyProps = {
  value: ApplyEconomyLessonReplyValues
  onChange: (next: ApplyEconomyLessonReplyValues) => void
  /** 프로그램 후원사 표시명 (`ProgramDetail.sponsor`) */
  sponsorDisplayName?: string | null
}

export function ApplyEconomyLessonReply({ value, onChange, sponsorDisplayName }: LessonReplyProps) {
  const partnerLabel = isProgramSponsorVisible(sponsorDisplayName)
    ? (sponsorDisplayName ?? '').trim()
    : PARTNER_RADIO_USER_WRITE_HINT
  const isCustom = value.companyType === 'custom'

  return (
    <div className={[styles.root, hostStyles.root].join(' ')}>
      <Radio.Group
        className="form-template-fill-multiple-choice__radios app-radio-group app-radio-group--large"
        size="large"
        name="apply-economy-lesson-reply"
        aria-label="결연 금융 회사명"
        value={value.companyType || undefined}
        onChange={event =>
          onChange({ ...value, companyType: asCompanyType(event.target.value) })
        }
      >
        <Radio value="partner">{partnerLabel}</Radio>
        <Radio value="none">미결연</Radio>
        <span className={styles.customRow}>
          <Radio value="custom" aria-label="기타" />
          <PFTextInput
            variant="formPage"
            size="large"
            width={200}
            placeholder="기타"
            aria-label="기타 결연 금융 회사명"
            disabled={!isCustom}
            value={value.customCompanyName}
            onValueChange={next => onChange({ ...value, customCompanyName: next })}
          />
        </span>
      </Radio.Group>
    </div>
  )
}

/* ── 전년도 1사1교 경제금융교육 진행 여부 ── */

export type ApplyEconomyEducationExperienceValue = 'yes' | 'no' | ''

/** CMS `education-experience-paragraph.tsx` 와 동일 */
const EDUCATION_EXPERIENCE_OPTIONS = [
  { value: 'yes', label: '네, 진행했었습니다.' },
  { value: 'no', label: '아니요, 진행하지 않았습니다.' },
] as const

export function economyEducationExperienceValueFromDraftAnswer(
  raw: unknown
): ApplyEconomyEducationExperienceValue {
  const text = typeof raw === 'string' ? raw.trim() : ''
  if (text === 'yes' || text === 'Y' || text === '참여') return 'yes'
  if (text === 'no' || text === 'N' || text === '미참여') return 'no'
  return ''
}

type EducationExperienceProps = {
  value: ApplyEconomyEducationExperienceValue
  onChange: (next: ApplyEconomyEducationExperienceValue) => void
}

export function ApplyEconomyEducationExperience({ value, onChange }: EducationExperienceProps) {
  return (
    <div className={[styles.root, hostStyles.root].join(' ')}>
      <ApplyFormRadioGroup
        name="apply-economy-education-experience"
        value={value}
        options={EDUCATION_EXPERIENCE_OPTIONS}
        onChange={next => onChange(next === 'yes' || next === 'no' ? next : '')}
      />
    </div>
  )
}
