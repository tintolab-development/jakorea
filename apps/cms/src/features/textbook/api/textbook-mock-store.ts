import {
  normalizeEducationStages,
  summarizeEducationStages,
} from '@/features/textbook/lib/textbook-education-stages'
import type {
  TextbookCreateInput,
  TextbookEducationStage,
  TextbookRow,
} from '@/features/textbook/model/textbook.types'

type TextbookSeedRow = Omit<TextbookRow, 'textbookNameEn' | 'educationStages'>

const INITIAL_TEXTBOOK_ROWS: TextbookSeedRow[] = [
  {
    id: 'TB-109',
    businessArea: '경제금융',
    educationTarget: '초등학교',
    grade: '4학년',
    textbookName: '우리나라',
    useStatus: 'USED',
    registrant: '김민지',
    registeredAt: '2026-03-28T09:00:00',
  },
  {
    id: 'TB-110',
    businessArea: '경제금융',
    educationTarget: '초등학교',
    grade: '5학년',
    textbookName: '성공하는 경제생활',
    useStatus: 'USED',
    registrant: '이길동',
    registeredAt: '2026-03-28T09:00:00',
  },
  {
    id: 'TB-130',
    businessArea: '기업가정신',
    educationTarget: '중학교',
    grade: '전학년',
    textbookName: 'JA MY Business',
    useStatus: 'USED',
    registrant: '홍길동',
    registeredAt: '2026-03-30T01:10:32',
  },
  {
    id: 'TB-129',
    businessArea: '기업가정신',
    educationTarget: '중학교',
    grade: '2학년',
    textbookName: 'JA MY Business',
    useStatus: 'USED',
    registrant: '이순신',
    registeredAt: '2026-03-30T01:10:32',
  },
  {
    id: 'TB-128',
    businessArea: '기업가정신',
    educationTarget: '고등학교',
    grade: '3학년',
    textbookName: 'JA MY Business',
    useStatus: 'USED',
    registrant: '강감찬',
    registeredAt: '2026-03-30T01:10:32',
  },
  {
    id: 'TB-127',
    businessArea: '기업가정신',
    educationTarget: '대학교',
    grade: '전학년',
    textbookName: 'JA MY Business',
    useStatus: 'USED',
    registrant: '김유신',
    registeredAt: '2026-03-30T01:10:32',
  },
  {
    id: 'TB-126',
    businessArea: '디지털 리터러시',
    educationTarget: '초등학교',
    grade: '1학년',
    textbookName: 'JA MY Business',
    useStatus: 'USED',
    registrant: '세종대왕',
    registeredAt: '2026-03-30T01:10:32',
  },
  {
    id: 'TB-125',
    businessArea: '디지털 리터러시',
    educationTarget: '중학교',
    grade: '2학년',
    textbookName: 'JA MY Business',
    useStatus: 'USED',
    registrant: '장영실',
    registeredAt: '2026-03-30T01:10:32',
  },
  {
    id: 'TB-124',
    businessArea: '디지털 리터러시',
    educationTarget: '고등학교',
    grade: '3학년',
    textbookName: 'JA MY Business',
    useStatus: 'USED',
    registrant: '신사임당',
    registeredAt: '2026-03-30T01:10:32',
  },
  {
    id: 'TB-123',
    businessArea: '기업가정신',
    educationTarget: '대학교',
    grade: '전학년',
    textbookName: 'JA MY Business',
    useStatus: 'USED',
    registrant: '이황',
    registeredAt: '2026-03-30T01:10:32',
  },
  {
    id: 'TB-122',
    businessArea: '기업가정신',
    educationTarget: '유아',
    grade: '전학년',
    textbookName: 'JA MY Business',
    useStatus: 'USED',
    registrant: '이이',
    registeredAt: '2026-03-30T01:10:32',
  },
  {
    id: 'TB-121',
    businessArea: '기업가정신',
    educationTarget: '중학교',
    grade: '2학년',
    textbookName: 'JA MY Business',
    useStatus: 'UNUSED',
    registrant: '박지원',
    registeredAt: '2026-03-30T01:10:32',
  },
  {
    id: 'TB-120',
    businessArea: '경제금융',
    educationTarget: '고등학교',
    grade: '3학년',
    textbookName: 'JA Smart Finance',
    useStatus: 'USED',
    registrant: '허균',
    registeredAt: '2026-03-29T10:15:12',
  },
  {
    id: 'TB-119',
    businessArea: '경제금융',
    educationTarget: '대학교',
    grade: '전학년',
    textbookName: 'JA Smart Finance',
    useStatus: 'USED',
    registrant: '유관순',
    registeredAt: '2026-03-28T14:30:45',
  },
  {
    id: 'TB-118',
    businessArea: '진로취업',
    educationTarget: '유아',
    grade: '전학년',
    textbookName: 'JA Career Start',
    useStatus: 'UNUSED',
    registrant: '윤봉길',
    registeredAt: '2026-03-27T09:05:01',
  },
  {
    id: 'TB-117',
    businessArea: '진로취업',
    educationTarget: '중학교',
    grade: '2학년',
    textbookName: 'JA Career Start',
    useStatus: 'USED',
    registrant: '정약용',
    registeredAt: '2026-03-26T16:48:29',
  },
  {
    id: 'TB-116',
    businessArea: '기업가정신',
    educationTarget: '고등학교',
    grade: '전학년',
    textbookName: 'JA Startup Thinking',
    useStatus: 'USED',
    registrant: '김구',
    registeredAt: '2026-03-25T11:22:33',
  },
  {
    id: 'TB-115',
    businessArea: '경제금융',
    educationTarget: '중학교',
    grade: '1학년',
    textbookName: 'JA Money Basics',
    useStatus: 'UNUSED',
    registrant: '안중근',
    registeredAt: '2026-03-24T13:03:17',
  },
  {
    id: 'TB-114',
    businessArea: '진로취업',
    educationTarget: '고등학교',
    grade: '2학년',
    textbookName: 'JA Future Path',
    useStatus: 'USED',
    registrant: '유관순',
    registeredAt: '2026-03-23T08:17:54',
  },
  {
    id: 'TB-113',
    businessArea: '기업가정신',
    educationTarget: '대학교',
    grade: '3학년',
    textbookName: 'JA Venture Lab',
    useStatus: 'USED',
    registrant: '신사임당',
    registeredAt: '2026-03-22T17:09:48',
  },
  {
    id: 'TB-112',
    businessArea: '경제금융',
    educationTarget: '유아',
    grade: '전학년',
    textbookName: 'JA Finance for Kids',
    useStatus: 'UNUSED',
    registrant: '세종대왕',
    registeredAt: '2026-03-21T12:44:20',
  },
  {
    id: 'TB-111',
    businessArea: '진로취업',
    educationTarget: '대학교',
    grade: '1학년',
    textbookName: 'JA Career Design',
    useStatus: 'USED',
    registrant: '장영실',
    registeredAt: '2026-03-20T15:26:09',
  },
]

