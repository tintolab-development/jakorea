import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * CMS-29 신청 상세 수정 취소 — 화면별 배선 계약.
 * 동작(동기 캐시 초기화·onRemask 호출 시점)은 use-personal-info-reveal.purpose.test.tsx가 검증한다.
 */
const here = dirname(fileURLToPath(import.meta.url))
const src = (rel: string) => readFileSync(join(here, rel), 'utf8')

const SCREENS = {
  school: src('school-detail-fullpage-view.tsx'),
  participant: src('participating-participant-fullpage-view.tsx'),
  trainedTeacher: src(
    '../../../../trained-teachers/ui/institution-detail/participating-institution-detail-view.tsx'
  ),
  applicant: src('../../../../shared/ui/program-detail/applicant-list/applicants-detail-contents.tsx'),
}

describe('신청 상세 수정 취소 재마스킹 배선 (CMS-29)', () => {
  it.each(['school', 'participant', 'trainedTeacher'] as const)(
    '%s: 수정 취소 버튼은 열람 해제 래퍼를 쓴다',
    name => {
      const s = SCREENS[name]
      expect(s).toContain('onCancel={cancelApplicationInfoEditAndRemask}')
      expect(s).not.toContain('onCancel={cancelApplicationInfoEdit}')
    }
  )

  it('신청자 상세: 기관 수정 취소는 원문 교사 정보 상태와 열람을 함께 해제한다', () => {
    const s = SCREENS.applicant
    expect(s).toContain('onCancelInstitutionEdit: cancelInstitutionEditAndRemask')
    expect(s).toMatch(/setInstitutionTeacherPrivacy\(null\)\s*\n\s*remaskPersonalInfo\(\)/)
  })

  it.each(['school', 'trainedTeacher'] as const)(
    '%s: 원문은 부모 savedBasicPatches로 올리지 않고 onRemask로 지우는 오버레이에만 둔다',
    name => {
      const s = SCREENS[name]
      expect(s).toContain('onRemask: clearTeacherPrivacyOverlay')
      const apply = s.slice(
        s.indexOf('const applyInstitutionTeacherPersonalInfo'),
        s.indexOf('const applyInstitutionTeacherPersonalInfo') + 1600
      )
      expect(apply).toContain('setTeacherPrivacyOverlay(')
      expect(apply).not.toContain('onSaveBasicInfo')
      // 렌더 뒤 effect로 지우는 fallback 금지
      expect(s).not.toMatch(/useEffect\(\(\) => \{\s*if \(!personalInfoRevealed\) setTeacherPrivacyOverlay/)
    }
  )

  it('참여자 상세: 원문은 participantPatches와 분리된 오버레이에 두고 onRemask로 지운다', () => {
    const s = SCREENS.participant
    expect(s).toContain('onRemask: clearRevealedParticipantPatch')
    expect(s).toContain('setRevealedParticipantPatch(prev => ({')
  })
})

describe('신청 상세 저장 성공 재마스킹 배선 (Step 5 잔여 위험)', () => {
  it('참여자: 저장 콜백은 개인정보 제외 패치를 쓰고 같은 동기 블록에서 열람을 끝낸다', () => {
    const s = SCREENS.participant
    const saved = s.slice(s.indexOf('const handleParticipantSaved'), s.indexOf('const handleParticipantSaved') + 900)
    expect(saved).toContain('buildParticipantSavedPatch(prev, updatedRow)')
    expect(saved).toContain('remaskPersonalInfo()')
    expect(saved).not.toContain('detail: updatedRow.detail')
    // 참여자 목록·부모 캐시에 저장 응답을 쓰지 않는다
    expect(s).not.toMatch(/setQueryData\(\s*generalProgramProgressQueryKeys\.participants/)
  })

  it.each(['school', 'trainedTeacher'] as const)(
    '%s: 저장 성공 콜백 안에서 동기 재마스킹하고 .then 이후 정리는 없다',
    name => {
      const s = SCREENS[name]
      expect(s).toContain('onSaveBasicInfo: handleApplicationInfoSaved,')
      expect(s).toContain('remaskAfterSaveRef.current = remaskPersonalInfo')
      expect(s).not.toContain('if (result === true) endTeacherPrivacyReveal()')
    }
  )
})
