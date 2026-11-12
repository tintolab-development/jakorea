import assert from 'node:assert/strict'
import { resolveEducationNoticeTitle, toEducationNoticePlainText } from './format.ts'

// CMS 에디터는 대괄호를 `\[ \]`로 이스케이프해 저장한다 — 목록 미리보기에는 원래 글자로 보여야 한다
assert.equal(toEducationNoticePlainText('\\[E2E\\] 안내사항입니다'), '[E2E] 안내사항입니다')
assert.equal(toEducationNoticePlainText('<p>\\[E2E\\] 안내</p>'), '[E2E] 안내')
assert.equal(toEducationNoticePlainText('\\[E2E\\](강사) 안내'), '[E2E](강사) 안내')
assert.equal(toEducationNoticePlainText('별표 \\*\\* 유지'), '별표 ** 유지')
assert.equal(toEducationNoticePlainText('경로 C:\\\\temp'), '경로 C:\\temp')
assert.equal(resolveEducationNoticeTitle('\\[E2E\\] 제목', ''), '[E2E] 제목')

// 기존 동작 유지
assert.equal(toEducationNoticePlainText('[링크](https://example.com) 확인'), '링크 확인')
assert.equal(toEducationNoticePlainText('**굵게** 텍스트'), '굵게 텍스트')
assert.equal(toEducationNoticePlainText('[E2E] 그대로'), '[E2E] 그대로')

console.log('format.selfcheck ok')
