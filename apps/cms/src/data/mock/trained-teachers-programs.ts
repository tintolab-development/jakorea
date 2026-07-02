import type { Program } from '@/types/domain'
import { getCompanySchoolPrograms } from './economy-programs'
import { readTrainedTeachersRegistrationLocalSavePrograms } from '@/features/program/general/lib/registration-local-save'

const TRAINED_TEACHERS_TITLES = [
  '2026년 신한은행 - JA Korea 청소년 경제금융교육프로그램',
  '2026 SAP-함께 성장하니JA! 하계 고등학생 모집 안내',
  '2026 JA Korea 초등 교사 경제교육 직무연수',
  '2026 JA Korea 중등 교사 디지털 금융교육 연수',
  '2026 JA Korea 교사 경제교육 심화 과정',
  '2026 JA Korea 학교 금융교육 리더 교사 과정',
  '2026 JA Korea 진로·경제교육 교사 워크숍',
  '2026 JA Korea 교육받은 교사 프로그램 성과 공유회',
] as const

let trainedTeachersProgramsCache: Program[] | null = null

function toTrainedTeachersProgram(base: Program, index: number): Program {
  const id = `trained-teachers-prog-${String(index + 1).padStart(3, '0')}`
  const title = TRAINED_TEACHERS_TITLES[index % TRAINED_TEACHERS_TITLES.length]
  const capacity = base.rounds[0]?.capacity ?? 30

  return {
    ...base,
    id,
    title,
    mainTitle: title,
    description: title,
    category: 'school',
    targetLevel: base.targetLevel ?? 'elementary',
    approvedStudentCount: base.approvedStudentCount ?? 0,
    instructors: undefined,
    instructorCapacity: undefined,
    educatedTeachers: base.educatedTeachers ?? base.approvedStudentCount ?? 0,
    generalParticipantTypes: ['school_institution'],
    generalCommonInfo: {
      ...base.generalCommonInfo,
      kpi: {
        finalParticipants: base.generalCommonInfo?.kpi?.finalParticipants ?? capacity,
        instructorCount: 0,
        volunteerCount: 0,
        finalSchools: base.generalCommonInfo?.kpi?.finalSchools ?? 10,
        finalClasses: base.generalCommonInfo?.kpi?.finalClasses ?? 30,
      },
      participantRecruitmentInfo: {
        ...base.generalCommonInfo?.participantRecruitmentInfo,
        preEducationNoticeRequired: true,
        maxAssignableInstructors: undefined,
      },
    },
    rounds: base.rounds.map(round => ({
      ...round,
      id: `${id}-round-${round.roundNumber}`,
      programId: id,
    })),
    posterImage: `https://picsum.photos/seed/${id}/400/300`,
    keyVisualImage: `https://picsum.photos/seed/${id}/400/300`,
  }
}

export function getTrainedTeachersPrograms(): Program[] {
  if (trainedTeachersProgramsCache == null) {
    trainedTeachersProgramsCache = getCompanySchoolPrograms().map(toTrainedTeachersProgram)
  }

  const localPrograms = readTrainedTeachersRegistrationLocalSavePrograms().filter(
    localProgram => !trainedTeachersProgramsCache?.some(program => program.id === localProgram.id)
  )

  return [...trainedTeachersProgramsCache, ...localPrograms]
}

export function getTrainedTeachersProgramById(id: string): Program | undefined {
  return getTrainedTeachersPrograms().find(program => program.id === id)
}

export function invalidateTrainedTeachersProgramsCache() {
  trainedTeachersProgramsCache = null
}
