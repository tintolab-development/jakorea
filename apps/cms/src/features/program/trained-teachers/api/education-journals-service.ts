import type { TrainedTeachersEducationJournalEntry } from '@/data/mock/trained-teachers-institution-detail'
import { getTrainedTeachersEducationJournals } from '@/data/mock/trained-teachers-institution-detail'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
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
    '교육받은 교사 교육일지 API가 활성화되지 않았습니다. VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED(또는 trainedTeacherPrograms)와 programs 모듈을 확인해 주세요.'
  )
}

function triggerBlobDownload(fileName: string, blob: Blob): void {
  const objectUrl = URL.createObjectURL(blob)
  try {
    downloadFile(fileName, objectUrl)
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000)
  }
}

async function downloadFromEndpoint(fileName: string, endpoint?: string): Promise<void> {
  if (!endpoint?.trim()) {
    downloadFile(fileName)
    return
  }
  try {
    const blob = await fetchTrainedTeacherEducationJournalFileBlob(endpoint)
    triggerBlobDownload(fileName, blob)
  } catch {
    downloadFile(fileName, endpoint)
  }
}

export async function listTrainedTeacherEducationJournals(
  programId: string,
  organizationApplicationId: string
): Promise<TrainedTeachersEducationJournalEntry[]> {
  if (!shouldUseTrainedTeacherProgramsRemoteApi()) {
    return getTrainedTeachersEducationJournals(organizationApplicationId)
  }
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

export async function downloadTrainedTeacherEducationJournal(
  programId: string,
  entry: TrainedTeachersEducationJournalEntry
): Promise<void> {
  if (!shouldUseTrainedTeacherProgramsRemoteApi()) {
    downloadFile(entry.fileName, entry.fileUrl)
    return
  }
  assertRemoteReady()
  const meta = await fetchTrainedTeacherEducationJournalDownloadRemote(programId, entry.id)
  await downloadFromEndpoint(entry.fileName, meta.downloadEndpoint)
}

export async function bulkDownloadTrainedTeacherEducationJournals(
  programId: string,
  organizationApplicationId: string,
  entries: TrainedTeachersEducationJournalEntry[]
): Promise<void> {
  if (!shouldUseTrainedTeacherProgramsRemoteApi()) {
    for (const entry of entries) {
      downloadFile(entry.fileName, entry.fileUrl)
    }
    return
  }
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
  return {
    id: row.id,
    no: index + 1,
    schoolName: row.schoolName,
    region: row.region || '',
    educationGrade: row.educationGrade || '',
    classCount: row.classCount,
    studentCount: row.studentCount,
    lectureRound: '',
    textbookStatus: 'not_applicable',
    approvalStatus: 'approved',
    teacherName: row.teacherName || '-',
    instructors: '',
    programId: row.programId,
    sessions: row.sessions,
  }
}

export async function listTrainedTeacherParticipatingInstitutions(
  programId: string
): Promise<ParticipatingSchoolRow[]> {
  if (!shouldUseTrainedTeacherProgramsRemoteApi()) {
    const { getParticipatingSchoolsForProgram } = await import(
      '@/data/mock/participating-schools'
    )
    return getParticipatingSchoolsForProgram(programId)
  }
  const applications = await listTrainedTeacherOrganizationApplications(programId)
  return applications
    .filter(row => row.approvalStatus === 'approved')
    .map((row, index) => mapApplicantSchoolToParticipatingSchool(row, index))
}
