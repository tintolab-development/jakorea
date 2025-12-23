/**
 * 학교 Mock 데이터
 * Phase 1.4: 30개 이상의 다양한 샘플 데이터
 */

import type { School } from '../../types/domain'

function generateUUID(): string {
  return `school-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
}

function randomPastDate(daysAgo: number = 730): Date {
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

const schoolNameTemplates = [
  {
    prefix: ['서울', '부산', '대구', '인천', '광주', '대전', '울산'],
    suffix: ['초등학교', '중학교', '고등학교'],
  },
  {
    prefix: ['한국', '대한', '서울', '부산', '경기'],
    suffix: ['국제', '예술', '과학', '외국어', '체육'],
  },
  { prefix: ['중앙', '동부', '서부', '남부', '북부'], suffix: ['초등학교', '중학교', '고등학교'] },
  {
    prefix: ['청담', '반포', '잠실', '송파', '강남', '마포', '용산'],
    suffix: ['초등학교', '중학교', '고등학교'],
  },
]

const names = [
  '김민수',
  '이영희',
  '박지훈',
  '최수진',
  '정호영',
  '강미영',
  '조성민',
  '윤서연',
  '임동욱',
  '한지은',
  '오현우',
  '신유진',
  '배성호',
  '류혜진',
  '문재현',
  '송미라',
  '유태준',
  '홍지혜',
  '전동혁',
  '황수빈',
  '강민준',
  '서지영',
  '노현석',
  '엄예지',
  '양준호',
  '진소영',
  '차민규',
  '구나은',
]

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function generateSchoolName(): string {
  const template = randomElement(schoolNameTemplates)
  const prefix = randomElement(template.prefix)
  const suffix = randomElement(template.suffix)
  return `${prefix}${suffix}`
}

function generatePhone(): string {
  const areaCodes = [
    '02',
    '031',
    '032',
    '041',
    '042',
    '043',
    '044',
    '051',
    '052',
    '053',
    '054',
    '055',
    '061',
    '062',
    '063',
    '064',
  ]
  const areaCode = randomElement(areaCodes)
  const middle = Math.floor(Math.random() * 9000) + 1000
  const last = Math.floor(Math.random() * 9000) + 1000
  return `${areaCode}-${middle}-${last}`
}

function generateEmail(schoolName: string, contactPerson: string): string {
  const domains = ['school.go.kr', 'sen.go.kr', 'pen.go.kr', 'hs.kr', 'es.kr', 'ms.kr']
  const domain = randomElement(domains)
  const namePart = contactPerson.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  return `${namePart}@${schoolName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}.${domain}`
}

function generateAddress(region: string): string {
  const cities: Record<string, string[]> = {
    서울: ['강남구', '서초구', '송파구', '마포구', '용산구', '종로구'],
    경기: ['성남시', '수원시', '용인시', '고양시', '부천시', '안산시'],
    부산: ['해운대구', '부산진구', '사상구', '연제구'],
    대구: ['수성구', '달서구', '중구'],
    인천: ['남동구', '연수구', '부평구'],
  }
  const cityList = cities[region] || [region]
  const city = randomElement(cityList)
  const street = Math.floor(Math.random() * 999) + 1
  return `${region} ${city} 교육로 ${street}`
}

export const mockSchools: School[] = Array.from({ length: 30 }, () => {
  const region = randomElement(regions)
  const schoolName = generateSchoolName()
  const contactPerson = randomElement(names)
  const createdAt = randomPastDate(730)
  const hasPhone = Math.random() > 0.2
  const hasEmail = Math.random() > 0.15
  const hasAddress = Math.random() > 0.1

  return {
    id: generateUUID(),
    name: schoolName,
    region,
    address: hasAddress ? generateAddress(region) : undefined,
    contactPerson,
    contactPhone: hasPhone ? generatePhone() : undefined,
    contactEmail: hasEmail ? generateEmail(schoolName, contactPerson) : undefined,
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
  }
})

export const mockSchoolsMap = new Map(mockSchools.map(school => [school.id, school]))

