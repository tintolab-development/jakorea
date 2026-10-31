import {
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS,
  UJAT_PROGRAM_APPLICATION_VOLUNTEER_EDUCATION_EXPERIENCE_OPTION_IDS,
  UJAT_PROGRAM_APPLICATION_VOLUNTEER_GRADE_OPTIONS,
  UJAT_PROGRAM_APPLICATION_VOLUNTEER_PREFERRED_REGION_ITEMS,
  UJAT_PROGRAM_APPLICATION_VOLUNTEER_ROUTE_OPTIONS,
  UJAT_PROGRAM_APPLICATION_VOLUNTEER_ROUTE_OTHER_VALUE,
} from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-volunteer-draft'
import type { EducationUjatVolunteerApplicationContent } from '../model/types'

const OVERLAY = {
  preferredRegion: 'ujatVolunteerApplication.preferredRegion',
  universityName: 'ujatVolunteerApplication.universityName',
  grade: 'ujatVolunteerApplication.grade',
  major: 'ujatVolunteerApplication.major',
  applicationRoute: 'ujatVolunteerApplication.applicationRoute',
  applicationRouteOther: 'ujatVolunteerApplication.applicationRouteOther',
  hasExperience: 'ujatVolunteerApplication.hasExperience',
  previousYear: 'ujatVolunteerApplication.previousYear',
  previousTerm: 'ujatVolunteerApplication.previousTerm',
} as const

const EMPTY: EducationUjatVolunteerApplicationContent = {
  preferredRegion: '',
  universityName: '',
  gradeLabel: '',
  major: '',
  educationExperienceLabel: '',
  applicationRouteLabel: '',
  previousTermLabel: '',
  interviewScheduleLabel: '',
}

const REGION_CODE_TO_SLUG: Record<string, string> = {
  SEOUL: 'seoul',
  DAEGU: 'daegu',
  DAEJEON: 'daejeon',
  INCHEON: 'incheon',
  BUSAN: 'busan',
  GWANGJU: 'gwangju',
  GYEONGGI_SOUTH: 'gyeonggi-south',
  JEONBUK: 'jeonbuk-jeonju',
  JEONBUK_JEONJU: 'jeonbuk-jeonju',
  JEONJU: 'jeonbuk-jeonju',
}

const PREFERRED_REGION_SLUG_MARKER = '-preferred-region-'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readTrimmed(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function pickDeep(answers: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (key in answers && answers[key] != null && answers[key] !== '') return answers[key]
  }
  for (const nested of Object.values(answers)) {
    const record = asRecord(nested)
    if (!record) continue
    for (const key of keys) {
      if (key in record && record[key] != null && record[key] !== '') return record[key]
    }
  }
  return undefined
}

function unwrapChoice(raw: unknown): string {
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const text = unwrapChoice(item)
      if (text) return text
    }
    return ''
  }
  const record = asRecord(raw)
  if (record) {
    return (
      readTrimmed(record.label) ||
      readTrimmed(record.selectedLabel) ||
      readTrimmed(record.value) ||
      readTrimmed(record.id) ||
      unwrapChoice(record.selectedIds) ||
      unwrapChoice(record.optionIds)
    )
  }
  return readTrimmed(raw)
}

function regionItemSlug(id: string, marker: string): string {
  const index = id.lastIndexOf(marker)
  return index >= 0 ? id.slice(index + marker.length) : id
}

function mapRegionLabel(raw: unknown): string {
  const token = unwrapChoice(raw)
  if (!token) return ''
  const items = UJAT_PROGRAM_APPLICATION_VOLUNTEER_PREFERRED_REGION_ITEMS
  const byExact = items.find(item => item.id === token || item.label === token)
  if (byExact) return byExact.label

  const code = token.trim().toUpperCase().replace(/-/g, '_')
  const aliasSlug = REGION_CODE_TO_SLUG[code]
  const normalized = (aliasSlug ?? token.trim().toLowerCase().replace(/_/g, '-')).replace(/^-/, '')
  const bySlug = items.find(item => {
    const slug = regionItemSlug(item.id, PREFERRED_REGION_SLUG_MARKER)
    return slug === normalized || item.id.endsWith(normalized) || item.id.endsWith(`-${normalized}`)
  })
  return bySlug?.label ?? token
}

function isOpaqueScheduleToken(value: string): boolean {
  const trimmed = value.trim()
  return /^(interview-slot|schedule):/i.test(trimmed)
}

function mapInterviewSlotToken(raw: unknown): string {
  const record = asRecord(raw)
  if (record) {
    return (
      readTrimmed(record.label) ||
      readTrimmed(record.selectedLabel) ||
      mapInterviewSlotToken(record.value)
    )
  }
  const text = readTrimmed(raw)
  if (!text || isOpaqueScheduleToken(text)) return ''
  return text
}

function mapInterviewScheduleLabel(raw: unknown): string {
  if (Array.isArray(raw)) {
    return raw.map(mapInterviewSlotToken).filter(Boolean).join('\n')
  }
  const record = asRecord(raw)
  if (!record) return mapInterviewSlotToken(raw)
  const summary = readTrimmed(record.summary)
  if (summary) {
    return summary
      .split('|')
      .map(part => part.trim())
      .filter(part => part && !isOpaqueScheduleToken(part))
      .join('\n')
  }
  if (Array.isArray(record.selectedLabels)) {
    const labels = record.selectedLabels.map(item => readTrimmed(item)).filter(label => label && !isOpaqueScheduleToken(label))
    if (labels.length > 0) return labels.join('\n')
  }
  return ''
}

function withUnit(value: string, unit: '기' | '년'): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.endsWith(unit) ? trimmed : `${trimmed}${unit}`
}

