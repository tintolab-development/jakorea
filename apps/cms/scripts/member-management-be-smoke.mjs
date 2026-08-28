#!/usr/bin/env node
/**
 * BE seed smoke for member management handoff §7 (2026-08-28).
 * Usage: node scripts/member-management-be-smoke.mjs [--base=http://localhost:8080]
 *
 * Directory · detail history · permission 회귀를 한 번에 검증한다.
 * API path 변경 금지. mock userId를 path에 넣지 말고 catalog numeric id만 사용.
 */
import process from 'node:process'

const args = process.argv.slice(2)
const baseArg = args.find(a => a.startsWith('--base='))
const BASE = baseArg ? baseArg.slice('--base='.length).replace(/\/$/, '') : 'http://localhost:8080'

async function login() {
  const loginRes = await fetch(`${BASE}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin1@jakorea.org', password: 'admin1234!' }),
  })
  const loginJson = await loginRes.json()
  if (!loginRes.ok) throw new Error(`login ${loginRes.status}: ${JSON.stringify(loginJson)}`)
  const challengeUuid = loginJson.challengeUuid
  if (!challengeUuid) throw new Error(`no challengeUuid: ${JSON.stringify(loginJson)}`)

  const mfaRes = await fetch(`${BASE}/api/admin/auth/mfa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeUuid, verificationCode: '000000' }),
  })
  const mfaJson = await mfaRes.json()
  if (!mfaRes.ok) throw new Error(`mfa ${mfaRes.status}: ${JSON.stringify(mfaJson)}`)
  const token = mfaJson.accessToken
  if (!token) throw new Error(`no accessToken: ${JSON.stringify(mfaJson)}`)
  return token
}

async function get(token, path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  let body
  try {
    body = await res.json()
  } catch {
    body = null
  }
  return { status: res.status, body }
}

async function post(token, path, payload) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  let body
  try {
    body = await res.json()
  } catch {
    body = null
  }
  return { status: res.status, body }
}

function itemsOf(body) {
  if (!body) return []
  if (Array.isArray(body)) return body
  if (Array.isArray(body.items)) return body.items
  if (Array.isArray(body.content)) return body.content
  return []
}

function itemCount(body) {
  if (!body) return null
  if (Array.isArray(body)) return body.length
  if (Array.isArray(body.items)) return body.items.length
  if (Array.isArray(body.content)) return body.content.length
  return null
}

function includesId(body, field, id) {
  return itemsOf(body).some(row => row?.[field] === id || row?.[field] === Number(id))
}

function excludesId(body, field, id) {
  return !includesId(body, field, id)
}

function applicationTypeOf(row) {
  return String(row?.applicationType ?? row?.subjectType ?? '')
    .trim()
    .toUpperCase()
}

const checks = []

