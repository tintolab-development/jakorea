/**
 * TT 포털 신청 Draft PUT 계약 — 신청 UI에 임시저장 버튼이 없어도 API client 경로는 유지된다.
 * 실행: node --experimental-strip-types --experimental-transform-types src/features/program/api/application-client.draft-contract.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS as IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'
import type { PortalSaveApplicationRequest } from './application-types.ts'

const here = dirname(fileURLToPath(import.meta.url))
const clientSource = readFileSync(join(here, 'application-client.ts'), 'utf8')
const applyPageSource = readFileSync(
  join(here, '../../../pages/programs/apply/page.tsx'),
  'utf8'
)

const draftBody: PortalSaveApplicationRequest = {
  recruitmentId: 92011,
  applicationType: 'ORGANIZATION',
  formBindingId: 93011,
  answers: {
    [IDS.personalInfoCollection]: { bottomConsent: 'agree' },
    [IDS.thirdPartyConsent]: { bottomConsent: 'agree' },
    [IDS.basicInfo]: {
      schoolName: '격리 학교',
      applicationGrade: '1',
      classCount: 1,
      studentCount: 20,
      applicationReason: '격리 P4B 신청 사유',
    },
    [IDS.preferredSchedule]: ['tt-sched-1'],
  },
  preferredScheduleBlocks: [
    {
      date: '2026-04-01',
      times: [{ classPeriod: '1', start: '10:00', end: '12:00' }],
    },
  ],
}

assert.equal(draftBody.recruitmentId, 92011)
assert.equal(draftBody.applicationType, 'ORGANIZATION')
assert.equal(draftBody.formBindingId, 93011)
assert.ok(clientSource.includes('export async function savePortalApplicationDraft('))
assert.ok(clientSource.includes('export async function submitPortalApplication('))
assert.ok(clientSource.includes('axiosClient.put<unknown>('))
assert.ok(clientSource.includes('`${PORTAL_PROGRAMS_PATH}/${programId}/applications/draft`'))
assert.ok(clientSource.includes('axiosClient.post<unknown>('))
assert.ok(clientSource.includes('`${PORTAL_PROGRAMS_PATH}/${programId}/applications`'))
assert.ok(clientSource.includes('body: PortalSaveApplicationRequest'))
assert.ok(clientSource.includes('`${PORTAL_PROGRAMS_PATH}/${programId}/form-bindings/${bindingId}`'))
assert.ok(clientSource.includes('recruitmentId: query.recruitmentId'))
assert.ok(clientSource.includes('applicationType: query.applicationType'))
assert.equal(clientSource.includes('/api/portal/me/'), false)
assert.equal(/form-bindings\/\$\{[^}]+}\/render/.test(clientSource), false)
assert.equal(applyPageSource.includes('임시저장'), false)
assert.equal(applyPageSource.includes('임시 저장'), false)
assert.ok(applyPageSource.includes('신청하기'))
assert.ok(applyPageSource.includes('submitMutation'))
assert.equal(applyPageSource.includes('savePortalApplicationDraft'), false)
assert.equal(applyPageSource.includes('/api/portal/me/'), false)
assert.equal(/form-bindings\/\$\{[^}]+}\/render/.test(applyPageSource), false)

console.log('PORTAL_DRAFT_UI_AVAILABLE=false')
console.log('PORTAL_DRAFT_API_CLIENT_CONTRACT=PASS')
