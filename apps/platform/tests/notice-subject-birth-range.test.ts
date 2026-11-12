import { describe, expect, it } from 'vitest'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_NOTICE_SUBJECT_ITEM_IDS,
  type WritingFormDraft,
} from '@jakorea/form-schema/writing-form'
import { getNoticeSubjectBirthRangeMessage } from '../src/features/mypage/instructor-apply/consent/notice-subject-birth-range'
import {
  BIRTH_DATE_FUTURE_MESSAGE,
  BIRTH_DATE_TOO_OLD_MESSAGE,
} from '../src/features/auth/sign-up/lib/birth-date-bounds'

const now = new Date('2026-11-12T10:00:00+09:00')

function draftWithBirth(birth: string): WritingFormDraft {
  return {
    paragraphs: [
      {
        id: AGREEMENT_NOTICE_PARAGRAPH_IDS.subject,
        kind: 'single_item',
        variant: 'short_essay',
        items: [
          { id: AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.name, bodyText: '홍길동' },
          { id: AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.birth, bodyText: birth },
        ],
      },
    ],
  } as unknown as WritingFormDraft
}

describe('행정정보 대상자 생년월일 범위', () => {
  it('오늘 이후·만 120세 초과면 안내 문구를 돌려준다', () => {
    expect(getNoticeSubjectBirthRangeMessage(draftWithBirth('2030.01.01'), now)).toBe(
      BIRTH_DATE_FUTURE_MESSAGE
    )
    expect(getNoticeSubjectBirthRangeMessage(draftWithBirth('1900.01.01'), now)).toBe(
      BIRTH_DATE_TOO_OLD_MESSAGE
    )
  })

  it('정상·빈 값·입력 중에는 안내하지 않는다', () => {
    expect(getNoticeSubjectBirthRangeMessage(draftWithBirth('1990.05.20'), now)).toBeNull()
    expect(getNoticeSubjectBirthRangeMessage(draftWithBirth(''), now)).toBeNull()
    expect(getNoticeSubjectBirthRangeMessage(draftWithBirth('2030.01'), now)).toBeNull()
  })

  it('대상자 단락이 없으면 안내하지 않는다', () => {
    expect(
      getNoticeSubjectBirthRangeMessage({ paragraphs: [] } as unknown as WritingFormDraft, now)
    ).toBeNull()
  })
})
