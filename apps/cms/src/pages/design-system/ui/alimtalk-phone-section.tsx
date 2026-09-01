import alimtalkImageEmphasisBanner from '@/assets/images/message/alimtalk-image-emphasis-banner.png'
import alimtalkItemListThumb from '@/assets/images/message/alimtalk-item-list-thumb.png'
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
        고정 라벨입니다. 강조 유형은 <code>NONE</code> / <code>TEXT</code> / <code>IMAGE</code> /{' '}
        <code>ITEM_LIST</code>. 이미지형·아이템 리스트형은 헤더 직하 full-bleed 배너 —{' '}
        <code>height 140.5px</code> · <code>aspect-ratio 2/1</code> · <code>align-self stretch</code>.
        원본은 500px 이상·2:1. 아이템 리스트형은 템플릿 헤더 16/700 · 아이템 제목 16/400 · 설명 14/#888
        · 썸네일 50×50 1:1 세로 중앙 · 리스트 좌우 갭 22px · 값 우측 정렬 n줄 wrap. 복합형·채널
        추가형은 채널 추가 버튼이 있으면 안내 문구 대신 노란 CTA만 표시. nav(JA KOREA)는 고정 ·
        말풍선만 세로 스크롤(스크롤바 숨김).
      </p>
      <DsDemo label="AlimtalkPhonePreview · 강조 유형 선택 안 함">
        <AlimtalkPhonePreview
          senderName="JA KOREA"
          content="템플릿 내용 더미 텍스트입니다."
          extraContent="부가 정보 더미 텍스트입니다."
          messageType="COMPLEX"
          buttons={[{ variant: 'default', label: '버튼명' }]}
          quickLinks={['바로연결명', '바로연결명 02', '톡에서 예약하기']}
        />
      </DsDemo>
      <DsDemo label="AlimtalkPhonePreview · 강조 표기형">
        <AlimtalkPhonePreview
          senderName="JA KOREA"
          emphasisType="TEXT"
          emphasisSubtitle="템플릿 강조 부제목 더미 텍스트 (최대 50자까지 작성 가능)"
          emphasisTitle="템플릿 강조 제목 더미 텍스트 (최대 50자까지 작성 가능)"
          content={`템플릿 내용 더미 텍스트입니다.\n템플릿 내용 더미 2줄 텍스트입니다.`}
          extraContent={`부가 정보 더미 텍스트입니다.\n부가 정보 더미 2줄 텍스트입니다.`}
          messageType="COMPLEX"
          buttons={[{ variant: 'default', label: '버튼명' }]}
          quickLinks={['바로연결명']}
        />
      </DsDemo>
      <DsDemo label="AlimtalkPhonePreview · 이미지형">
        <AlimtalkPhonePreview
          senderName="JA KOREA"
          emphasisType="IMAGE"
          imageUrl={alimtalkImageEmphasisBanner}
          content="템플릿 내용 더미 텍스트입니다."
          extraContent="부가 정보 더미 텍스트입니다."
          messageType="COMPLEX"
          buttons={[{ variant: 'default', label: '버튼명' }]}
          quickLinks={['바로연결명']}
        />
      </DsDemo>
      <DsDemo label="AlimtalkPhonePreview · 아이템 리스트형">
        <AlimtalkPhonePreview
          senderName="JA KOREA"
          emphasisType="ITEM_LIST"
          imageUrl={alimtalkImageEmphasisBanner}
          templateHeader="템플릿 헤더 텍스트"
          itemTitle="아이템 제목 팔구십일이삼사오육칠팔구십일"
          itemDescription="아이템 설명 팔구십일이삼"
          itemImageUrl={alimtalkItemListThumb}
          itemList={[
            { name: '아이템명 01', content: '아이템 내용 01 일이삼사오육칠팔구십일이삼' },
            { name: '아이템명 02', content: '아이템 내용 02' },
          ]}
          itemSummary={{ name: '일이삼사오육', content: '일이삼사오육칠팔구십일이삼사' }}
          content="템플릿 내용 더미 텍스트입니다."
          extraContent="부가 정보 더미 텍스트입니다."
          messageType="COMPLEX"
          quickLinks={['바로연결명']}
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
