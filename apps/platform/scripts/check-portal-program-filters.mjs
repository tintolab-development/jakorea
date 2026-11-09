#!/usr/bin/env node
/**
 * GET /api/portal/programs 목록 필터 계약 검증 (실제 API 호출, 읽기 전용).
 *
 * 필터 없이 받은 전체 행을 응답 필드로 직접 걸러낸 결과(기대값)와
 * 서버 필터 결과가 같은지 비교한다. 빠진 행·잘못 섞인 행을 모두 잡는다.
 *
 * 사용: node scripts/check-portal-program-filters.mjs [baseUrl]
 *   baseUrl 기본값 http://localhost:5173 (Vite dev proxy)
 */

const BASE_URL = (process.argv[2] ?? 'http://localhost:5173').replace(/\/$/, '')
const PAGE_SIZE = 100
const AGES = ['elementary', 'middle', 'high', 'university', 'adult']

function unwrap(payload) {
  return payload && payload.success === true && 'data' in payload ? unwrap(payload.data) : payload
}

async function fetchAll(query) {
  const rows = []
  for (let page = 0; ; page += 1) {
    const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE), sort: 'LATEST' })
    for (const [key, value] of query) params.append(key, value)
    const res = await fetch(`${BASE_URL}/api/portal/programs?${params}`)
    if (!res.ok) throw new Error(`${res.status} ${params}`)
    const data = unwrap(await res.json())
    rows.push(...(data.items ?? []))
    if (page + 1 >= (data.totalPages ?? 0)) return rows
  }
}

const rowKey = row =>
  [row.programId, row.recruitmentId ?? '-', row.applicationType ?? '-', row.targetType ?? '-', (row.portalCategories ?? []).join('/')].join(':')

const educationTargets = row =>
  row.educationTargets?.length ? row.educationTargets : row.educationTarget ? [row.educationTarget] : []

/**
 * BE 매칭 규칙 (2026-11 반영): 필터는 목록 응답 필드와 같은 계산값으로 매칭한다.
 *   recruitmentTarget=v ⇔ recruitmentTargets 에 v 포함 (모집 행에 지원하는 사람 기준, 없으면 [])
 *   educationTarget=v   ⇔ educationTargets 에 v 포함
 *   educationMethod=V   ⇔ educationForm == V.toLowerCase() (operationMethod 와 별개)
 * 모집대상 정의(지원하는 사람 기준)는 기획 확정 대기 항목이다.
 */
const recruitmentTargets = row => row.recruitmentTargets ?? []

const lower = value => String(value ?? '').toLowerCase()
const EDUCATION_FORM = { ONLINE: 'online', OFFLINE: 'offline', HYBRID: 'hybrid', PARTICIPANT_SELECTION: 'participant_selection' }
const educationForm = row => lower(row.educationForm)

/** 운영기간: 행의 운영(없으면 사업) 기간이 조회 범위와 겹치면 포함한다고 가정한다. */
const overlaps = (row, from, to) => {
  const start = row.operationStartDate ?? row.businessStartDate
  const end = row.operationEndDate ?? row.businessEndDate ?? start
  return Boolean(start) && start.slice(0, 10) <= to && end.slice(0, 10) >= from
}

const year = new Date().getFullYear()
const CASES = [
  ...['YOUTH_YOUNG', 'ORGANIZATION', 'INSTRUCTOR'].map(tab => ({
    name: `portalTab=${tab}`,
    query: [['portalTab', tab]],
    match: row => (row.portalCategories ?? []).includes(tab),
  })),
  ...['UPCOMING', 'OPEN', 'CLOSED'].map(status => ({
    name: `recruitmentStatus=${status}`,
    query: [['recruitmentStatus', status]],
    match: row => row.recruitmentStatus === status,
  })),
  ...AGES.map(age => ({
    name: `educationTarget=${age}`,
    query: [['educationTarget', age]],
    match: row => educationTargets(row).map(lower).includes(age),
  })),
  ...AGES.map(age => ({
    name: `recruitmentTarget=${age}`,
    query: [['recruitmentTarget', age]],
    match: row => recruitmentTargets(row).map(lower).includes(age),
  })),
  {
    name: 'portalTab=ORGANIZATION & recruitmentTarget=elementary (재현 케이스)',
    query: [['portalTab', 'ORGANIZATION'], ['recruitmentTarget', 'elementary']],
    match: row =>
      (row.portalCategories ?? []).includes('ORGANIZATION') &&
      recruitmentTargets(row).map(lower).includes('elementary'),
  },
  {
    name: 'educationTarget=elementary & educationTarget=middle (반복 = OR)',
    query: [['educationTarget', 'elementary'], ['educationTarget', 'middle']],
    match: row => educationTargets(row).map(lower).some(age => age === 'elementary' || age === 'middle'),
  },
  ...Object.entries(EDUCATION_FORM).map(([method, form]) => ({
    name: `educationMethod=${method}`,
    query: [['educationMethod', method]],
    match: row => educationForm(row) === form,
  })),
  {
    name: `operatingFrom=${year}-01-01 & operatingTo=${year}-12-31 (겹침 가정)`,
    query: [['operatingFrom', `${year}-01-01`], ['operatingTo', `${year}-12-31`]],
    match: row => overlaps(row, `${year}-01-01`, `${year}-12-31`),
  },
]

function diff(expected, actual) {
  const count = keys => keys.reduce((map, key) => map.set(key, (map.get(key) ?? 0) + 1), new Map())
  const exp = count(expected)
  const act = count(actual)
  const missing = [...exp].filter(([key, n]) => (act.get(key) ?? 0) < n).map(([key]) => key)
  const unexpected = [...act].filter(([key, n]) => (exp.get(key) ?? 0) < n).map(([key]) => key)
  return { missing, unexpected }
}

const all = await fetchAll([])
console.log(`전체 ${all.length}행 (${BASE_URL})\n`)

let failed = 0
for (const testCase of CASES) {
  const expected = all.filter(testCase.match).map(rowKey)
  const actual = (await fetchAll(testCase.query)).map(rowKey)
  const { missing, unexpected } = diff(expected, actual)
  const ok = missing.length === 0 && unexpected.length === 0
  if (!ok) failed += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${testCase.name}  기대 ${expected.length} / 서버 ${actual.length}`)
  if (missing.length) console.log(`      누락 ${missing.length}: ${missing.slice(0, 5).join(', ')}`)
  if (unexpected.length) console.log(`      초과 ${unexpected.length}: ${unexpected.slice(0, 5).join(', ')}`)
}

console.log(`\n${CASES.length - failed}/${CASES.length} PASS`)
process.exitCode = failed > 0 ? 1 : 0
