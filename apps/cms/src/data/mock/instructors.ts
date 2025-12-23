/**
 * 강사 Mock 데이터
 * Phase 1.2: 50개 이상의 다양한 샘플 데이터
 */

import type { Instructor } from '../../types/domain'

function generateUUID(): string {
  return `instructor-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
}

function randomPastDate(daysAgo: number = 365): Date {
  const now = Date.now()
  const randomTime = now - Math.random() * daysAgo * 24 * 60 * 60 * 1000
  return new Date(randomTime)
}

const regions = [
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '광주',
  '대전',
  '울산',
  '세종',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
]

const specialties = [
  'AI/머신러닝',
  '데이터 분석',
  '웹 개발',
  '모바일 개발',
  '디자인',
  '마케팅',
  '비즈니스',
  '언어/문학',
  '수학',
  '과학',
  '예술',
  '음악',
  '체육',
  '진로/진학',
  '창의성',
  '리더십',
  '커뮤니케이션',
  '기업가정신',
]

const firstNames = [
  '김',
  '이',
  '박',
  '최',
  '정',
  '강',
  '조',
  '윤',
  '장',
  '임',
  '한',
  '오',
  '서',
  '신',
  '권',
  '황',
  '안',
  '송',
  '유',
  '홍',
]

const lastNames = [
  '민준',
  '서준',
  '도윤',
  '예준',
  '시우',
  '하준',
  '주원',
  '지호',
  '준서',
  '건우',
  '소율',
  '지우',
  '서연',
  '서윤',
  '지유',
  '채원',
  '지원',
  '예은',
  '하은',
  '윤서',
]

function generatePhone(): string {
  const middle = Math.floor(Math.random() * 9000) + 1000
  const last = Math.floor(Math.random() * 9000) + 1000
  return `010-${middle}-${last}`
}

function generateEmail(name: string): string {
  const domains = ['gmail.com', 'naver.com', 'daum.net', 'kakao.com', 'company.co.kr']
  const domain = domains[Math.floor(Math.random() * domains.length)]
  const id = name.toLowerCase().replace(/\s/g, '')
  return `${id}@${domain}`
}

function randomSpecialties(): string[] {
  const count = Math.floor(Math.random() * 3) + 1
  const shuffled = [...specialties].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function randomRating(): number {
  return Math.round((Math.random() * 2 + 3) * 10) / 10
}

export const mockInstructors: Instructor[] = Array.from({ length: 50 }, () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  const fullName = `${firstName}${lastName}`
  const region = regions[Math.floor(Math.random() * regions.length)]
  const instructorSpecialties = randomSpecialties()
  const createdAt = randomPastDate(730)
  const updatedAt = new Date(
    createdAt.getTime() + Math.random() * (Date.now() - createdAt.getTime())
  )

  return {
    id: generateUUID(),
    name: fullName,
    contactPhone: Math.random() > 0.1 ? generatePhone() : undefined,
    contactEmail: Math.random() > 0.15 ? generateEmail(fullName) : undefined,
    region,
    specialty: instructorSpecialties,
    availableTime: Math.random() > 0.3 ? '평일 오전, 주말 가능' : undefined,
    experience:
      Math.random() > 0.2
        ? `${Math.floor(Math.random() * 15) + 2}년 경력, ${Math.floor(Math.random() * 20) + 5}개 프로젝트 완료`
        : undefined,
    rating: Math.random() > 0.25 ? randomRating() : undefined,
    bankAccount:
      Math.random() > 0.3 ? `110-***-${Math.floor(Math.random() * 900000) + 100000}` : undefined,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  }
})

export const mockInstructorsMap = new Map(
  mockInstructors.map(instructor => [instructor.id, instructor])
)



