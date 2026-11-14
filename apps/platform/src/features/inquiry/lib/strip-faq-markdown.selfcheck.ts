import assert from 'node:assert/strict'
import { stripFaqMarkdown } from './strip-faq-markdown.ts'

assert.equal(
  stripFaqMarkdown('### 01. 프로그램은 어떻게 신청하나요?'),
  '01. 프로그램은 어떻게 신청하나요?',
)
assert.equal(stripFaqMarkdown('**회원가입** 후 신청합니다.'), '회원가입 후 신청합니다.')

console.log('strip-faq-markdown selfcheck: ok')
