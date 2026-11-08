/**
 * GET /api/admin/programs/{programId}/participants — items[].sessions[].scheduleRole (BE additive 계약 선반영).
 *
 * - SessionProgress / ParticipantSessionProgress 마지막(assignmentStatus 뒤)에 scheduleRole 추가
 * - string | null, enum 원문 PRE_EDUCATION | EDUCATION | CLOSING | SESSION (대소문자 변환 금지)
 * - null: schedule_kind 없음 → 라벨 없이 날짜·시간만. 서버는 한글 라벨을 주지 않는다(표시는 FE).
 *
 * backend 스냅샷과 이미 필터된 스펙 모두에 적용한다. 멱등.
 *   node scripts/patch-openapi-participant-session-schedule-role.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const openapiDir = join(__dirname, '../openapi')

const SCHEMAS = ['SessionProgress', 'ParticipantSessionProgress']

const scheduleRoleProperty = {
  type: 'string',
  nullable: true,
  enum: ['PRE_EDUCATION', 'EDUCATION', 'CLOSING', 'SESSION'],
  description:
    'canonical 일정 역할. program_schedule.schedule_kind. PRE_EDUCATION|EDUCATION|CLOSING|SESSION. 없으면 null(라벨 없이 날짜·시간만). sessionNo=null·scheduleName으로 추정하지 않는다.',
}

/** assignmentStatus 바로 뒤(없으면 맨 끝)에 scheduleRole을 둔다 — 키 순서 유지 */
function withScheduleRole(properties) {
  const next = {}
  let inserted = false
  for (const [key, value] of Object.entries(properties)) {
    if (key === 'scheduleRole') continue
    next[key] = value
    if (key === 'assignmentStatus') {
      next.scheduleRole = scheduleRoleProperty
      inserted = true
    }
  }
  if (!inserted) next.scheduleRole = scheduleRoleProperty
  return next
}

for (const file of readdirSync(openapiDir).filter(name => name.endsWith('.openapi.json'))) {
  const path = join(openapiDir, file)
  const raw = readFileSync(path, 'utf8')
  const spec = JSON.parse(raw)
  const schemas = spec.components?.schemas
  if (!schemas) continue
  let changed = false

  for (const name of SCHEMAS) {
    const schema = schemas[name]
    if (!schema?.properties) continue
    schema.properties = withScheduleRole(schema.properties)
    changed = true
  }

  if (!changed) continue
  const next = `${JSON.stringify(spec, null, 2)}\n`
  if (next !== raw) {
    writeFileSync(path, next)
    console.log(`patched ${file}`)
  }
}
