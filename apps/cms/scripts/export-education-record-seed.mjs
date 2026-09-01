/**
 * 실적 관리 FE mock (`programs.ts` educationRecords) → BE 시드 JSON.
 * 실행: node apps/cms/scripts/export-education-record-seed.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const programsPath = path.join(root, 'src/data/mock/programs.ts')
const outPath = path.join(root, 'docs/api/education-records-seed.payload.json')

const src = fs.readFileSync(programsPath, 'utf8')
const start = src.indexOf('const educationRecords = [')
const end = src.indexOf('\n// 스폰서 이름 업데이트')
if (start < 0 || end < 0) {
  throw new Error('educationRecords 배열을 programs.ts에서 찾지 못했습니다.')
}
const arrayLiteral = src.slice(start + 'const educationRecords = '.length, end).trim()
const educationRecords = new Function(`return (${arrayLiteral})`)()

function blankToUndef(value) {
  if (value == null) return undefined
  const text = String(value).trim()
  if (!text || text === '해당없음') return undefined
  return text
}

function districtOrUndef(value) {
  const text = blankToUndef(value)
  if (!text || text === '전국' || text === '온라인') return undefined
  return text
}

function schoolOrUndef(value) {
  const text = blankToUndef(value)
  if (!text || text === '전국') return undefined
  return text
}

const YEAR = 2026
const CONFIRMED_AT_DAY = '01'

function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined))
}

const cases = educationRecords.map((record, index) => {
  const seq = index + 1
  const educationMonth = `${YEAR}-${String(record.month).padStart(2, '0')}`
  const confirmedAt = `${educationMonth}-${CONFIRMED_AT_DAY}T00:00:00Z`
  const title = record.title === '해당없음' ? record.mainTitle : record.title
  const seedId = 90000 + seq

  const listItem = compact({
    id: String(seedId),
    programId: String(seq),
    status: 'CONFIRMED',
    educationMonth,
    businessArea: record.businessArea,
    sponsorNameEn: blankToUndef(record.sponsorNameEn),
    titleEn: blankToUndef(record.titleEn),
    sponsorNameKo: record.sponsorNameKr,
    mainTitle: blankToUndef(record.mainTitle),
    title,
    textbookName: blankToUndef(record.textbookName),
    textbookNameEn: blankToUndef(record.textbookNameEn),
    schoolOrOrganizationName: schoolOrUndef(record.schoolName),
    district: districtOrUndef(record.district),
    targetLevel: record.targetLevel,
    ipOwned: record.ipOwned,
    courseDeliveredBy: record.courseDeliveredBy,
    partnerInvolvement: record.partnerInvolvement,
    institutionType: record.institutionType,
    ips: record.ips,
    programCategory: blankToUndef(record.programCategory),
    programChannel: blankToUndef(record.programChannel),
    educationType: record.educationType,
    educationHours: String(record.educationTime),
    classCount: record.classCount,
    maleParticipants: record.maleParticipants,
    femaleParticipants: record.femaleParticipants,
    totalParticipants: record.totalParticipants,
    generalVolunteers: record.generalVolunteers,
    staffVolunteers: record.staffVolunteers,
    returningVolunteers: record.returningVolunteers,
    generalTeachers: record.generalTeachers,
    educatedTeachers: record.educatedTeachers,
    instructors: record.instructors,
    managerName: record.managerName,
    createdAt: confirmedAt,
    updatedAt: confirmedAt,
    confirmedAt,
    revisionNo: 1,
    latestRevision: true,
  })

  const dbRow = compact({
    id: seedId,
    programId: seq,
    performanceStatus: 'CONFIRMED',
    educationMonth,
    businessArea: record.businessArea,
    sponsorNamesEn: blankToUndef(record.sponsorNameEn),
    programNameEn: blankToUndef(record.titleEn),
    sponsorNamesKo: record.sponsorNameKr,
    mainProgramNameKo: blankToUndef(record.mainTitle),
    detailedProgramNameKo: title,
    textbookNameKo: blankToUndef(record.textbookName),
    textbookNameEn: blankToUndef(record.textbookNameEn),
    schoolOrOrganizationName: schoolOrUndef(record.schoolName),
    sigungu: districtOrUndef(record.district),
    targetType: record.targetLevel,
    ipOwned: record.ipOwned,
    courseDeliveredBy: record.courseDeliveredBy,
    partnerInvolvement: record.partnerInvolvement,
    organizationType: record.institutionType,
    ipsType: record.ips,
    programCategory: blankToUndef(record.programCategory),
    programChannelFormat: blankToUndef(record.programChannel),
    educationType: record.educationType,
    educationHours: String(record.educationTime),
    classCount: record.classCount,
    maleCount: record.maleParticipants,
    femaleCount: record.femaleParticipants,
    totalParticipantCount: record.totalParticipants,
    generalVolunteerCount: record.generalVolunteers,
    employeeVolunteerCount: record.staffVolunteers,
    reparticipationVolunteerCount: record.returningVolunteers,
    generalTeacherCount: record.generalTeachers,
    trainedTeacherCount: record.educatedTeachers,
    instructorCount: record.instructors,
    managerName: record.managerName,
    createdAt: confirmedAt,
    updatedAt: confirmedAt,
    confirmedAt,
    revisionNo: 1,
    latestRevisionYn: true,
  })

  return {
    caseId: `CASE-${String(seq).padStart(2, '0')}`,
    feMockProgramId: `prog-${String(seq).padStart(3, '0')}`,
    listItem,
    dbRow,
  }
})

const payload = {
  $schema_note:
    'CMS LNB 실적 관리(`/education-records`) GET /api/admin/performance-records 가 FE mock 30건과 같게 보이도록 넣는 시드. Gemini `/programs/gemini/performance`·training-reports 와 혼용 금지. SSOT = apps/cms/src/data/mock/programs.ts educationRecords.',
  seedLabel: 'education-records-fe-mock-30-v1',
  year: YEAR,
  count: cases.length,
  insertHints: {
    performanceStatus: 'CONFIRMED',
    latestRevisionYn: true,
    revisionNo: 1,
    note: 'id(90001~90030)·programId(1~30)는 로컬 시드용 안정 값입니다. 운영 PK/프로그램 FK는 BE가 매핑하세요. 프로그램 row가 없어도 실적 단독 insert면 목록 조회는 가능해야 합니다. POST bulk create API는 없습니다 — local profile Flyway/시더 또는 내부 insert를 쓰세요. rebuild는 프로그램에서 재집계하므로 이 30건 엑셀 값을 보장하지 않습니다.',
  },
  fieldMapToInternal: {
    sponsorNameEn: 'sponsorNamesEn',
    titleEn: 'programNameEn',
    sponsorNameKo: 'sponsorNamesKo',
    mainTitle: 'mainProgramNameKo',
    title: 'detailedProgramNameKo',
    textbookName: 'textbookNameKo',
    district: 'sigungu',
    targetLevel: 'targetType',
    institutionType: 'organizationType',
    ips: 'ipsType',
    programChannel: 'programChannelFormat',
    maleParticipants: 'maleCount',
    femaleParticipants: 'femaleCount',
    totalParticipants: 'totalParticipantCount',
    generalVolunteers: 'generalVolunteerCount',
    staffVolunteers: 'employeeVolunteerCount',
    returningVolunteers: 'reparticipationVolunteerCount',
    generalTeachers: 'generalTeacherCount',
    educatedTeachers: 'trainedTeacherCount',
    instructors: 'instructorCount',
    status: 'performanceStatus',
    latestRevision: 'latestRevisionYn',
  },
  cases,
}

fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`)
console.log(`wrote ${cases.length} records → ${path.relative(process.cwd(), outPath)}`)