function mapPreviousTermLabel(answers: Record<string, unknown>, paragraphId: string): string {
  const raw = pickDeep(answers, [OVERLAY.previousTerm, paragraphId, 'previousTerm', 'activityTerm'])
  const record = asRecord(raw)
  const termRaw = record
    ? readTrimmed(record.activityTerm) || readTrimmed(record.term) || readTrimmed(record.previousTerm)
    : readTrimmed(raw)
  const yearFromRecord = record
    ? readTrimmed(record.activityYear) || readTrimmed(record.previousYear) || readTrimmed(record.year)
    : ''
  const yearRaw =
    yearFromRecord ||
    readTrimmed(pickDeep(answers, [OVERLAY.previousYear, 'previousYear', 'activityYear']))
  return [withUnit(termRaw, '기'), withUnit(yearRaw, '년')].filter(Boolean).join(' ')
}

function mapGradeLabel(raw: unknown): string {
  const token = unwrapChoice(raw)
  if (!token) return ''
  const byValue = UJAT_PROGRAM_APPLICATION_VOLUNTEER_GRADE_OPTIONS.find(
    item => item.value === token || item.label === token,
  )
  return byValue?.label ?? token
}

function mapExperienceLabel(raw: unknown): string {
  if (typeof raw === 'boolean') return raw ? '있음' : '없음'
  const token = unwrapChoice(raw).toLowerCase()
  if (!token) return ''
  if (
    token === 'yes' ||
    token === 'true' ||
    token === '있음' ||
    token === UJAT_PROGRAM_APPLICATION_VOLUNTEER_EDUCATION_EXPERIENCE_OPTION_IDS.yes
  ) {
    return '있음'
  }
  if (
    token === 'no' ||
    token === 'false' ||
    token === '없음' ||
    token === UJAT_PROGRAM_APPLICATION_VOLUNTEER_EDUCATION_EXPERIENCE_OPTION_IDS.no
  ) {
    return '없음'
  }
  return ''
}

function mapRouteLabel(routeRaw: unknown, otherRaw: unknown): string {
  const token = unwrapChoice(routeRaw)
  const other = readTrimmed(otherRaw)
  if (!token && !other) return ''
  const option = UJAT_PROGRAM_APPLICATION_VOLUNTEER_ROUTE_OPTIONS.find(
    item => item.value === token || item.label === token,
  )
  if (option?.value === UJAT_PROGRAM_APPLICATION_VOLUNTEER_ROUTE_OTHER_VALUE) {
    return other || option.label
  }
  if (option) return option.label
  if (token === '기타' || token === UJAT_PROGRAM_APPLICATION_VOLUNTEER_ROUTE_OTHER_VALUE) {
    return other || '기타'
  }
  return other ? `${token} ${other}`.trim() : token
}

export function hasUjatVolunteerApplicationProfile(
  content: EducationUjatVolunteerApplicationContent | undefined,
): boolean {
  if (!content) return false
  return Object.values(content).some(value => value.trim().length > 0)
}

export function buildUjatVolunteerApplicationProfileFromAnswers(
  answers: Record<string, unknown> | null | undefined,
): EducationUjatVolunteerApplicationContent | undefined {
  if (!answers) return undefined
  const ids = UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS
  const preferredRegion = mapRegionLabel(
    pickDeep(answers, [
      OVERLAY.preferredRegion,
      'preferredRegion',
      'preferredActivityRegion',
      ids.preferredRegion,
    ]),
  )
  const universityName =
    readTrimmed(pickDeep(answers, [OVERLAY.universityName, 'universityName'])) ||
    readTrimmed(asRecord(answers[ids.basicInfo])?.universityName)
  const gradeLabel =
    mapGradeLabel(pickDeep(answers, [OVERLAY.grade, 'gradeLabel', 'grade'])) ||
    mapGradeLabel(asRecord(answers[ids.basicInfo])?.gradeLabel) ||
    mapGradeLabel(asRecord(answers[ids.basicInfo])?.grade)
  const major =
    readTrimmed(pickDeep(answers, [OVERLAY.major, 'major'])) ||
    readTrimmed(asRecord(answers[ids.basicInfo])?.major)
  const educationExperienceLabel = mapExperienceLabel(
    pickDeep(answers, [
      OVERLAY.hasExperience,
      'hasEducationExperience',
      'educationExperienceYn',
      'educationExperience',
      ids.educationExperience,
    ]),
  )
  const routeToken = pickDeep(answers, [
    OVERLAY.applicationRoute,
    'applicationRouteLabel',
    'applicationRoute',
  ])
  const routeOther = pickDeep(answers, [OVERLAY.applicationRouteOther, 'applicationRouteOther'])
  const basic = asRecord(answers[ids.basicInfo])
  const applicationRouteLabel = mapRouteLabel(
    routeToken ?? basic?.applicationRouteLabel ?? basic?.applicationRoute,
    routeOther ?? basic?.applicationRouteOther,
  )

  const previousTermLabel = mapPreviousTermLabel(answers, ids.previousTerm)
  const interviewScheduleLabel = mapInterviewScheduleLabel(
    pickDeep(answers, [ids.interviewSchedule, 'interviewSchedule', 'interviewPreferredSlots']),
  )

  const content: EducationUjatVolunteerApplicationContent = {
    preferredRegion,
    universityName,
    gradeLabel,
    major,
    educationExperienceLabel,
    applicationRouteLabel,
    previousTermLabel,
    interviewScheduleLabel,
  }
  return hasUjatVolunteerApplicationProfile(content) ? content : undefined
}

export { EMPTY as EMPTY_UJAT_VOLUNTEER_APPLICATION_PROFILE }
