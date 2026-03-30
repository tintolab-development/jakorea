/**
 * 정산 관리 > 지급조서 확인 — 프로그램별·강사별 집계 목록 Mock
 * (화면 전용; domain PaymentStatement와 별개)
 */

export type PaymentOrderAdminProcessingStatus =
  | 'pending'
  | 'confirmed'
  | 'correction'
  | 'rejected'

export const PAYMENT_ORDER_ADMIN_STATUS_LABELS: Record<
  PaymentOrderAdminProcessingStatus,
  string
> = {
  pending: '제출 및 대기',
  confirmed: '지급조서 확인 완료',
  correction: '지급 정정 요청',
  rejected: '신청 반려',
}

export interface PaymentOrderAdminProgramRow {
  no: number
  programName: string
  instructorCount: number
  processingStatus: PaymentOrderAdminProcessingStatus
  estimatedAmount: number
  /** 필터용 기준일 (기간 필터) */
  referenceDate: string
}

export interface PaymentOrderAdminInstructorRow {
  no: number
  instructorName: string
  programCount: number
  processingStatus: PaymentOrderAdminProcessingStatus
  estimatedAmount: number
  /** 강사별 뷰에서 프로그램명 필터: 참여 프로그램명 중 하나라도 포함 시 매칭 */
  relatedProgramNames: string[]
  referenceDate: string
}

/** 지급 현황 상세 — 강사별 정산 목록 행 (집계 상태와 별도; 신청 반려 등) */
export type PaymentOrderAdminLineProcessingStatus =
  | 'pending'
  | 'confirmed'
  | 'correction'
  | 'rejected'

export const PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS: Record<
  PaymentOrderAdminLineProcessingStatus,
  string
> = {
  pending: '제출 및 대기',
  confirmed: '지급조서 확인 완료',
  correction: '지급 정정 요청',
  /** 강사 확인 후 재신청 시 신규 요청 건으로 처리되는 케이스 */
  rejected: '신청 반려',
}

export interface PaymentOrderAdminProgramDetailInstructorRow {
  id: string
  no: number
  instructorName: string
  institutionName: string
  /** 강의일 (ISO YYYY-MM-DD) */
  lectureDate: string
  sessionOrdinal: number
  processingStatus: PaymentOrderAdminLineProcessingStatus
  estimatedAmount: number
}

export interface PaymentOrderAdminProgramDetail {
  programNo: number
  programName: string
  aggregateProcessingStatus: PaymentOrderAdminProcessingStatus
  businessPeriodStart: string
  businessPeriodEnd: string
  sessionCompleted: number
  sessionTotal: number
  instructorRows: PaymentOrderAdminProgramDetailInstructorRow[]
}

/** 강사 기준 지급 현황 상세 — 프로그램별 정산 행 */
export interface PaymentOrderAdminInstructorDetailProgramRow {
  id: string
  no: number
  programName: string
  institutionName: string
  lectureDate: string
  sessionOrdinal: number
  processingStatus: PaymentOrderAdminLineProcessingStatus
  estimatedAmount: number
}

/** 강사 집계 행 기준 상세(기본 정보 + 프로그램별 정산 목록) mock 원본 */
export interface PaymentOrderAdminInstructorDetail {
  instructorNo: number
  nameKo: string
  nameEn: string
  address: string
  phone: string
  email: string
  bankName: string
  accountNumber: string
  accountHolder: string
  /** 목록 테이블과 동일한 총 정산 예정 금액 */
  totalEstimatedAmount: number
  programRows: PaymentOrderAdminInstructorDetailProgramRow[]
}

const statuses: PaymentOrderAdminProcessingStatus[] = [
  'pending',
  'confirmed',
  'correction',
  'rejected',
]

const programTitles = [
  'HSBC/HKU Business Case Competition 2026 모집 안내',
  '2026 JA Korea 대학생경제교육봉사단 UJAT 36기 모집',
  'EY한영-JA Korea Growth to Professional 2026 대학생 참가자 모집',
  '2026년 JA Korea 초등 경제교육 모집 안내',
  '2026 SAP-함께 성장하JAI 참여 고등학생 모집 안내 (IT, SW 멘토링)',
  '2026 SAP-JA Korea Global Career Discovery 원데이 취업 멘토링 대학생 참여자 모집',
  '2026년 한국씨티은행-JA Korea 특별한 JOB담 참가자 모집',
  '2026 중고등학생 금융교육 봉사단 모집',
  'JA Korea 여름방학 직업체험 캠프 참가자 모집',
  '2026 기업 멘토링 데이 — 대학생 트랙',
]

