import type { FormResponseAnswerResponse } from '@/shared/api/generated/forms-surveys/schemas/formResponseAnswerResponse'
import type { FormResponseResponse } from '@/shared/api/generated/forms-surveys/schemas/formResponseResponse'
import type {
  ApplicantInstitutionDetailExtend,
  ApplicantSchoolRow,
} from '@/features/program/shared/model/applicant-institution'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'

function stripJsonQuotes(raw: string): string {
  const t = raw.trim()
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
    try {
      return JSON.parse(t) as string
    } catch {
      return t.slice(1, -1)
    }
  }
  return t
}

/** form_response answers → questionKey → display/value 맵 */
export function buildFormAnswerMap(
  answers: FormResponseAnswerResponse[] | undefined
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const answer of answers ?? []) {
    const key = answer.questionKeySnapshot?.trim()
    if (!key) continue
    const display = answer.answerDisplayText?.trim()
    if (display) {
      map[key] = display
      continue
    }
    const valueJson = answer.answerValueJson?.trim()
    if (!valueJson || valueJson === 'null') continue
    map[key] = stripJsonQuotes(valueJson)
  }
  return map
}

function pickAnswer(
  map: Record<string, string>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const v = map[key]?.trim()
    if (v) return v
  }
  return undefined
}

function parseGuidanceRows(map: Record<string, string>): {
  computer?: string
  waiting?: string
  meal?: string
  notes?: string
} {
  const computer = pickAnswer(map, 'computerAvailability')
  const waiting = pickAnswer(map, 'waitingAreaGuide')
  const meal = pickAnswer(map, 'mealGuide')
  const notes = pickAnswer(map, 'otherNotes')
  if (computer || waiting || meal || notes) {
    return { computer, waiting, meal, notes }
  }
  const tableRaw = map['program-application-institution-seed-guidance']?.trim()
  if (!tableRaw) return {}
  try {
    const parsed = JSON.parse(tableRaw) as unknown
    if (Array.isArray(parsed)) {
      return {
        computer: typeof parsed[0] === 'string' ? parsed[0] : undefined,
        waiting: typeof parsed[1] === 'string' ? parsed[1] : undefined,
        meal: typeof parsed[2] === 'string' ? parsed[2] : undefined,
        notes: typeof parsed[3] === 'string' ? parsed[3] : undefined,
      }
    }
  } catch {
    /* ignore */
  }
  return {}
}

function sessionsFromDesiredEducationDate(
  label: string | undefined
): ParticipatingSchoolSession[] | undefined {
  const text = label?.trim()
  if (!text) return undefined
  return [
    {
      round: 1,
      date: text,
      dayOfWeek: '',
      duration: '',
      format: '',
      classNum: '',
      timeRange: '',
    },
  ]
}

/**
 * ORGANIZATION_APPLICATION form_response → 기관 신청 상세 필드 hydrate.
 * 목록 DTO 필드는 유지하고 form/코멘트로 빈 칸을 채운다.
 */
export function hydrateOrganizationApplicationRowFromForm(input: {
  row: ApplicantSchoolRow
  formResponse: FormResponseResponse | null | undefined
  adminComment?: string | null
}): ApplicantSchoolRow {
  const { row, formResponse, adminComment } = input
  const map = buildFormAnswerMap(formResponse?.answers)
  const guidance = parseGuidanceRows(map)

  const textbookName = pickAnswer(map, 'textbookName')
  const educationGrade =
    pickAnswer(map, 'applicationGrade', 'grade') ?? row.educationGrade
  const region =
    pickAnswer(map, 'organizationRegion') ?? row.region
  const addressDetail =
    pickAnswer(map, 'addressDetail') ??
    pickAnswer(map, 'address', 'organizationAddress')
  const applicationReason = pickAnswer(map, 'applicationReason')
  const otherRequests = pickAnswer(map, 'otherRequests')
  const sexOffenseCheckRequest = pickAnswer(
    map,
    'program-application-institution-seed-sex-offense-consent-submission'
  )
  const desiredEducationDate = pickAnswer(
    map,
    'desiredEducationDate',
    'requestedScheduleMemo'
  )

  const detail: ApplicantInstitutionDetailExtend = {
    ...row.detail,
    ...(textbookName ? { textbookName } : {}),
    ...(addressDetail ? { addressDetail } : {}),
    ...(applicationReason ? { applicationReason } : {}),
    ...(otherRequests ? { otherRequests } : {}),
    ...(guidance.computer ? { computerInSpace: guidance.computer } : {}),
    ...(guidance.waiting
      ? { waitingPlaceGuide: guidance.waiting, waitingRoom: guidance.waiting }
      : {}),
    ...(guidance.meal ? { mealInfo: guidance.meal } : {}),
    ...(guidance.notes
      ? { otherSpecialNotes: guidance.notes, parkingInfo: guidance.notes }
      : {}),
    ...(sexOffenseCheckRequest ? { sexOffenseCheckRequest } : {}),
  }

  const sessions =
    row.sessions && row.sessions.length > 0
      ? row.sessions
      : sessionsFromDesiredEducationDate(desiredEducationDate)

  return {
    ...row,
    educationGrade: educationGrade || row.educationGrade,
    region: region || row.region,
    sessions,
    detail: Object.keys(detail).length > 0 ? detail : row.detail,
    adminComment: adminComment?.trim() || row.adminComment,
  }
}
