import { describe, expect, it } from 'vitest'
import {
  buildCombinedClassCancelCompleteDescription,
  buildCombinedClassCancelDescription,
  buildCombinedClassCompleteDescription,
  buildCombinedClassProcessDescription,
  formatCombinedClassLeadTeacherOptionLabel,
} from './combined-class-copy'

describe('combined class process copy', () => {
  it('합반 처리 안내는 학교와 두 학년을 포함한다', () => {
    expect(
      buildCombinedClassProcessDescription({
        schoolName: 'JA초등학교',
        leadGrade: '1학년',
        partnerGrade: '2학년',
      })
    ).toContain('**[JA초등학교] 1학년과 2학년**을 합반하시겠습니까?')
  })

  it('합반 반영 완료 안내는 파트너 학년이 리드 학년 신청 정보를 따른다고 알린다', () => {
    expect(
      buildCombinedClassCompleteDescription({
        leadGrade: 'A학년',
        partnerGrade: 'B학년',
      })
    ).toBe(
      '정보 수정이 완료되었습니다.\nB학년은 A학년의 신청 정보에 따라 합반 교육이 진행됩니다.'
    )
  })

  it('담당 교사 옵션은 학년 표기를 (N학년)으로 맞춘다', () => {
    expect(formatCombinedClassLeadTeacherOptionLabel('최지월', '1')).toBe('최지월 (1학년)')
    expect(formatCombinedClassLeadTeacherOptionLabel('윤정민', '2학년')).toBe('윤정민 (2학년)')
  })

  it('합반 취소 안내는 기존 합반 학년을 포함한다', () => {
    expect(
      buildCombinedClassCancelDescription({
        schoolName: 'JA초등학교',
        leadGrade: '1학년',
        partnerGrade: '2학년',
      })
    ).toBe('[JA초등학교] 1학년과 2학년 합반을 취소하시겠습니까?')
  })

  it('합반 취소 완료 안내는 취소된 학교와 학년을 알린다', () => {
    expect(
      buildCombinedClassCancelCompleteDescription({
        schoolName: 'JA초등학교',
        leadGrade: '1학년',
        partnerGrade: '2학년',
      })
    ).toBe(
      '정보 수정이 완료되었습니다.\n[JA초등학교] 1학년과 2학년 합반이 취소되었습니다.'
    )
  })
})
