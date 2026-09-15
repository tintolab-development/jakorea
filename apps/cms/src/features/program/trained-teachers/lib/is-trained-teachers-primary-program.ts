/**
 * Backend local demo — 교육받은 교사 Primary 8 Case SoT (186001–186008).
 * BE: LocalDemoTrainedTeacherPrimaryCasesSeedContributor
 * @see docs/api/trained-teacher-primary-case-fe-adapter-2026-09-15.md
 */

export const TRAINED_TEACHER_PRIMARY_PROGRAM_IDS = [
  '186001',
  '186002',
  '186003',
  '186004',
  '186005',
  '186006',
  '186007',
  '186008',
] as const

export type TrainedTeacherPrimaryProgramId =
  (typeof TRAINED_TEACHER_PRIMARY_PROGRAM_IDS)[number]

export const TRAINED_TEACHER_PRIMARY_CASE_UUIDS = [
  'trained-teacher-primary-case-01',
  'trained-teacher-primary-case-02',
  'trained-teacher-primary-case-03',
  'trained-teacher-primary-case-04',
  'trained-teacher-primary-case-05',
  'trained-teacher-primary-case-06',
  'trained-teacher-primary-case-07',
  'trained-teacher-primary-case-08',
] as const

export const TRAINED_TEACHER_PRIMARY_PROGRAM_CODES = [
  'LOCAL-TRAINED-TEACHER-PRIMARY-01',
  'LOCAL-TRAINED-TEACHER-PRIMARY-02',
  'LOCAL-TRAINED-TEACHER-PRIMARY-03',
  'LOCAL-TRAINED-TEACHER-PRIMARY-04',
  'LOCAL-TRAINED-TEACHER-PRIMARY-05',
  'LOCAL-TRAINED-TEACHER-PRIMARY-06',
  'LOCAL-TRAINED-TEACHER-PRIMARY-07',
  'LOCAL-TRAINED-TEACHER-PRIMARY-08',
] as const

/** Notion QA case code (TCH-01…08) */
export type TrainedTeacherPrimaryCaseCode =
  | 'TCH-01'
  | 'TCH-02'
  | 'TCH-03'
  | 'TCH-04'
  | 'TCH-05'
  | 'TCH-06'
  | 'TCH-07'
  | 'TCH-08'

export type TrainedTeacherPrimaryCaseMeta = {
  caseCode: TrainedTeacherPrimaryCaseCode
  structure: 'curriculum' | 'schedule'
  sessionRound: 'single' | 'multi'
  teacherTrainingEnabled: boolean
  /** BE periodStatus 힌트 (목록 fallback) */
  periodStatus: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
}

export const TRAINED_TEACHER_PRIMARY_CASE_BY_ID: Record<
  TrainedTeacherPrimaryProgramId,
  TrainedTeacherPrimaryCaseMeta
> = {
  '186001': {
    caseCode: 'TCH-01',
    structure: 'curriculum',
    sessionRound: 'single',
    teacherTrainingEnabled: false,
    periodStatus: 'COMPLETED',
  },
  '186002': {
    caseCode: 'TCH-02',
    structure: 'curriculum',
    sessionRound: 'single',
    teacherTrainingEnabled: true,
    periodStatus: 'IN_PROGRESS',
  },
  '186003': {
    caseCode: 'TCH-03',
    structure: 'curriculum',
    sessionRound: 'multi',
    teacherTrainingEnabled: false,
    periodStatus: 'IN_PROGRESS',
  },
  '186004': {
    caseCode: 'TCH-04',
    structure: 'curriculum',
    sessionRound: 'multi',
    teacherTrainingEnabled: true,
    periodStatus: 'COMPLETED',
  },
  '186005': {
    caseCode: 'TCH-05',
    structure: 'schedule',
    sessionRound: 'single',
    teacherTrainingEnabled: false,
    periodStatus: 'SCHEDULED',
  },
  '186006': {
    caseCode: 'TCH-06',
    structure: 'schedule',
    sessionRound: 'single',
    teacherTrainingEnabled: true,
    periodStatus: 'IN_PROGRESS',
  },
  '186007': {
    caseCode: 'TCH-07',
    structure: 'schedule',
    sessionRound: 'multi',
    teacherTrainingEnabled: false,
    periodStatus: 'IN_PROGRESS',
  },
  '186008': {
    caseCode: 'TCH-08',
    structure: 'schedule',
    sessionRound: 'multi',
    teacherTrainingEnabled: true,
    periodStatus: 'COMPLETED',
  },
}

/** 교사 연수 일정명 · IPS Prepare (디자인/BE SoT) */
export const TRAINED_TEACHER_TRAINING_SCHEDULE_NAME = '교사 연수' as const

export function isTrainedTeacherPrimaryProgramId(
  programId: string | null | undefined
): boolean {
  if (!programId) return false
  return (TRAINED_TEACHER_PRIMARY_PROGRAM_IDS as readonly string[]).includes(String(programId))
}

export function isTrainedTeacherPrimaryCaseUuid(value: string | null | undefined): boolean {
  if (!value) return false
  return (TRAINED_TEACHER_PRIMARY_CASE_UUIDS as readonly string[]).includes(String(value))
}

export function isTrainedTeacherPrimaryProgramCode(value: string | null | undefined): boolean {
  if (!value) return false
  return (TRAINED_TEACHER_PRIMARY_PROGRAM_CODES as readonly string[]).includes(String(value))
}

/** mock string id · Primary 숫자 id · uuid · 로컬 등록 prefix 판별용 */
export function looksLikeTrainedTeacherProgramId(
  programId: string | null | undefined
): boolean {
  if (!programId) return false
  const id = String(programId)
  return (
    isTrainedTeacherPrimaryProgramId(id) ||
    isTrainedTeacherPrimaryCaseUuid(id) ||
    id.startsWith('trained-teachers-prog-') ||
    id.startsWith('trained-teachers-local-') ||
    /^18600[1-8]$/.test(id)
  )
}

export function resolveTrainedTeacherPrimaryCaseMeta(
  programId: string | null | undefined
): TrainedTeacherPrimaryCaseMeta | undefined {
  if (!programId || !isTrainedTeacherPrimaryProgramId(programId)) return undefined
  return TRAINED_TEACHER_PRIMARY_CASE_BY_ID[programId as TrainedTeacherPrimaryProgramId]
}
