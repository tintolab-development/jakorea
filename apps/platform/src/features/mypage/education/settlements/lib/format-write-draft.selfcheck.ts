import assert from 'node:assert/strict'
import { buildSettlementWriteDraft } from './build-write-draft.ts'
import {
  formatSettlementAmountInput,
  formatSettlementEducationSessionProgress,
  formatSettlementResidentNumber,
  formatSettlementSessionBannerTitle,
  hasSettlementActivitySection,
  hasSettlementMealSection,
} from './format-write-draft.ts'

assert.equal(formatSettlementAmountInput('40,000', 30_000), '30,000')
assert.equal(formatSettlementAmountInput('30000', 30_000), '30,000')
assert.equal(formatSettlementAmountInput('29999', 30_000), '29,999')
assert.equal(formatSettlementAmountInput('40000'), '40,000')
assert.equal(formatSettlementAmountInput('40000', null), '40,000')
assert.equal(formatSettlementAmountInput('40000', 0), '40,000')
assert.equal(formatSettlementAmountInput('', 30_000), '')
assert.equal(formatSettlementAmountInput('abc', 30_000), '')

assert.equal(
  formatSettlementSessionBannerTitle(
    { institutionName: null, grade: null },
    '정산(개인/봉사자/강사)',
    { institutionOnly: true },
  ),
  '정산(개인/봉사자/강사)',
)
assert.equal(
  formatSettlementSessionBannerTitle(
    { institutionName: '서울초', grade: '3' },
    '기관 프로그램',
    { institutionOnly: true },
  ),
  '서울초 3학년',
)
assert.equal(
  formatSettlementSessionBannerTitle({ institutionName: null, grade: null }, '', {
    institutionOnly: true,
  }),
  '-',
)

const legacyMealDraft = {
  ...buildSettlementWriteDraft({
    applicationId: '1',
    sessionId: '2',
    isInstructor: true,
    name: '홍길동',
    homeAddress: '서울',
    homeAddressDetail: '',
    bank: '국민',
    accountNumber: '1',
    accountHolder: '홍길동',
    tripType: 'one_way',
    departTransit: '',
    departAmount: '',
    returnTransit: '',
    returnAmount: '',
    mealAmount: '30,000',
    mealFiles: ['주진2.png'],
    activityAmount: '23,000',
    activityFiles: ['act.png'],
  }),
}
legacyMealDraft.meal = { amount: '30,000', fileNames: ['주진2.png'] } as typeof legacyMealDraft.meal
legacyMealDraft.activity = {
  amount: '23,000',
  fileNames: ['act.png'],
} as typeof legacyMealDraft.activity
assert.equal(hasSettlementMealSection(legacyMealDraft), true)
assert.equal(hasSettlementActivitySection(legacyMealDraft), true)

// sessionNumber는 회차 번호 — 「N차시」로 표기하지 않는다
assert.equal(
  formatSettlementEducationSessionProgress({ sessionNumber: 3, sessionMeta: '10:00~11:20 3회차' }),
  '3회차, 10:00 ~ 11:20',
)
assert.equal(formatSettlementEducationSessionProgress({ sessionNumber: 0, sessionMeta: '10:00~11:20' }), '10:00 ~ 11:20')

// 제출 전 확인 — 서버가 가린 뒷자리 그대로, 정책 표기 000915-1****** (하이픈 앞뒤 공백 없음)
const residentDraft = buildSettlementWriteDraft({
  applicationId: '1',
  sessionId: '2',
  isInstructor: true,
  name: '홍길동',
  residentFront: '000915',
  residentBack: '1******',
  homeAddress: '서울',
  homeAddressDetail: '',
  bank: '국민',
  accountNumber: '1',
  accountHolder: '홍길동',
  tripType: 'one_way',
  departTransit: '',
  departAmount: '',
  returnTransit: '',
  returnAmount: '',
  mealAmount: '',
  mealFiles: [],
  activityAmount: '',
  activityFiles: [],
})
assert.equal(formatSettlementResidentNumber(residentDraft), '000915-1******')

console.log('format-write-draft.selfcheck: ok')
