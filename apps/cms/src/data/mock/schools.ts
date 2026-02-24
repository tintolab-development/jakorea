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

const fixedSchools: School[] = [
  { id: 'school-fixed-01', name: '서울초등학교', region: '서울', address: '서울특별시 마포구 월드컵북로 456', contactPerson: '김민수', contactPhone: '02-1234-5678', contactEmail: 'contact@seoul-es.school.go.kr', createdAt: '2024-06-15T00:00:00.000Z', updatedAt: '2024-06-15T00:00:00.000Z' },
  { id: 'school-fixed-02', name: '부산중학교', region: '부산', address: '부산광역시 해운대구 센텀중앙로 123', contactPerson: '이영희', contactPhone: '051-2345-6789', contactEmail: 'contact@busan-ms.school.go.kr', createdAt: '2025-01-10T00:00:00.000Z', updatedAt: '2025-01-10T00:00:00.000Z' },
  { id: 'school-fixed-03', name: '대구고등학교', region: '대구', address: '대구광역시 수성구 범어천로 789', contactPerson: '박지훈', contactPhone: '053-3456-7890', contactEmail: 'contact@daegu-hs.school.go.kr', createdAt: '2025-07-20T00:00:00.000Z', updatedAt: '2025-07-20T00:00:00.000Z' },
  { id: 'school-fixed-04', name: '인천남중학교', region: '인천', address: '인천광역시 남동구 구월로 112', contactPerson: '최수진', contactPhone: '032-4567-8901', contactEmail: 'contact@incheon-ms.school.go.kr', createdAt: '2024-10-01T00:00:00.000Z', updatedAt: '2024-10-01T00:00:00.000Z' },
  { id: 'school-fixed-05', name: '광주동초등학교', region: '광주', address: '광주광역시 동구 금남로 88', contactPerson: '정호영', contactPhone: '062-5678-9012', contactEmail: 'contact@gwangju-es.school.go.kr', createdAt: '2025-03-15T00:00:00.000Z', updatedAt: '2025-03-15T00:00:00.000Z' },
  { id: 'school-fixed-06', name: '대전중앙고등학교', region: '대전', address: '대전광역시 중구 대종로 200', contactPerson: '강미영', contactPhone: '042-6789-0123', contactEmail: 'contact@daejeon-hs.school.go.kr', createdAt: '2024-04-20T00:00:00.000Z', updatedAt: '2024-04-20T00:00:00.000Z' },
  { id: 'school-fixed-07', name: '울산북초등학교', region: '울산', address: '울산광역시 북구 산업로 55', contactPerson: '조성민', contactPhone: '052-7890-1234', contactEmail: 'contact@ulsan-es.school.go.kr', createdAt: '2025-06-01T00:00:00.000Z', updatedAt: '2025-06-01T00:00:00.000Z' },
  { id: 'school-fixed-08', name: '수원중학교', region: '경기', address: '경기도 수원시 팔달구 인계로 77', contactPerson: '윤서연', contactPhone: '031-8901-2345', contactEmail: 'contact@suwon-ms.school.go.kr', createdAt: '2024-02-10T00:00:00.000Z', updatedAt: '2024-02-10T00:00:00.000Z' },
  { id: 'school-fixed-09', name: '강릉고등학교', region: '강원', address: '강원도 강릉시 경강로 150', contactPerson: '임동욱', contactPhone: '033-9012-3456', contactEmail: 'contact@gangneung-hs.school.go.kr', createdAt: '2025-04-05T00:00:00.000Z', updatedAt: '2025-04-05T00:00:00.000Z' },
  { id: 'school-fixed-10', name: '제주서초등학교', region: '제주', address: '제주특별자치도 제주시 연동로 33', contactPerson: '한지은', contactPhone: '064-0123-4567', contactEmail: 'contact@jeju-es.school.go.kr', createdAt: '2025-05-15T00:00:00.000Z', updatedAt: '2025-05-15T00:00:00.000Z' },
  { id: 'school-fixed-11', name: '서울영등포중학교', region: '서울', address: '서울특별시 영등포구 당산로 44', contactPerson: '오현우', contactPhone: '02-2345-6789', contactEmail: 'contact@ydp-ms.school.go.kr', createdAt: '2025-08-20T00:00:00.000Z', updatedAt: '2025-08-20T00:00:00.000Z' },
  { id: 'school-fixed-12', name: '부산해운대고등학교', region: '부산', address: '부산광역시 해운대구 좌동순환로 99', contactPerson: '신유진', contactPhone: '051-3456-7890', contactEmail: 'contact@haeundae-hs.school.go.kr', createdAt: '2025-02-28T00:00:00.000Z', updatedAt: '2025-02-28T00:00:00.000Z' },
]

const randomSchools: School[] = Array.from({ length: 18 }, () => {
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

export const mockSchools: School[] = [...fixedSchools, ...randomSchools]

export const mockSchoolsMap = new Map(mockSchools.map(school => [school.id, school]))



