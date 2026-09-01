import { GEMINI_APPROVED_TRAINING_MOCK_ROWS } from './mock'
import type { GeminiInstructorApplicationRow } from './instructor-application-types'

const STATUS_SAMPLES: Array<{
  instructorName: string
  experienceYears: number
  grade: string
  monthlyAssignmentCount: number
  no: number
}> = [
  {
    instructorName: '김틴토',
    experienceYears: 1,
    grade: 'A등급',
    monthlyAssignmentCount: 10,
    no: 3,
  },
  {
    instructorName: '이틴토',
    experienceYears: 5,
    grade: 'B등급',
    monthlyAssignmentCount: 3,
    no: 2,
  },
  {
    instructorName: '박틴토',
    experienceYears: 3,
    grade: 'C등급',
    monthlyAssignmentCount: 7,
    no: 1,
  },
]

function buildRowsForTraining(approvedTrainingId: string): GeminiInstructorApplicationRow[] {
  return STATUS_SAMPLES.map((sample, index) => ({
    id: `${approvedTrainingId}-gia-${index + 1}`,
    approvedTrainingId,
    no: sample.no,
    instructorName: sample.instructorName,
    homeSido: '서울특별시',
    homeSigungu: '강서구',
    experienceYears: sample.experienceYears,
    grade: sample.grade,
    contact: '010-****-0000',
    email: 'ti***@naver.com',
    monthlyAssignmentCount: sample.monthlyAssignmentCount,
    approvalStatus: 'PENDING',
  }))
}

const ROWS_BY_TRAINING_ID = new Map<string, GeminiInstructorApplicationRow[]>(
  GEMINI_APPROVED_TRAINING_MOCK_ROWS.map(row => [row.id, buildRowsForTraining(row.id)])
)

export function getGeminiInstructorApplicationRows(
  approvedTrainingId: string
): GeminiInstructorApplicationRow[] {
  return ROWS_BY_TRAINING_ID.get(approvedTrainingId) ?? buildRowsForTraining(approvedTrainingId)
}
