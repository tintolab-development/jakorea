/**
 * BE 2026-09-09 template-variables enabled SSOT handoff.
 * backend.openapi.json 의 CatalogVariableItem / template-variables query 설명을 보강한다.
 * invent-ban: path·필드명 추가 금지. description·enum·example 만.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const inputPath = join(__dirname, '../openapi/backend.openapi.json')

const spec = JSON.parse(readFileSync(inputPath, 'utf8'))
const schemas = spec.components?.schemas ?? {}
const paths = spec.paths ?? {}

let patched = 0

function setPropDescription(schemaName, propName, description) {
  const schema = schemas[schemaName]
  const prop = schema?.properties?.[propName]
  if (!prop) {
    console.warn(`skip ${schemaName}.${propName}: not found`)
    return
  }
  if (prop.description === description) return
  prop.description = description
  patched += 1
}

const catalogItemSchemaNames = ['NotificationCatalogVariableItem', 'CatalogVariableItem']
for (const schemaName of catalogItemSchemaNames) {
  const catalogItem = schemas[schemaName]
  if (!catalogItem?.properties) continue
  setPropDescription(
    schemaName,
    'key',
    '카탈로그 key = #{…} 안쪽 라벨. fail-closed 메시지 키와 동일.'
  )
  setPropDescription(
    schemaName,
    'token',
    '본문 삽입용 토큰. 예: #{교육 진행 수업 시간}. FE는 key가 아니라 token을 삽입.'
  )
  setPropDescription(
    schemaName,
    'requiresProgram',
    'true이면 programId 없이 enabled=false.'
  )
  setPropDescription(
    schemaName,
    'enabled',
    '삽입 허용 SSOT(값 존재와 무관). FE 재계산 금지. true여도 원천 데이터 없으면 발송 실패 가능.'
  )
  setPropDescription(
    schemaName,
    'participantTypes',
    '허용 참여 유형. 비면 제한 없음. PARTICIPANT|INSTRUCTOR|VOLUNTEER.'
  )
  setPropDescription(
    schemaName,
    'memberTypes',
    '허용 회원 유형. 비면 제한 없음. GENERAL|SCHOOL_TEACHER|INSTRUCTOR|TEACHER_AND_INSTRUCTOR|ADMIN.'
  )
}

const templateVariablesPath = paths['/api/admin/notification-send-batches/template-variables']
const getOp = templateVariablesPath?.get
if (getOp?.parameters) {
  const byName = Object.fromEntries(
    getOp.parameters.filter(p => p?.name).map(p => [p.name, p])
  )

  const enrich = (name, description, enumValues) => {
    const param = byName[name]
    if (!param?.schema) {
      console.warn(`skip query ${name}: not found`)
      return
    }
    let changed = false
    if (param.description !== description) {
      param.description = description
      changed = true
    }
    if (enumValues?.length) {
      const prev = Array.isArray(param.schema.enum) ? param.schema.enum.join(',') : ''
      const next = enumValues.join(',')
      if (prev !== next) {
        param.schema.enum = [...enumValues]
        changed = true
      }
    }
    if (changed) patched += 1
  }

  enrich(
    'programId',
    '대상 프로그램 id. 미지정(전체)이면 requiresProgram 항목은 enabled=false.',
    undefined
  )
  enrich(
    'participantType',
    '프로그램 선택 시 참여 유형 필터. PARTICIPANT|INSTRUCTOR|VOLUNTEER.',
    ['PARTICIPANT', 'INSTRUCTOR', 'VOLUNTEER']
  )
  enrich(
    'memberType',
    '프로그램 미선택(전체) 시 회원 유형 필터.',
    ['GENERAL', 'SCHOOL_TEACHER', 'INSTRUCTOR', 'TEACHER_AND_INSTRUCTOR', 'ADMIN']
  )
  enrich(
    'category',
    '카탈로그 카테고리 코드.',
    [
      'NAME',
      'EMAIL',
      'PHONE',
      'STATUS',
      'TYPE',
      'DATE',
      'TIME',
      'PLACE',
      'TARGET',
      'QUANTITY',
      'AMOUNT',
    ]
  )
  enrich('keyword', 'key/description 부분 검색.', undefined)

  if (!getOp['x-jakorea-fe-notes']) {
    getOp['x-jakorea-fe-notes'] =
      'enabled=삽입 허용 SSOT(값 존재와 무관). 누락 시 NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키}[,{키2}]. QA programId=164003 actorId=1799401.'
    patched += 1
  }
}

writeFileSync(inputPath, `${JSON.stringify(spec, null, 2)}\n`)
console.log(`patched notification template-variables openapi (${patched} changes)`)
