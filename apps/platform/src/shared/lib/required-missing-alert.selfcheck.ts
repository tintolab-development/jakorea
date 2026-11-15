import assert from 'node:assert/strict'
import {
  buildRequiredMissingAlertCopy,
  REQUIRED_QUESTION_NOT_ANSWERED_TITLE,
  summarizeRequiredMissingAlertCopy,
} from './required-missing-alert.ts'
import { PLATFORM_REQUIRED_NOT_FILLED_TITLE } from './platform-alert-copy.ts'

// 시안 14550-2349 — 입력 항목 1개
assert.deepEqual(buildRequiredMissingAlertCopy({ kind: 'field', labels: ['휴대폰 번호'] }), {
  title: PLATFORM_REQUIRED_NOT_FILLED_TITLE,
  description: '‘휴대폰 번호’ 항목을 입력해 주세요.',
})

// 입력 항목 여러 개 — 목록 + 안내
assert.deepEqual(
  buildRequiredMissingAlertCopy({ kind: 'field', labels: ['휴대폰 번호', '이메일', '자택 주소지'] }),
  {
    title: PLATFORM_REQUIRED_NOT_FILLED_TITLE,
    list: { items: ['휴대폰 번호', '이메일', '자택 주소지'], guide: '위 항목을 모두 입력해 주세요.' },
  },
)

// 설문 문항 1개 — 제목 뒤 줄바꿈
const question = buildRequiredMissingAlertCopy({
  kind: 'question',
  labels: ['오리엔테이션에서 제공된 정보가 이해하기 쉬웠나요?'],
})
assert.equal(question.title, REQUIRED_QUESTION_NOT_ANSWERED_TITLE)
assert.equal(question.description, '‘오리엔테이션에서 제공된 정보가 이해하기 쉬웠나요?’\n문항에 답변해 주세요.')
assert.equal(
  summarizeRequiredMissingAlertCopy(question),
  '‘오리엔테이션에서 제공된 정보가 이해하기 쉬웠나요?’ 문항에 답변해 주세요.',
)

// 설문 문항 여러 개
assert.deepEqual(
  buildRequiredMissingAlertCopy({ kind: 'question', labels: ['문항 A', '문항 B'] }).list,
  { items: ['문항 A', '문항 B'], guide: '위 문항에 모두 답변해 주세요.' },
)

// 제목 없는 문항만 누락 — 공통 문구
assert.equal(
  buildRequiredMissingAlertCopy({ kind: 'question', labels: [] }).description,
  '필수 문항에 답변해 주세요.',
)

console.log('required-missing-alert.selfcheck: ok')
