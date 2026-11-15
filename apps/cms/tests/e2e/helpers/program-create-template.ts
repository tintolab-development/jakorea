/**
 * 통합 E2E 빠른 경로: 화면 등록에서 실제로 성공한 `POST /api/admin/programs` 요청 본문을 템플릿으로
 * 날짜·제목만 오늘 기준으로 바꿔 API로 바로 생성한다(화면 등록 1.5~2분 → 수 초).
 *
 * 템플릿 파일은 실행 환경(QA 서버의 후원사·담당자 ID 등)에 묶여 있어 저장소에 두지 않는다.
 * `E2E_PROGRAM_CREATE_TEMPLATE=/path/to/create-payload.json` 일 때만 사용한다.
 */
import fs from 'node:fs'

type Json = Record<string, unknown>

const KST_OFFSET = '+09:00'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function kstDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

function addDays(key: string, days: number): string {
  const base = new Date(`${key}T12:00:00${KST_OFFSET}`)
  base.setUTCDate(base.getUTCDate() + days)
  return kstDateKey(base)
}

function kstStartIso(key: string) {
  return new Date(`${key}T00:00:00.000${KST_OFFSET}`).toISOString()
}

function kstEndIso(key: string) {
  return new Date(`${key}T23:59:59.999${KST_OFFSET}`).toISOString()
}

function kstAtIso(key: string, hour: number) {
  return new Date(`${key}T${pad(hour)}:00:00.000${KST_OFFSET}`).toISOString()
}

export function programCreateTemplatePath(): string | null {
  const value = process.env.E2E_PROGRAM_CREATE_TEMPLATE?.trim()
  return value ? value : null
}

/**
 * 오늘이 들어가는 운영 기간(이번 달 1일 ~ 2개월 뒤 15일)과 오늘 열려 있는 모집 기간으로 바꾼다.
 * 템플릿 안의 기존 날짜 값을 찾아 같은 역할의 새 값으로 문자열 치환하므로 serviceDetailJson 안의 사본도 함께 바뀐다.
 */
export function buildProgramCreatePayloadFromTemplate(
  templatePath: string,
  title: string,
  options?: { volunteerTargets?: string[]; now?: Date }
): Json {
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8')) as Json
  const now = options?.now ?? new Date()
  const today = kstDateKey(now)
  const [year, month] = today.split('-').map(Number)
  const bizStart = `${year}-${pad(month)}-01`
  const endMonth = new Date(Date.UTC(year, month - 1 + 2, 15))
  const bizEnd = `${endMonth.getUTCFullYear()}-${pad(endMonth.getUTCMonth() + 1)}-15`
  const nextMonthFirst = (() => {
    const d = new Date(Date.UTC(year, month, 1))
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-01`
  })()
  const recruitStart = addDays(today, -2) < bizStart ? bizStart : addDays(today, -2)

  const recruitments = (template.recruitments as Json[] | undefined) ?? []
  const volunteer = recruitments.find(row => row.recruitmentType === 'VOLUNTEER')
  const interviewConfig = (volunteer?.interviewConfig ?? null) as Json | null
  const interviewRange = (interviewConfig?.interviewTimeRange as string[] | undefined) ?? []

  const replacements = new Map<string, string>()
  const put = (from: unknown, to: string) => {
    if (typeof from === 'string' && from && !replacements.has(from)) replacements.set(from, to)
  }
  put(template.businessStartDate, bizStart)
  put(template.businessEndDate, bizEnd)
  put(template.startDate, kstStartIso(bizStart))
  put(template.endDate, kstEndIso(bizEnd))
  put(template.applicationStartDate, kstStartIso(recruitStart))
  put(template.applicationEndDate, kstEndIso(bizEnd))
  for (const row of recruitments) {
    put(row.startAt, kstStartIso(recruitStart))
    put(row.endAt, kstEndIso(bizEnd))
    put(row.interviewStartAt, kstStartIso(recruitStart))
    put(row.interviewEndAt, kstEndIso(bizEnd))
    put(row.documentPassAnnouncementAt, kstStartIso(recruitStart))
    put(row.finalPassAnnouncementAt, kstStartIso(nextMonthFirst))
  }
  put(interviewRange[0], kstAtIso(today, 10))
  put(interviewRange[1], kstAtIso(today, 12))

  let text = JSON.stringify(template)
  // 긴 값(ISO 시각)부터 바꿔 짧은 날짜 키(예: 2027-01-05)가 ISO 값 일부를 먼저 깨뜨리지 않게 한다.
  const ordered = [...replacements.entries()].sort((a, b) => b[0].length - a[0].length)
  for (const [from, to] of ordered) text = text.split(from).join(to)

  // 면접 슬롯 키는 epoch ms 범위 문자열 — 면접 시작 시각 차이만큼 옮긴다.
  if (interviewRange[0]) {
    const delta = Date.parse(kstAtIso(today, 10)) - Date.parse(interviewRange[0])
    text = text.replace(/(\d{13})-(\d{13})/g, (_all, a: string, b: string) =>
      `${Number(a) + delta}-${Number(b) + delta}`
    )
  }

  const payload = JSON.parse(text) as Json
  for (const key of ['title', 'mainTitle', 'description']) {
    if (typeof payload[key] === 'string') payload[key] = title
  }
  if (Array.isArray(payload.recruitments)) {
    for (const row of payload.recruitments as Json[]) {
      if (typeof row.programDescription === 'string') row.programDescription = title
    }
  }

  // 봉사자 모집 대상: BE는 생성 시 저장된 대상과 회원 학교급을 비교한다(생성 후 PATCH로는 바뀌지 않음).
  // 테스트 계정마다 학교급이 달라 VOLUNTEER_RECRUITMENT_TARGET_MISMATCH가 나므로 모든 구분을 연다.
  const targets = options?.volunteerTargets ?? ['elementary', 'middle', 'high', 'university', 'adult']
  if (typeof payload.serviceDetailJson === 'string') {
    const detail = JSON.parse(payload.serviceDetailJson) as Json
    const visit = (node: unknown) => {
      if (!node || typeof node !== 'object') return
      const record = node as Json
      if ('recruit.volunteer.volunteerTargets' in record) {
        record['recruit.volunteer.volunteerTargets'] = targets
      }
      for (const value of Object.values(record)) visit(value)
    }
    visit(detail)
    payload.serviceDetailJson = JSON.stringify(detail)
  }
  return payload
}
