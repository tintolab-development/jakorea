import { CmsButton } from '@/shared/ui'
import './program-registration-paragraph.css'

/**
 * 템플릿 관리 — 일반 프로그램 등록 폼 「교육 진행 일정 설정」 카드 제목 줄 우측 「일정 변경」(시안 02-x·03-x, h40·w120).
 * 시안 모양(활성 secondary) 그대로 보이되 동작은 없다: onClick 없음 + `aria-disabled`.
 * 회색 disabled 스타일을 쓰지 않으려고 `disabled` prop은 넘기지 않는다.
 * 카드 선택(클릭·Enter)으로 번지지 않게 래퍼에서 이벤트 전파를 막는다.
 */
export function EducationScheduleChangeInertButton() {
  return (
    <div
      className="program-registration-paragraph__card-title-actions"
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      role="presentation"
    >
      <CmsButton type="button" variant="secondary" size="medium" aria-disabled="true">
        일정 변경
      </CmsButton>
    </div>
  )
}
