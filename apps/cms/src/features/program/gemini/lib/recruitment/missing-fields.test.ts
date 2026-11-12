import { describe, expect, it } from 'vitest'
import { createDefaultGeminiRecruitmentAddFormSnapshot } from './add-local-save'
import {
  isGeminiRecruitmentInstitutionComplete,
  listGeminiRecruitmentInstitutionMissingFields,
} from './snapshot-from-overlay'
import { GEMINI_RECRUITMENT_VALIDATION_KEYS } from './validation-keys'

function filled() {
  return {
    ...createDefaultGeminiRecruitmentAddFormSnapshot(),
    title: '찾아가는 연수',
    announcementPublished: 'published' as const,
    educationTargetLevels: ['elementary'],
    educationTargetDetail: '초등 교사',
    applicationPeriodStart: '2026-11-01',
    applicationPeriodEnd: '2026-11-30',
    trainingRequestPeriodStart: '2026-12-01',
    trainingRequestPeriodEnd: '2026-12-31',
    minStudentCount: 10,
    educationForm: 'online' as const,
    inquiryContactName: '담당자',
    inquiryTel: '02-000-0000',
    inquiryEmail: 'a@example.com',
    notesNotApplicable: true,
    notes: '',
  }
}

describe('listGeminiRecruitmentInstitutionMissingFields (QA-0390)', () => {
  it('모두 입력하면 누락 항목이 없고 등록 가능 판정과 같다', () => {
    const snapshot = filled()
    expect(listGeminiRecruitmentInstitutionMissingFields(snapshot)).toEqual([])
    expect(isGeminiRecruitmentInstitutionComplete(snapshot)).toBe(true)
  })

  it('비고는 내용을 쓰거나 해당 없음을 골라야 한다', () => {
    const snapshot = { ...filled(), notesNotApplicable: false, notes: '  ' }
    expect(listGeminiRecruitmentInstitutionMissingFields(snapshot)).toEqual([
      { key: GEMINI_RECRUITMENT_VALIDATION_KEYS.notes, label: '비고(내용 입력 또는 해당 없음 선택)' },
    ])
    expect(isGeminiRecruitmentInstitutionComplete(snapshot)).toBe(false)
    expect(
      listGeminiRecruitmentInstitutionMissingFields({ ...snapshot, notes: '특이사항 없음' })
    ).toEqual([])
  })

  it('빠진 항목의 키와 라벨을 화면 순서대로 돌려준다', () => {
    const snapshot = {
      ...filled(),
      title: '',
      minStudentCount: 0,
      inquiryTel: '',
    }
    const missing = listGeminiRecruitmentInstitutionMissingFields(snapshot)
    expect(missing.map(field => field.label)).toEqual([
      '공고명',
      '최소 수강 인원',
      '문의처(담당자·Tel·E-mail)',
    ])
    expect(isGeminiRecruitmentInstitutionComplete(snapshot)).toBe(false)
  })

  it('미게시 공고는 모집·연수 요청 기간을 요구하지 않는다', () => {
    const snapshot = {
      ...filled(),
      announcementPublished: 'unpublished' as const,
      applicationPeriodStart: '',
      applicationPeriodEnd: '',
      trainingRequestPeriodStart: '',
      trainingRequestPeriodEnd: '',
    }
    expect(listGeminiRecruitmentInstitutionMissingFields(snapshot)).toEqual([])
  })
})
