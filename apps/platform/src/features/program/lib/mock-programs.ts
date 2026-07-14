import illustBookUrl from '@/shared/assets/illustration/illust-book.svg'
import illustFlagUrl from '@/shared/assets/illustration/illust-flag.svg'
import illustPeopleUrl from '@/shared/assets/illustration/illust-people.svg'
import type { ProgramDetail, ProgramListItem } from '../model/types'

const MOCK_PROGRAMS: ProgramDetail[] = [
  {
    id: 'job-talk-2026',
    category: 'youth',
    categoryLabel: '청소년·청년',
    title: '2026 한국씨티은행 - JA Korea 특별한 JOB담 모집 안내',
    operatingPeriodLabel: '2026.04.03(금) – 2026.11.20(금)',
    recruitmentPeriodLabel: '2026.04.18 – 04.26',
    applicationPeriodLabel: '2026.04.18 – 04.26',
    statusTags: ['모집중', '고등학생', '온라인'],
    thumbnailUrl: illustBookUrl,
    sponsor: 'FedEx',
    summary:
      '진로 멘토링 프로그램으로, 현직자와의 만남을 통해 진로 탐색과 자기 이해를 돕습니다.',
    isRecruiting: true,
  },
  {
    id: 'citibank-job-talk',
    category: 'youth',
    categoryLabel: '청소년·청년',
    title: '2026 한국씨티은행 - JA Korea 특별한 JOB-Talk 모집 공고',
    operatingPeriodLabel: '2026.05.15(금) – 2026.06.15(일)',
    recruitmentPeriodLabel: '2026.05.15 – 06.15',
    applicationPeriodLabel: '2026.05.15 – 06.15',
    statusTags: ['모집중', '고등학생', '오프라인'],
    thumbnailUrl: illustFlagUrl,
    sponsor: '한국씨티은행',
    summary: '현직자 멘토와 함께하는 직업 탐색 프로그램입니다.',
    isRecruiting: true,
  },
  {
    id: 'school-partnership',
    category: 'institution',
    categoryLabel: '기관',
    title: '2026 JA Korea 학교 파트너십 프로그램',
    operatingPeriodLabel: '2026.03.01(일) – 2026.12.31(목)',
    recruitmentPeriodLabel: '2026.02.01 – 03.31',
    applicationPeriodLabel: '2026.02.01 – 03.31',
    statusTags: ['모집중', '학교', '혼합'],
    thumbnailUrl: illustPeopleUrl,
    sponsor: 'JA Korea',
    summary: '학교 단위로 참여하는 경제·진로 교육 프로그램입니다.',
    isRecruiting: true,
  },
  {
    id: 'instructor-recruitment',
    category: 'instructor',
    categoryLabel: '강사',
    title: '2026 JA Korea 강사 모집',
    operatingPeriodLabel: '2026.01.01(수) – 2026.12.31(목)',
    recruitmentPeriodLabel: '2026.01.01 – 12.31',
    applicationPeriodLabel: '2026.01.01 – 12.31',
    statusTags: ['모집중', '강사', '오프라인'],
    thumbnailUrl: illustBookUrl,
    sponsor: 'JA Korea',
    summary: 'JA Korea 교육 프로그램을 함께 이끌어갈 강사를 모집합니다.',
    isRecruiting: true,
  },
]

export function getMockPrograms(): ProgramListItem[] {
  return MOCK_PROGRAMS
}

export function getMockProgramById(id: string): ProgramDetail | undefined {
  return MOCK_PROGRAMS.find(program => program.id === id)
}
