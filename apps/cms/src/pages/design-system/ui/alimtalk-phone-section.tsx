import { AlimtalkPhonePreview } from '@/shared/ui/alimtalk-phone-preview'
import { DsDemo, DsSection } from './section'

export function AlimtalkPhoneSection() {
  return (
    <DsSection
      id="alimtalk-phone"
      title="AlimTalk phone preview"
      description="알림톡 미리보기용 휴대폰 프레임입니다. 크기 369×777. 헤더·본문·CTA는 props, 기기 크롬은 PNG입니다."
    >
      <p className="ds-note">
        SSOT: <code>shared/ui/alimtalk-phone-preview</code>. 소비처는 템플릿 미리보기 모달과 알림톡
        발송 풀페이지입니다. 발신명·본문·버튼 문구는 템플릿 값입니다. 「알림톡 도착」은 카카오 알림톡
        고정 라벨입니다.
      </p>
      <DsDemo label="AlimtalkPhonePreview · 강조 유형 선택 안 함">
        <AlimtalkPhonePreview
          senderName="JA KOREA"
          content="템플릿 내용 더미 텍스트입니다."
          extraContent="부가 정보 더미 텍스트입니다. 채널 추가하고 이 채널의 마케팅 메시지 등을 카카오톡으로 받기"
          buttons={[
            { variant: 'channel', label: '채널 추가' },
            { variant: 'default', label: '버튼명' },
          ]}
          quickLinks={['바로연결명', '바로연결명 02', '톡에서 예약하기']}
        />
      </DsDemo>
      <DsDemo label="AlimtalkPhonePreview · 템플릿 미선택 안내">
        <AlimtalkPhonePreview
          senderName="JA KOREA"
          content="알림톡은 미리 승인 받은 템플릿만 사용 가능합니다. 템플릿 제목을 선택하면 내용이 표시됩니다."
        />
      </DsDemo>
    </DsSection>
  )
}
