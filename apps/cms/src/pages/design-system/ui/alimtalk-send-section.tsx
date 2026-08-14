import { useState } from 'react'
import { SendFullpageModal } from '@/features/notifications/ui/alimtalk-send/fullpage-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { DsDemo, DsSection } from './section'

export function AlimtalkSendSection() {
  const [open, setOpen] = useState(false)

  return (
    <DsSection
      id="alimtalk-send"
      title="AlimTalk send fullpage"
      description="알림톡 발송 전용 풀페이지입니다. 템플릿 양식 미리보기 풀페이지와 셸·패딩을 공유하지 않습니다."
    >
      <p className="ds-note">
        SSOT: <code>features/notifications/ui/alimtalk-send</code>. 목록에서는{' '}
        <code>?modal=send</code>로 열고 닫습니다. 캔버스는 뷰포트 폭 100% · padding{' '}
        <code>32px 52px</code> · 단락 gap 32px · 하단 52px 스페이서입니다.
        <br />
        위젯: padding 20px · radius 16px · shadow <code>0 0 16px rgba(0,0,0,0.06)</code> · 제목
        20/700/140%. 1·3번은 <code>DetailInfoForm</code> 표. 4번은 제목·휴대폰 상단 정렬, 내용 영역·휴대폰
        하단 정렬(높이 777px).
        <br />
        취소는 <code>CmsButton variant=&quot;cancel&quot;</code> large 140×44. 수신자 액션은
        disabled 없이 안내·준비 중 Alert입니다.
      </p>
      <DsDemo label="SendFullpageModal">
        <CmsButton variant="primary" size="large" type="button" onClick={() => setOpen(true)}>
          알림톡 발송 열기
        </CmsButton>
      </DsDemo>
      <SendFullpageModal open={open} onClose={() => setOpen(false)} />
    </DsSection>
  )
}