/** LNB 교재 목록 시드 SSOT (API 더미 시드·정합 테스트용) */
export const TEXTBOOK_LNB_SEED_ROWS: readonly TextbookSeedRow[] = INITIAL_TEXTBOOK_ROWS

function withDetailFields(
  row: Omit<TextbookRow, 'textbookNameEn' | 'educationStages'> & {
    textbookNameEn?: string
    educationStages?: TextbookEducationStage[]
  }
): TextbookRow {
  const normalizedStages = normalizeEducationStages(row.educationStages, row.educationTarget, row.grade)
  const summary = summarizeEducationStages(normalizedStages)
  return {
    ...row,
    educationTarget: summary.educationTarget,
    grade: summary.grade,
    textbookNameEn: (row as Partial<TextbookRow>).textbookNameEn?.trim() || row.textbookName,
    educationStages: normalizedStages.map(stage => ({
      ...stage,
      grades: stage.grades?.map(grade => ({ ...grade })),
    })),
  }
}

let textbookRows: TextbookRow[] | null = null

function seed(): TextbookRow[] {
  if (!textbookRows) {
    textbookRows = INITIAL_TEXTBOOK_ROWS.map(row =>
      withDetailFields({
        ...row,
      })
    )
  }
  return textbookRows
}

function nextTextbookId(): string {
  const max = seed().reduce((acc, row) => {
    const matched = /^TB-(\d+)$/.exec(row.id)
    return matched ? Math.max(acc, Number(matched[1])) : acc
  }, 0)
  return `TB-${max + 1}`
}

export function listTextbooks(): TextbookRow[] {
  return seed().map(row => ({ ...row }))
}

export function createTextbook(input: TextbookCreateInput, registrant = '관리자'): TextbookRow {
  const next = withDetailFields({
    ...input,
    id: nextTextbookId(),
    registrant,
    registeredAt: new Date().toISOString(),
  })
  seed().unshift(next)
  return { ...next }
}

export function updateTextbook(
  id: string,
  input: TextbookCreateInput,
  registrant = '관리자'
): TextbookRow | null {
  const rows = seed()
  const idx = rows.findIndex(row => row.id === id)
  if (idx < 0) return null

  const current = rows[idx]
  const next = withDetailFields({
    ...current,
    ...input,
    registrant,
  })
  rows[idx] = next
  return { ...next }
}

export function deleteTextbook(id: string): boolean {
  const rows = seed()
  const idx = rows.findIndex(row => row.id === id)
  if (idx < 0) return false
  rows.splice(idx, 1)
  return true
}
