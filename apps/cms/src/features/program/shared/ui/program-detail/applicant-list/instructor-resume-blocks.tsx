/**
 * 강사 이력서 — 학력/경력/자격 카드 본문 (신청 강사 상세·회원 상세 공용)
 */

import type {
  ApplicantInstructorRow,
  ApplicantInstructorCareerDetail,
  ApplicantInstructorEducationItem,
} from '@/data/mock/applicant-instructors'
import {
  formatInstructorEducationLevelDisplay,
  isInstructorMaskedPlaceholder,
} from '@/features/user/api/map-instructor-activity-display'
import { ProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import './applicant-instructor-resume.css'

export const INSTRUCTOR_RESUME_NO_DATA = '데이터 없음'
/** 카드 본문·필드 빈 값 표시 */
export const INSTRUCTOR_RESUME_EMPTY_DISPLAY = '-'

function InstructorResumeEmptyCardBody() {
  return <p className="instructor-resume-empty">{INSTRUCTOR_RESUME_EMPTY_DISPLAY}</p>
}

const EDUCATION_TYPE_PRIORITY: Record<string, number> = {
  graduate: 4,
  college4: 3,
  college23: 2,
  high: 1,
  대학원: 4,
  '대학교 4년제': 3,
  '대학 4년제': 3,
  '4년제 졸업': 3,
  '4년제 휴학': 3,
  '4년제 중퇴': 3,
  '대학교 2·3년제': 2,
  '대학교 2, 3년제': 2,
  '대학 2・3년제': 2,
  '2년제 졸업': 2,
  고등학교: 1,
  '고등학교 졸업': 1,
}

function educationTypePriority(schoolType: string | undefined): number {
  const raw = schoolType?.trim()
  if (!raw) return -1
  if (raw in EDUCATION_TYPE_PRIORITY) return EDUCATION_TYPE_PRIORITY[raw]!
  const mapped = getEducationLevelBadge(undefined, raw)
  return EDUCATION_TYPE_PRIORITY[mapped] ?? -1
}

/** educations 배열에서 최종(최고) 학력 1건 */
export function resolveFinalEducationItem(
  d: ApplicantInstructorRow
): ApplicantInstructorEducationItem | null {
  const items = d.educations ?? []
  if (items.length === 0) return null

  let best: ApplicantInstructorEducationItem | null = null
  let bestPriority = -1
  for (const item of items) {
    const priority = educationTypePriority(item.schoolType)
    const effectivePriority = item.schoolName?.trim() ? Math.max(priority, 0) : priority
    if (effectivePriority >= bestPriority) {
      best = item
      bestPriority = effectivePriority
    }
  }
  return best
}

function resolveFinalSchoolName(
  d: ApplicantInstructorRow,
  finalItem?: ApplicantInstructorEducationItem | null
): string | undefined {
  const fromItem = finalItem?.schoolName?.trim()
  if (fromItem && !isInstructorMaskedPlaceholder(fromItem)) return fromItem

  const fromField = d.educationSchoolName?.trim()
  if (fromField && fromField !== '-' && !isInstructorMaskedPlaceholder(fromField)) {
    return fromField
  }
  return undefined
}

/** 학교 구분만 — 졸업·재학 등 상태 제외 */
export function getEducationSchoolTypeLabel(
  educationLevel?: string,
  schoolType?: string
): string {
  if (schoolType?.trim()) {
    return getEducationLevelBadge(undefined, schoolType.trim())
  }
  const raw = educationLevel?.trim()
  if (!raw) return '-'
  const display = formatInstructorEducationLevelDisplay(raw) ?? raw
  const [typePart] = display.split(/\s*\/\s*/)
  const normalized = typePart?.trim() || display.trim()
  return getEducationLevelBadge(normalized) || normalized || '-'
}

export type FinalEducationDisplay = {
  period?: string
  schoolName: string
  major?: string
}

/** 학력 카드 — 최종 학교 1행 (학교명·기간·전공, 상태 미노출) */
export function resolveFinalEducationDisplay(d: ApplicantInstructorRow): FinalEducationDisplay | null {
  const final = resolveFinalEducationItem(d)
  const schoolName = resolveFinalSchoolName(d, final)
  if (!schoolName) return null

  const period = final ? formatEducationPeriod(final) : undefined
  const periodDisplay = period && period !== '-' ? period : undefined
  const major = final?.major?.trim()

  return {
    ...(periodDisplay ? { period: periodDisplay } : {}),
    schoolName,
    ...(major ? { major } : {}),
  }
}

export function getEducationLevelBadge(educationLevel?: string, schoolType?: string): string {
  const raw = schoolType ?? educationLevel ?? ''
  const map: Record<string, string> = {
    '4년제 졸업': '대학교 4년제',
    '2년제 졸업': '대학교 2년제',
    '고등학교 졸업': '고등학교',
    '4년제 휴학': '대학교 4년제',
    '4년제 중퇴': '대학교 4년제',
    대학원: '대학원',
    '대학 4년제': '대학교 4년제',
    '대학 2・3년제': '대학교 2·3년제',
    고등학교: '고등학교',
    중학교: '중학교',
  }
  return map[raw] || raw || '-'
}

export function formatEducationPeriod(item: ApplicantInstructorEducationItem): string {
  const start = item.enrollmentYear
  const end = item.graduationYear
  if (!start) return '-'
  if (!end) return start
  return `${start} ~ ${end}`
}

function getMonthsBetween(from: string, to: string): number {
  const [y1, m1] = from.split('.').map(Number)
  const [y2, m2] = to.split('.').map(Number)
  return (y2 - y1) * 12 + (m2 - m1)
}

export function formatCareerPeriod(item: ApplicantInstructorCareerDetail): string {
  const start = item.startDate
  if (!start) return '-'
  if (item.isCurrent) return `${start} ~ 재직중`
  const end = item.endDate
  if (!end) return start
  const months = getMonthsBetween(start, end)
  const years = Math.floor(months / 12)
  const yearLabel = years >= 1 ? `(${years}년)` : ''
  return `${start} ~ ${end}${yearLabel}`
}

export function getTotalCareerYears(items: ApplicantInstructorCareerDetail[] | undefined): number {
  if (!items?.length) return 0
  const today = new Date()
  let totalMonths = 0
  for (const item of items) {
    const start = item.startDate
    if (!start) continue
    const [y1, m1] = start.split('.').map(Number)
    const end = item.isCurrent
      ? { year: today.getFullYear(), month: today.getMonth() + 1 }
      : item.endDate
        ? (() => {
            const [y2, m2] = item.endDate!.split('.').map(Number)
            return { year: y2, month: m2 }
          })()
        : null
    if (!end) continue
    totalMonths += (end.year - y1) * 12 + (end.month - m1)
  }
  return Math.floor(totalMonths / 12)
}

export function instructorEducationSectionDescription(d: ApplicantInstructorRow): string {
  const final = resolveFinalEducationItem(d)
  const schoolTypeLabel = getEducationSchoolTypeLabel(d.educationLevel, final?.schoolType)
  const hasEducation =
    resolveFinalSchoolName(d, final) != null ||
    final?.schoolType != null ||
    Boolean(d.educationLevel?.trim())
  return hasEducation ? schoolTypeLabel : ''
}

export function instructorCareerSectionDescription(d: ApplicantInstructorRow): string {
  if (d.instructorCareerLevel === 'new') return '신입'
  const totalCareerYears = getTotalCareerYears(d.careerDetails)
  if ((d.careerDetails?.length ?? 0) > 0) return `${totalCareerYears}년`
  return ''
}

export function instructorQualificationsSectionDescription(d: ApplicantInstructorRow): string {
  return (d.qualifications?.length ?? 0) > 0 ? `${d.qualifications?.length}개` : ''
}

export function instructorAwardsSectionDescription(d: ApplicantInstructorRow): string {
  const n = d.awards?.length ?? 0
  return n > 0 ? `${n}개` : ''
}

export function InstructorResumeEducationCardBody({ d }: { d: ApplicantInstructorRow }) {
  const items = (d.educations ?? []).filter(item => item.schoolName?.trim() || item.schoolType?.trim())

  if (items.length > 1) {
    return (
      <div className="instructor-resume-card">
        {items.map((item, idx) => {
          const period = formatEducationPeriod(item)
          const schoolName = item.schoolName?.trim()
          return (
            <div key={idx} className="instructor-resume-row instructor-resume-row--career">
              <span className="instructor-resume-row-left">{period !== '-' ? period : '-'}</span>
              <span className="instructor-resume-row-right instructor-resume-row-right--with-divider">
                {schoolName ? (
                  <>
                    <span className="instructor-resume-emphasis">{schoolName}</span>
                    {item.major ? (
                      <>
                        <ProgramDetailTdDivider />
                        <span className="instructor-resume-role">{item.major}</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  item.schoolType ?? INSTRUCTOR_RESUME_EMPTY_DISPLAY
                )}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  const display = resolveFinalEducationDisplay(d)

  return (
    <div className="instructor-resume-card">
      {display ? (
        <div className="instructor-resume-row instructor-resume-row--career">
          <span className="instructor-resume-row-left">{display.period ?? '-'}</span>
          <span className="instructor-resume-row-right instructor-resume-row-right--with-divider">
            <span className="instructor-resume-emphasis">{display.schoolName}</span>
            {display.major ? (
              <>
                <ProgramDetailTdDivider />
                <span className="instructor-resume-role">{display.major}</span>
              </>
            ) : null}
          </span>
        </div>
      ) : (
        <InstructorResumeEmptyCardBody />
      )}
    </div>
  )
}

export function InstructorResumeCareerCardBody({ d }: { d: ApplicantInstructorRow }) {
  return (
    <div className="instructor-resume-card">
      {(d.careerDetails?.length ?? 0) > 0 ? (
        d.careerDetails?.map((item, idx) => {
          const period = formatCareerPeriod(item)
          const isSingleYear = !period.includes(' ~ ')
          return (
            <div key={idx} className="instructor-resume-row instructor-resume-row--career">
              <span
                className={`instructor-resume-row-left ${isSingleYear ? 'instructor-resume-row-left--single-year' : ''}`}
              >
                {period}
              </span>
              <span className="instructor-resume-row-right instructor-resume-row-right--with-divider">
                {item.companyName || item.role ? (
                  <>
                    {item.companyName && (
                      <span className="instructor-resume-emphasis">{item.companyName}</span>
                    )}
                    {item.companyName && item.role ? <ProgramDetailTdDivider /> : null}
                    {item.role != null && item.role !== '' ? (
                      <span className="instructor-resume-role">{item.role}</span>
                    ) : null}
                  </>
                ) : (
                  INSTRUCTOR_RESUME_EMPTY_DISPLAY
                )}
              </span>
            </div>
          )
        })
      ) : (
        <InstructorResumeEmptyCardBody />
      )}
    </div>
  )
}

export function InstructorResumeQualificationsCardBody({ d }: { d: ApplicantInstructorRow }) {
  return (
    <div className="instructor-resume-card">
      {(d.qualifications?.length ?? 0) > 0 ? (
        d.qualifications?.map((item, idx) => (
          <div key={idx} className="instructor-resume-row">
            <span className="instructor-resume-row-left">
              {item.year ?? INSTRUCTOR_RESUME_EMPTY_DISPLAY}
            </span>
            <span className="instructor-resume-row-right instructor-resume-row-right--black">
              {item.name ?? INSTRUCTOR_RESUME_EMPTY_DISPLAY}
            </span>
          </div>
        ))
      ) : (
        <InstructorResumeEmptyCardBody />
      )}
    </div>
  )
}

export function InstructorResumeAwardsCardBody({ d }: { d: ApplicantInstructorRow }) {
  return (
    <div className="instructor-resume-card">
      {(d.awards?.length ?? 0) > 0 ? (
        d.awards?.map((item, idx) => (
          <div key={idx} className="instructor-resume-row">
            <span className="instructor-resume-row-left">
              {item.year ?? INSTRUCTOR_RESUME_EMPTY_DISPLAY}
            </span>
            <span className="instructor-resume-row-right instructor-resume-row-right--black">
              {item.name ?? INSTRUCTOR_RESUME_EMPTY_DISPLAY}
            </span>
          </div>
        ))
      ) : (
        <InstructorResumeEmptyCardBody />
      )}
    </div>
  )
}

const INSTRUCTOR_FREE_WRITING_SECTIONS: ReadonlyArray<{
  title: string
  getContent: (d: ApplicantInstructorRow) => string | undefined
}> = [
  { title: '1. 자기소개 및 지원동기', getContent: row => row.freeWriting1 },
  {
    title: '2. 청소년 경제 교육의 중요성에 대해 본인의 생각을 구체적으로 작성해주세요.',
    getContent: row => row.freeWriting2,
  },
  {
    title:
      '3. 청소년과 소통할 때 가장 중요하다고 생각하는 점은 무엇이며, 이를 실천하기 위해 어떤 노력을 하는지 작성해주세요.',
    getContent: row => row.freeWriting3,
  },
  {
    title:
      '4. 교육 중 예기치 않은 상황(예: 수업 분위기 저하, 참여도 부족 등)이 발생했을 때 대처한 사례가 있다면 공유해주세요.',
    getContent: row => row.freeWriting4,
  },
]

export function InstructorResumeFreeWritingSections({ d }: { d: ApplicantInstructorRow }) {
  return (
    <div className="instructor-resume-free-writing-stack">
      {INSTRUCTOR_FREE_WRITING_SECTIONS.map((spec, idx) => {
        const raw = spec.getContent(d)
        const text = raw != null && String(raw).trim() !== '' ? raw : INSTRUCTOR_RESUME_NO_DATA
        return (
          <section
            key={idx}
            className="instructor-resume-section instructor-resume-section--free-writing"
          >
            <div className="info-section-title">{spec.title}</div>
            <div className="instructor-resume-free-writing-card">
              <p className="instructor-resume-free-writing-text">{text}</p>
            </div>
          </section>
        )
      })}
    </div>
  )
}