const instructorNames = [
  '김민준',
  '이서연',
  '박도윤',
  '최하은',
  '정시우',
  '강지우',
  '조예진',
  '윤준호',
  '임수아',
  '한지훈',
  '오채원',
  '신유진',
  '권태양',
  '배소율',
  '홍래원',
  '서다인',
  '문태현',
  '양가을',
  '백서준',
  '노하린',
]

const instructorNamesEn = [
  'Kim Minjun',
  'Lee Seoyeon',
  'Park Doyun',
  'Choi Haeun',
  'Jung Siu',
  'Kang Jiu',
  'Cho Yejin',
  'Yoon Junho',
  'Lim Sua',
  'Han Jihun',
  'Oh Chaewon',
  'Shin Yujin',
  'Kwon Taeyang',
  'Bae Soyul',
  'Hong Raewon',
  'Seo Dain',
  'Moon Taehyun',
  'Yang Gaeul',
  'Baek Seojun',
  'Roh Harin',
]

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** No. 내림차순(큰 번호가 위), 30건 */
export const mockPaymentOrderAdminProgramList: PaymentOrderAdminProgramRow[] = Array.from(
  { length: 30 },
  (_, i) => {
    const no = 230 - i
    const titleIdx = i % programTitles.length
    const statusIdx = i % statuses.length
    const baseDay = 15 + (i % 12)
    const month = 9 + Math.floor(i / 10)
    const m = month > 12 ? month - 12 : month
    const y = month > 12 ? 2026 : 2025
    return {
      no,
      programName: programTitles[titleIdx],
      instructorCount: 5 + ((i * 3) % 12),
      processingStatus: statuses[statusIdx],
      estimatedAmount: [2000000, 915000, 15000, 625000, 480000, 1200000][i % 6],
      referenceDate: isoDate(y, m, Math.min(baseDay, 28)),
    }
  }
)

/** 강사별 목록: 프로그램명과 교차 연결 */
export const mockPaymentOrderAdminInstructorList: PaymentOrderAdminInstructorRow[] =
  instructorNames.map((instructorName, i) => {
    const no = 120 - i
    const statusIdx = i % statuses.length
    const related = [
      programTitles[i % programTitles.length],
      programTitles[(i + 3) % programTitles.length],
    ].filter((v, j, a) => a.indexOf(v) === j)
    const baseDay = 10 + (i % 15)
    const month = 8 + Math.floor(i / 7)
    const m = month > 12 ? month - 12 : month
    const y = month > 12 ? 2026 : 2025
    return {
      no,
      instructorName,
      programCount: 1 + (i % 4),
      processingStatus: statuses[statusIdx],
      estimatedAmount: [350000, 820000, 45000, 2100000, 590000][i % 5],
      relatedProgramNames: related,
      referenceDate: isoDate(y, m, Math.min(baseDay, 28)),
    }
  })

const lineStatuses: PaymentOrderAdminLineProcessingStatus[] = [
  'rejected',
  'pending',
  'correction',
  'confirmed',
]

const institutionNames = [
  '진월초등학교',
  '서울중학교',
  '한빛고등학교',
  '대교초등학교',
  '새솔초등학교',
  '동백중학교',
  '미래고등학교',
  '푸른초등학교',
  '한울중학교',
  '늘봄초등학교',
]

function mixSeed(programNo: number, salt: number): number {
  return Math.abs((programNo * 7919 + salt * 104729) % 100000)
}

/**
 * 프로그램 집계 행 기준으로 지급 현황 상세(기본 정보 + 강사별 정산 목록) mock 생성
 */
