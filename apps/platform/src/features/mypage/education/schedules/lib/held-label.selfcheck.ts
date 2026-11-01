import assert from 'node:assert/strict'
import { joinEducationScheduleDateAndTime } from './held-label.ts'

const date = '2026년 10월 31일(토)'

// startAt~endAt 폴백 라벨은 이미 날짜를 포함 → 날짜 중복 금지
assert.equal(
  joinEducationScheduleDateAndTime(date, '2026년 10월 31일(토) 21:20 ~ 21:22'),
  '2026년 10월 31일(토) 21:20 ~ 21:22',
)
// 시간만 있는 라벨은 날짜 뒤에 붙인다
assert.equal(joinEducationScheduleDateAndTime(date, '21:20 ~ 21:22'), `${date} 21:20 ~ 21:22`)
// 그룹 시간 라벨
assert.equal(
  joinEducationScheduleDateAndTime(date, '그룹 A : 10:00 ~ 11:00 | 그룹 B : 13:00 ~ 14:00'),
  `${date} 그룹 A : 10:00 ~ 11:00 | 그룹 B : 13:00 ~ 14:00`,
)
assert.equal(joinEducationScheduleDateAndTime(date, undefined), date)
assert.equal(joinEducationScheduleDateAndTime(date, '  '), date)
assert.equal(joinEducationScheduleDateAndTime(date, date), date)

console.log('held-label.selfcheck: ok')