function record(name, ok, detail = '') {
  checks.push({ name, ok, detail })
  const mark = ok ? '✅' : '❌'
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`)
}

try {
  console.log(`Base: ${BASE}\n`)
  const token = await login()
  console.log('Auth: OK\n')

  // Directory
  {
    const { status, body } = await get(token, '/api/admin/members/all?keyword=김개인&page=0&size=5')
    const ok = status === 200 && includesId(body, 'memberId', 171001)
    record('§7-1 members/all keyword 김개인 → 171001', ok, `status=${status}`)
  }
  {
    const { status, body } = await get(
      token,
      `/api/admin/organizations/schools?keyword=${encodeURIComponent('서울')}&page=0&size=10`
    )
    const school = itemsOf(body).find(
      row => row?.organizationId === 171501 || row?.organizationId === Number(171501)
    )
    const teacherCount = school?.affiliatedTeacherCount ?? school?.teacherCount
    const ok = status === 200 && Boolean(school) && Number(teacherCount) === 3
    record(
      '§7-2 schools keyword 서울 → 171501 · teachers=3',
      ok,
      `status=${status} found=${Boolean(school)} teachers=${teacherCount}`
    )
  }
  {
    const { status, body } = await post(token, '/api/admin/organizations/schools/bulk-delete', {
      ids: [171501],
    })
    const code = body?.code ?? body?.error?.code ?? body?.data?.code
    const ok =
      status === 409 &&
      (String(code ?? '').includes('SCHOOL_HAS') ||
        String(JSON.stringify(body ?? '')).includes('SCHOOL_HAS'))
    record(
      '§7-3 schools bulk-delete 171501 → HTTP 409',
      ok,
      `status=${status} code=${code ?? 'n/a'} body=${JSON.stringify(body).slice(0, 180)}`
    )
  }

  // Detail history
  {
    const { status, body } = await get(token, '/api/admin/users/171001/applications?page=0&size=20')
    const n = itemCount(body)
    record('§7-4 users/171001/applications → 5', status === 200 && n === 5, `status=${status} count=${n}`)
  }
  {
    const { status, body } = await get(token, '/api/admin/users/171001/program-history?page=0&size=20')
    const n = itemCount(body)
    const hasManager = itemsOf(body).some(r => r?.managerName?.trim())
    record(
      '§7-5 users/171001/program-history volunteer',
      status === 200 && n === 5 && hasManager,
      `count=${n} manager=${hasManager}`
    )
  }
  {
    // GAP-A fix: total=5 · 173011–173015 INDIVIDUAL only · ORGANIZATION/174xxx 없음
    const { status, body } = await get(token, '/api/admin/users/171002/applications?page=0&size=20')
    const rows = itemsOf(body)
    const total = body?.totalElements ?? rows.length
    const ids = rows.map(r => Number(r?.applicationId)).filter(Number.isFinite).sort((a, b) => a - b)
    const expectedIds = [173011, 173012, 173013, 173014, 173015]
    const types = rows.map(r => applicationTypeOf(r))
    const allIndividual = types.length > 0 && types.every(t => t === 'INDIVIDUAL')
    const noOrganization = !types.some(t => t === 'ORGANIZATION' || t === 'SCHOOL' || t === 'INSTITUTION')
    const no174 = !ids.some(id => id >= 174001 && id <= 174005)
    const idsMatch =
      ids.length === expectedIds.length && expectedIds.every((id, i) => ids[i] === id)
    const ok =
      status === 200 &&
      Number(total) === 5 &&
      rows.length === 5 &&
      idsMatch &&
      allIndividual &&
      noOrganization &&
      no174
    record(
      '§7-6 users/171002/applications → 5 INDIVIDUAL 173011–015',
      ok,
      `status=${status} total=${total} ids=${ids.join(',')} types=${types.join(',')}`
    )
  }
  {
    const { status, body } = await get(token, '/api/admin/users/171003/applications?page=0&size=20')
    const n = itemCount(body)
    record('§7-7 users/171003/applications → 10', status === 200 && n === 10, `count=${n}`)
  }
  {
    const { status, body } = await get(
      token,
      '/api/admin/settlements?instructorMemberId=171003&page=0&size=20'
    )
    const n = itemCount(body)
    record('§7-8 settlements instructorMemberId=171003', status === 200 && (n ?? 0) >= 1, `count=${n}`)
  }
  {
    const { status, body } = await get(
      token,
      '/api/admin/organizations/schools/171501/program-enrollment-history?page=0&size=20'
    )
    const n = itemCount(body)
    record('§7-9 school 171501 enrollment history → 5', status === 200 && n === 5, `count=${n}`)
  }
  {
    const { status, body } = await get(
      token,
      '/api/admin/admin-accounts/171601/program-roles?page=0&size=20'
    )
    const n = itemCount(body)
    record('§7-10 admin 171601 program-roles → 5', status === 200 && n === 5, `count=${n}`)
  }

  // Permission
  {
    const { status, body } = await get(
      token,
      '/api/admin/instructor-role-requests?status=PENDING&page=0&size=50'
    )
    const inc = includesId(body, 'requestId', 172001)
    const exc = excludesId(body, 'requestId', 172007)
    record(
      '§7-11 IR list 172001∈ 172007∉',
      status === 200 && inc && exc,
      `172001=${inc} 172007 excluded=${exc}`
    )
  }
  {
    const { status, body } = await get(token, '/api/admin/instructor-role-requests/172001')
    const profile = body?.profile
    const ok =
      status === 200 &&
      profile?.education?.highestSchoolType === 'college4' &&
      profile?.career?.level === 'experienced' &&
      Boolean(profile?.essays?.freeWrite1?.trim())
    record('§7-12 IR/172001 structured profile', ok, `status=${status}`)
  }
  {
    const { status, body } = await get(token, '/api/admin/instructor-role-requests/172002')
    const ok = status === 200 && (body?.defaultFeeGrade || body?.profile?.defaultFeeGrade)
    record('§7-13 IR/172002 feeGrade', ok, `status=${status}`)
  }
  {
    const { status, body } = await get(token, '/api/admin/admin-approval-requests?page=0&size=50')
    const exc = excludesId(body, 'adminAccountId', 172231)
    record('§7-14 admin approval 172231∉', status === 200 && exc, `excluded=${exc}`)
  }
  {
    const { status, body } = await get(token, '/api/admin/admin-approval-requests/172201')
    const terms = body?.termsAgreements?.length ?? 0
    const social = body?.socialAccounts?.length ?? 0
    record(
      '§7-15 AA/172201 terms+social',
      status === 200 && terms >= 4 && social >= 2,
      `terms=${terms} social=${social}`
    )
  }
  {
    const { status, body } = await get(token, '/api/admin/admin-roles')
    const roles = (Array.isArray(body) ? body : body?.items ?? []).map(r => r?.roleCode ?? r?.code)
    const ok = status === 200 && ['MASTER', 'PM', 'PARTNER', 'VIEWER'].every(c => roles.includes(c))
    record('§7-19 admin-roles MASTER/PM/PARTNER/VIEWER', ok, `roles=${roles.join(',')}`)
  }

  const failed = checks.filter(c => !c.ok)
  console.log(`\n${checks.length - failed.length}/${checks.length} passed`)
  if (failed.length) {
    console.log('\nFailures (pass to BE if seed/API gap):')
    for (const f of failed) {
      console.log(`- ${f.name}: ${f.detail}`)
    }
  }
  process.exit(failed.length ? 1 : 0)
} catch (err) {
  console.error('Smoke failed:', err.message)
  process.exit(1)
}
