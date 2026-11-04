/**
 * Local attendance bulk + FE network probe (dev only).
 * Run: node scripts/e2e-attendance-network-probe.mjs
 */
import { chromium } from '@playwright/test'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const MFA = '000000'

const P0 = {
  'CASE-01': '일반 프로그램 (기관)_커리큘럼형_단일 회차',
  'CASE-03': '일반 프로그램 (개인)_커리큘럼형_단일 회차',
  'CASE-01-alias': '【유형·7】일반 프로그램 (기관)_커리큘럼형_단일 회차',
  'CASE-03-alias': '【유형·9】일반 프로그램 (개인)_커리큘럼형_단일 회차',
}

/** 로컬 BE에 P0 시드가 없을 때 목록 키워드 폴백 */
const KEYWORD_FALLBACK = {
  individual: '개인 / 봉사자',
  institution: '학교 / 기관',
}

const UJAT_TITLES = [
  '[수정 가능] UJAT 프로그램 더미',
  '【예정·캘린더·B】UJAT 36기',
  '[UJAT더미] 2026년 JA Korea 초등 경제교육 대상 학교 및 대학생경제교육봉사단 모집',
]

function isTrackedGet(url) {
  return (
    url.includes('attendances') ||
    url.includes('allocation-matrix') ||
    url.includes('post-attachments') ||
    url.includes('material-kits/global/current-config') ||
    url.includes('/api/admin/dashboard/recruitments')
  )
}

function summarize(captured, fromIdx, label, extra = {}) {
  const uniq = [...new Set(captured.slice(fromIdx))]
  const bulk = uniq.filter(
    u =>
      /\/api\/admin\/program-execution\/programs\/\d+\/attendances/.test(u) &&
      !/\/schedules\//.test(u) &&
      !/:bulk-upsert/.test(u)
  )
  const per = uniq.filter(u => /\/schedules\/\d+\/attendances/.test(u))
  const matrix = uniq.filter(u => /allocation-matrix/.test(u))
  return {
    label,
    bulkAttendancesGet: bulk.length,
    bulkUrls: bulk,
    perScheduleAttendancesGet: per.length,
    perUrls: per,
    allocationMatrixGet: matrix.length,
    matrixUrls: matrix,
    postAttachmentsGet: uniq.filter(u => /post-attachments/.test(u)).length,
    currentConfigGet: uniq.filter(u => /material-kits\/global\/current-config/.test(u)).length,
    dashboardRecruitmentsGet: uniq.filter(u => u.includes('/api/admin/dashboard/recruitments'))
      .length,
    noPerScheduleN1: per.length === 0,
    bulkPass: bulk.length >= 1 && per.length === 0,
    ...extra,
  }
}