export function getMockPaymentOrderProgramDetail(
  programRow: PaymentOrderAdminProgramRow
): PaymentOrderAdminProgramDetail {
  const n = programRow.no
  const sessionTotal = 12 + (mixSeed(n, 1) % 9)
  const sessionCompleted = 1 + (mixSeed(n, 2) % sessionTotal)
  const startDay = 5 + (mixSeed(n, 3) % 10)
  const endDay = 22 + (mixSeed(n, 4) % 9)
  const businessPeriodStart = isoDate(2025, 12, startDay)
  const businessPeriodEnd = isoDate(2026, 12, endDay)

  const rowCount = Math.min(10, Math.max(4, programRow.instructorCount))

  const instructorRows: PaymentOrderAdminProgramDetailInstructorRow[] = Array.from(
    { length: rowCount },
    (_, i) => {
      const salt = mixSeed(n, 10 + i)
      const nameIdx = (n + i) % instructorNames.length
      const instIdx = (n * 3 + i * 7) % institutionNames.length
      const day = 1 + (salt % 27)
      const month = 1 + (salt % 12)
      const year = 2025 + (salt % 2)
      return {
        id: `po-detail-${n}-${i}`,
        no: rowCount - i,
        instructorName: instructorNames[nameIdx],
        institutionName: institutionNames[instIdx],
        lectureDate: isoDate(year, month, day),
        sessionOrdinal: 1 + (salt % 8),
        processingStatus: lineStatuses[(n + i) % lineStatuses.length],
        estimatedAmount: [915000, 480000, 120000, 625000, 15000, 350000][(n + i) % 6],
      }
    }
  )

  return {
    programNo: programRow.no,
    programName: programRow.programName,
    aggregateProcessingStatus: programRow.processingStatus,
    businessPeriodStart,
    businessPeriodEnd,
    sessionCompleted,
    sessionTotal,
    instructorRows,
  }
}

/**
 * 강사 집계 행 기준으로 지급 현황 상세(기본 정보 + 프로그램별 정산 목록) mock 생성
 */
export function getMockPaymentOrderInstructorDetail(
  instructorRow: PaymentOrderAdminInstructorRow
): PaymentOrderAdminInstructorDetail {
  const n = instructorRow.no
  const nameIdx = instructorNames.indexOf(instructorRow.instructorName)
  const nameEn = nameIdx >= 0 ? instructorNamesEn[nameIdx] : `Instructor ${n}`

  const seedAddr = mixSeed(n, 501)
  const address = `서울특별시 강서구 화곡동 ${12 + (seedAddr % 80)}-${seedAddr % 40}`

  const phone = `010-${String(7000 + (n % 1000)).padStart(4, '0')}-${String(1000 + (n % 9000)).padStart(4, '0')}`
  const email =
    nameIdx >= 0
      ? `${instructorRow.instructorName.toLowerCase().replace(/\s/g, '')}${n % 100}@naver.com`
      : `user${n}@naver.com`

  const bankName = n % 3 === 0 ? '농협' : n % 3 === 1 ? '국민은행' : '신한은행'
  const accountNumber = `301-0${String(n % 10000).padStart(4, '0')}-${String(1000000 + (n % 899999))}`
  const accountHolder = instructorRow.instructorName

  const rowCount = Math.min(10, Math.max(4, instructorRow.programCount + 3))
  const related = instructorRow.relatedProgramNames

  const programRows: PaymentOrderAdminInstructorDetailProgramRow[] = Array.from(
    { length: rowCount },
    (_, i) => {
      const salt = mixSeed(n, 200 + i)
      const programName =
        i < related.length
          ? related[i]
          : programTitles[(n + i * 17) % programTitles.length]
      const instIdx = (n * 5 + i * 11) % institutionNames.length
      const day = 1 + (salt % 27)
      const month = 1 + (salt % 12)
      const year = 2025 + (salt % 2)
      const lineStatus = lineStatuses[(n + i) % lineStatuses.length]
      return {
        id: `po-inst-detail-${n}-${i}`,
        no: rowCount - i,
        programName,
        institutionName: institutionNames[instIdx],
        lectureDate: isoDate(year, month, day),
        sessionOrdinal: 1 + (salt % 8),
        processingStatus: lineStatus,
        estimatedAmount: [915000, 480000, 120000, 625000, 15000, 350000, 300000][(n + i) % 7],
      }
    }
  )

  return {
    instructorNo: n,
    nameKo: instructorRow.instructorName,
    nameEn,
    address,
    phone,
    email,
    bankName,
    accountNumber,
    accountHolder,
    totalEstimatedAmount: instructorRow.estimatedAmount,
    programRows,
  }
}
