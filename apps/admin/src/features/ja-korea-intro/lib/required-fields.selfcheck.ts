import assert from 'node:assert/strict'
import type { JaKoreaIntro } from '../../../entities/ja-korea-intro/model/types.ts'
import { hasIncompleteRequiredJaKoreaIntroFields } from './required-fields.ts'

const filled: JaKoreaIntro = {
  section01: { mainTitle: 'JA', subTitle: '소개' },
  section02: {
    titlePhrase: 'Inspire',
    subTitle: '영감',
    content01: { title: 'c1', description: 'd1' },
    content02: { title: 'c2', description: 'd2' },
  },
  vision: { topSubText: 'v-sub', mainText: 'v-main' },
  mission: { topSubText: 'm-sub', mainText: 'm-main' },
  updatedAt: '',
  version: 1,
}

assert.equal(hasIncompleteRequiredJaKoreaIntroFields(filled), false)
assert.equal(
  hasIncompleteRequiredJaKoreaIntroFields({
    ...filled,
    section01: { ...filled.section01, mainTitle: '   ' },
  }),
  true,
)
assert.equal(
  hasIncompleteRequiredJaKoreaIntroFields({
    ...filled,
    section02: {
      ...filled.section02,
      content01: { ...filled.section02.content01, description: '' },
    },
  }),
  true,
)
assert.equal(
  hasIncompleteRequiredJaKoreaIntroFields({
    ...filled,
    mission: { ...filled.mission, mainText: '' },
  }),
  true,
)

console.log('ja-korea-intro required-fields.selfcheck: ok')
