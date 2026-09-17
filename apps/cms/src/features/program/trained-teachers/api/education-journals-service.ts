import type { TrainedTeachersEducationJournalEntry } from '@/features/program/trained-teachers/model/institution-detail'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import { downloadFile } from '@/shared/lib/file-download'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import { mapEducationJournalResponseToEntry } from './education-journals-adapters'
import {
  bulkDownloadTrainedTeacherEducationJournalsRemote,
  createTrainedTeacherEducationJournalRemote,
  fetchTrainedTeacherEducationJournalDownloadRemote,
  fetchTrainedTeacherEducationJournalFileBlob,
  fetchTrainedTeacherEducationJournalsRemote,
} from './education-journals-client'
import { listTrainedTeacherOrganizationApplications } from './organization-applications-service'
import type { EducationJournalCreateRequest } from '@/shared/api/generated/dashboard/schemas/educationJournalCreateRequest'

function assertRemoteReady(): void {
  if (shouldUseTrainedTeacherProgramsRemoteApi()) return
  throw new Error(
    '교육받은 교사 교육일지 API가 활성화되지 않았습니다. VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED(또는 trainedTeacherPrograms)와 programs 모듈을 확인해 주세요. mock 폴백은 사용하지 않습니다.'
  )
}

function triggerBlobDownload(fileName: string, blob: Blob): void {
  const objectUrl = URL.createObjectURL(blob)
  try {
    void downloadFile(fileName, objectUrl)
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000)
  }
}

async function downloadFromEndpoint(fileName: string, endpoint?: string): Promise<void> {
  if (!endpoint?.trim()) {
    void downloadFile(fileName)
    return
  }
  try {
    const blob = await fetchTrainedTeacherEducationJournalFileBlob(endpoint)
    triggerBlobDownload(fileName, blob)
  } catch {
    void downloadFile(fileName, endpoint)
  }
}

export async function listTrainedTeacherEducationJournals(
  programId: string,
  organizationApplicationId: string
): Promise<TrainedTeachersEducationJournalEntry[]> {
  assertRemoteReady()
  const items = await fetchTrainedTeacherEducationJournalsRemote(
    programId,
    organizationApplicationId
  )
  return items.map((item, index) => mapEducationJournalResponseToEntry(item, index))
}

export async function createTrainedTeacherEducationJournal(
  programId: string,
  request: EducationJournalCreateRequest
): Promise<TrainedTeachersEducationJournalEntry> {
  assertRemoteReady()
  const dto = await createTrainedTeacherEducationJournalRemote(programId, request)
  return mapEducationJournalResponseToEntry(dto, 0)
}

export async function fetchTrainedTeacherEducationJournalBlob(
  programId: string,
  entry: TrainedTeachersEducationJournalEntry
): Promise<Blob> {
  assertRemoteReady()
  const meta = await fetchTrainedTeacherEducationJournalDownloadRemote(programId, entry.id)
  const endpoint = meta.downloadEndpoint?.trim()
  if (!endpoint) {
    throw new Error('교육일지 다운로드 경로가 없습니다.')
  }
  return fetchTrainedTeacherEducationJournalFileBlob(endpoint)
}

export async function downloadTrainedTeacherEducationJournal(
  programId: string,
  entry: TrainedTeachersEducationJournalEntry
): Promise<void> {
  assertRemoteReady()
  const meta = await fetchTrainedTeacherEducationJournalDownloadRemote(programId, entry.id)
  await downloadFromEndpoint(entry.fileName, meta.downloadEndpoint)
}

export async function bulkDownloadTrainedTeacherEducationJournals(
  programId: string,
  organizationApplicationId: string,
  entries: TrainedTeachersEducationJournalEntry[]
): Promise<void> {
  assertRemoteReady()
  const journalIds = entries
    .map(entry => Number.parseInt(entry.id, 10))
    .filter(id => Number.isFinite(id))
  const response = await bulkDownloadTrainedTeacherEducationJournalsRemote(programId, {
    organizationApplicationId: Number.parseInt(organizationApplicationId, 10) || undefined,
    journalIds: journalIds.length > 0 ? journalIds : undefined,
  })
  if (response.downloadEndpoint) {
    await downloadFromEndpoint(
      `교육일지_일괄_${organizationApplicationId}.zip`,
      response.downloadEndpoint
    )
    return
  }
  for (const entry of entries) {
    await downloadTrainedTeacherEducationJournal(programId, entry)
  }
}

/** 승인된 기관 신청 → 진행 현황 참여 기관 목록 */
export function mapApplicantSchoolToParticipatingSchool(
  row: ApplicantSchoolRow,
  index: number
): ParticipatingSchoolRow {
  const completed = row.completedEducationRoundCount
  const total = row.totalEducationRoundCount
  const lectureRoundFromCounts =
    completed != null && total != null ? `${completed}/${total}` : undefined
  return {
    id: row.id,
    no: index + 1,
    schoolName: row.schoolName,
    region: row.region || '',
    educationGrade: row.educationGrade || '',
    classCount: row.classCount,
    studentCount: row.studentCount,
    lectureRound: row.lectureRound?.trim() || lectureRoundFromCounts || '',
    /** BE에 배송 원장 없음 — 교재명·수량만 표시. 배송 전/중/완료를 API로 invent 하지 않음 */
    textbookStatus: 'not_applicable',
    approvalStatus: 'approved',
    teacherName: row.teacherName || '-',
    /** TT는 강사 Relation 없음 — 합성하지 않음 */
    instructors: '',
    programId: row.programId,
    sessions: row.sessions,
    preferredScheduleBlocks: row.preferredScheduleBlocks,
    educationTarget: row.educationTarget,
    progressLabel: row.progressLabel,
    totalEducationRoundCount: row.totalEducationRoundCount,
    completedEducationRoundCount: row.completedEducationRoundCount,
    textbookName: row.textbookName,
    educationJournalCount: row.educationJournalCount,
    journalSubmitted: row.journalSubmitted,
    educationCompletionCount: row.educationCompletionCount,
  }
}

export async function listTrainedTeacherParticipatingInstitutions(
  programId: string,
  query: import('./organization-applications-list-query').TrainedTeacherOrganizationApplicationsListQuery = {}
): Promise<ParticipatingSchoolRow[]> {
  assertRemoteReady()
  const applications = await listTrainedTeacherOrganizationApplications(programId, {
    keyword: query.keyword,
    status: 'APPROVED',
  })
  return applications
    .filter(row => row.approvalStatus === 'approved')
    .map((row, index) => mapApplicantSchoolToParticipatingSchool(row, index))
}