async function login(page) {
  await page.goto(`${BASE}/login`)
  await page.getByRole('button', { name: '마스터' }).click()
  await page.getByRole('button', { name: '로그인하기' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.waitFor({ state: 'visible', timeout: 30_000 })
  await dialog.locator('.mfa-otp-input__boxes input').first().click()
  await page.keyboard.type(MFA)
  await page.waitForURL(url => {
    const p = new URL(url).pathname
    return p === '/' || p === ''
  })
}

async function dismissOverlays(page) {
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(200)
  }
  const close = page.getByRole('button', { name: /^닫기$/ }).first()
  if (await close.isVisible().catch(() => false)) {
    await close.click({ force: true }).catch(() => {})
    await page.waitForTimeout(300)
  }
}

function isApiUrl(url) {
  return url.includes('/api/')
}

async function openGeneralByTitles(page, titles, keywordFallback) {
  await dismissOverlays(page)
  await page.goto(`${BASE}/programs/general`)
  await page.getByPlaceholder('프로그램명을 입력해 주세요').waitFor({ timeout: 30_000 })

  const tryKeyword = async keyword => {
    const titleFilter = page.getByPlaceholder('프로그램명을 입력해 주세요')
    await titleFilter.fill(keyword)
    await page.getByRole('button', { name: '조회' }).click()
    await page.waitForTimeout(2500)
    const row = page
      .locator('tbody.ant-table-tbody tr.ant-table-row:not(.ant-table-measure-row)')
      .first()
    if ((await row.count()) > 0 && (await row.isVisible().catch(() => false))) {
      const title = ((await row.innerText()) || '').replace(/\s+/g, ' ').slice(0, 120)
      await row.click({ timeout: 45_000 })
      await page.waitForURL(/programId=/, { timeout: 60_000 })
      const id = new URL(page.url()).searchParams.get('programId')
      return { id, title }
    }
    return null
  }

  for (const title of titles) {
    const titleFilter = page.getByPlaceholder('프로그램명을 입력해 주세요')
    await titleFilter.fill(title)
    await page.getByRole('button', { name: '조회' }).click()
    await page.waitForTimeout(2500)
    const row = page
      .locator('tbody.ant-table-tbody tr.ant-table-row:not(.ant-table-measure-row)')
      .filter({ hasText: title })
      .first()
    if ((await row.count()) > 0 && (await row.isVisible().catch(() => false))) {
      await row.click({ timeout: 45_000 })
      await page.waitForURL(/programId=/, { timeout: 60_000 })
      const id = new URL(page.url()).searchParams.get('programId')
      return { id, title }
    }
  }
  if (keywordFallback) {
    const opened = await tryKeyword(keywordFallback)
    if (opened) return opened
  }
  return { id: null, title: null }
}

async function gotoGeneralDeep(page, programId, lnb, tab) {
  const url = `${BASE}/programs/general?programId=${programId}&lnb=${lnb}&tab=${tab}`
  const attendancesWait = page
    .waitForResponse(
      res =>
        res.request().method() === 'GET' &&
        /\/programs\/\d+\/attendances/.test(res.url()) &&
        !/\/schedules\//.test(res.url()),
      { timeout: 45_000 }
    )
    .catch(() => null)
  await page.goto(url)
  await page
    .getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
    .waitFor({ state: 'visible', timeout: 60_000 })
  await attendancesWait
  await page.waitForTimeout(2000)
}

async function openUjatByTitles(page, titles) {
  await dismissOverlays(page)
  await page.goto(`${BASE}/programs/ujat`)
  await page.getByPlaceholder('프로그램명을 입력해 주세요').waitFor({ timeout: 30_000 })

  for (const title of titles) {
    const titleFilter = page.getByPlaceholder('프로그램명을 입력해 주세요')
    await titleFilter.fill(title)
    await page.getByRole('button', { name: '조회' }).click()
    await page.waitForTimeout(2500)
    const row = page
      .locator('tbody.ant-table-tbody tr.ant-table-row:not(.ant-table-measure-row)')
      .filter({ hasText: title })
      .first()
    if ((await row.count()) > 0 && (await row.isVisible().catch(() => false))) {
      await row.click({ timeout: 45_000 })
      await page.waitForURL(/programId=/, { timeout: 60_000 }).catch(() => {})
      const id = new URL(page.url()).searchParams.get('programId')
      if (id) return { id, title }
    }
  }
  return { id: null, title: null }
}

async function gotoUjatAttendance(page, programId) {
  const url = `${BASE}/programs/ujat?programId=${programId}&lnb=education_progress&tab=edu_h1_attendance`
  const bulkWait = page
    .waitForResponse(
      res =>
        res.request().method() === 'GET' &&
        /\/programs\/\d+\/attendances/.test(res.url()) &&
        !/\/schedules\//.test(res.url()),
      { timeout: 45_000 }
    )
    .catch(() => null)
  const matrixWait = page
    .waitForResponse(
      res => res.request().method() === 'GET' && res.url().includes('allocation-matrix'),
      { timeout: 45_000 }
    )
    .catch(() => null)
  await page.goto(url)
  await page.waitForTimeout(1500)
  await Promise.all([bulkWait, matrixWait])
  await page.waitForTimeout(4000)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const captured = []
page.on('request', req => {
  if (req.method() !== 'GET') return
  const u = req.url()
  if (isApiUrl(u) && isTrackedGet(u)) captured.push(u)
})

const report = { checks: [], notes: [], session: 'playwright-headless-single-login' }

await login(page)

let i = captured.length
await page.goto(`${BASE}/`)
await page.waitForTimeout(5000)
report.checks.push({ item: '5-FE04', ...summarize(captured, i, '대시보드 홈') })

try {
  const ind = await openGeneralByTitles(
    page,
    [P0['CASE-03'], P0['CASE-03-alias']],
    KEYWORD_FALLBACK.individual
  )
  report.notes.push(`individual seed: ${ind.title ?? '(none)'} id=${ind.id}`)
  if (ind.id) {
    i = captured.length
    await gotoGeneralDeep(page, ind.id, 'progress', 'progress_attendance')
    report.checks.push({
      item: '1',
      programId: ind.id,
      ...summarize(captured, i, '개인·진행·출석 관리'),
    })

    i = captured.length
    await gotoGeneralDeep(page, ind.id, 'progress', 'progress_posts')
    await page.waitForTimeout(3000)
    report.checks.push({
      item: '5-FE01',
      programId: ind.id,
      ...summarize(captured, i, '게시글·첨부'),
    })
  } else {
    report.checks.push({ item: '1', error: 'P0 CASE-03 시드 없음' })
  }
} catch (e) {
  report.checks.push({ item: '1', error: String(e.message) })
}

try {
  const inst = await openGeneralByTitles(
    page,
    [P0['CASE-01'], P0['CASE-01-alias']],
    KEYWORD_FALLBACK.institution
  )
  report.notes.push(`institution seed: ${inst.title ?? '(none)'} id=${inst.id}`)
  if (inst.id) {
    i = captured.length
    await gotoGeneralDeep(page, inst.id, 'progress', 'progress_participants')
    const dialog = page.getByRole('dialog')
    const instRow = dialog
      .locator('tbody.ant-table-tbody tr.ant-table-row:not(.ant-table-measure-row)')
      .first()
    if (await instRow.isVisible().catch(() => false)) {
      await instRow.click({ force: true })
      await page.waitForTimeout(3000)
      const attTab = page.getByRole('tab', { name: /출석/ }).first()
      if (await attTab.isVisible().catch(() => false)) {
        await attTab.click({ force: true })
        await page.waitForTimeout(5000)
      }
      report.checks.push({
        item: '2-기관',
        programId: inst.id,
        ...summarize(captured, i, '기관 상세·출석'),
      })

      const studentTab = page.getByRole('tab', { name: /학생/ }).first()
      if (await studentTab.isVisible().catch(() => false)) {
        await studentTab.click({ force: true })
        await page.waitForTimeout(2000)
        i = captured.length
        const link = page.getByRole('button', { name: /강의 출석|출석 내역/ }).first()
        if (await link.isVisible().catch(() => false)) {
          await link.click({ force: true })
          await page.waitForTimeout(5000)
          report.checks.push({
            item: '2-학생',
            programId: inst.id,
            ...summarize(captured, i, '학생·강의출석 모달'),
          })
        } else {
          report.checks.push({ item: '2-학생', note: '강의 출석 버튼 없음' })
        }
      }
    } else {
      report.checks.push({ item: '2-기관', note: '참여 기관 행 없음' })
    }
  } else {
    report.checks.push({ item: '2', error: 'P0 CASE-01 시드 없음' })
  }
} catch (e) {
  report.checks.push({ item: '2', error: String(e.message) })
}

try {
  const ujat = await openUjatByTitles(page, UJAT_TITLES)
  report.notes.push(`ujat seed: ${ujat.title ?? '(none)'} id=${ujat.id}`)
  if (ujat.id) {
    i = captured.length
    await gotoUjatAttendance(page, ujat.id)
    report.checks.push({
      item: '3',
      programId: ujat.id,
      ...summarize(captured, i, 'UJAT·교육진행·출석'),
      matrixPass: summarize(captured, i, '').allocationMatrixGet >= 1,
    })
  } else {
    report.checks.push({ item: '3', error: 'UJAT 시드 없음' })
  }
} catch (e) {
  report.checks.push({ item: '3', error: String(e.message) })
}

report.checks.push({
  item: '4',
  status: 'NOT_RUN',
  note: '1365 저장 후 시트 GET 재조회는 출석 저장 UI 액션 필요(프로브 미구현)',
})

try {
  i = captured.length
  await page.goto(`${BASE}/textbook`)
  await page.waitForTimeout(3000)
  const kitBtn = page.getByRole('button', { name: '키트 수량 관리' })
  if (await kitBtn.isVisible().catch(() => false)) {
    await kitBtn.click()
    await page.waitForTimeout(4000)
  }
  report.checks.push({ item: '5-FE02', ...summarize(captured, i, '교재·키트 수량 모달') })
} catch (e) {
  report.checks.push({ item: '5-FE02', error: String(e.message) })
}

await browser.close()
console.log(JSON.stringify(report, null, 2))
