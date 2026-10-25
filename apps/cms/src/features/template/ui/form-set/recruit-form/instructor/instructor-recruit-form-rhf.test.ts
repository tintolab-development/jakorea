// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { applyOperationalOverlayForCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import { resetAllOperationalOverlayStores } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import {
  instructorApplicationFieldForm,
  isInstructorApplicationFieldKey,
} from '@/features/template/ui/form-set/application-form/instructor/instructor-application-form-rhf'
import { recruitDetailInfoFieldForm } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-form-rhf'
import {
  instructorRecruitFieldForm,
  isInstructorRecruitFieldKey,
} from './instructor-recruit-form-rhf'

describe('강사 모집·신청 RHF 필드 폼 (part3 step4·5)', () => {
  beforeEach(() => {
    resetAllOperationalOverlayStores()
  })

  it('소유 키: 강사 모집 텍스트 키만, 미디어·다른 유형 제외', () => {
    expect(isInstructorRecruitFieldKey('recruit.instructor.notes')).toBe(true)
    // 5단계부터 상세정보(텍스트·미디어)는 공용 상세정보 폼 소유
    expect(isInstructorRecruitFieldKey('recruitInstructor.detailInfo.programDescription')).toBe(false)
    expect(isInstructorRecruitFieldKey('recruitInstructor.detailInfo.thumbFileObjectId')).toBe(false)
    expect(isInstructorRecruitFieldKey('recruitInstructor.detailInfo.attachmentFileObjectIds')).toBe(false)
    expect(isInstructorRecruitFieldKey('recruit.individual.notes')).toBe(false)
    expect(isInstructorRecruitFieldKey('recruit.volunteer.notes')).toBe(false)
    expect(isInstructorApplicationFieldKey('application.instructor.selectedSlotIds')).toBe(true)
    expect(isInstructorApplicationFieldKey('application.volunteer.selectedSlotIds')).toBe(false)
  })

  it('양식 불러오기 값은 스토어 버킷이 아니라 RHF 필드 폼에 들어간다', () => {
    applyOperationalOverlayForCatalogId('recruitment-instructor', {
      'recruit.instructor.notes': '비고',
      'recruitInstructor.detailInfo.otherNotes': '<p>기타</p>',
      'recruitInstructor.detailInfo.thumbFileObjectId': 3,
    })
    applyOperationalOverlayForCatalogId('application-instructor', {
      'application.instructor.crimeRecordConfirmed': true,
    })
    expect(instructorRecruitFieldForm.peekRecord('recruitment-instructor')).toEqual({
      'recruit.instructor.notes': '비고',
    })
    expect(recruitDetailInfoFieldForm.peekRecord('recruitment-instructor')).toEqual({
      'recruitInstructor.detailInfo.otherNotes': '<p>기타</p>',
      'recruitInstructor.detailInfo.thumbFileObjectId': 3,
    })
    expect(instructorApplicationFieldForm.peekRecord('application-instructor')).toEqual({
      'application.instructor.crimeRecordConfirmed': true,
    })
  })
})
