import alimtalkImageEmphasisBanner from '@/assets/images/message/alimtalk-image-emphasis-banner.png'
import alimtalkItemListThumb from '@/assets/images/message/alimtalk-item-list-thumb.png'
import { ALIMTALK_ROOT_CATEGORY_ID, type AlimtalkCategory, type AlimtalkTemplateItem } from './types'

const SIGNUP_CONTENT = `안녕하세요, JA Korea입니다.

회원님의 가입을 진심으로 환영합니다.

서비스 이용 안내 및 문의사항은 고객센터로 연락해 주세요.

감사합니다.`

const PASSWORD_CONTENT = `안녕하세요, JA Korea입니다.

비밀번호 변경이 완료되었습니다.

본인이 요청하지 않은 변경이라면 고객센터로 즉시 문의해 주세요.

감사합니다.`

const APPLY_CONTENT = `안녕하세요, JA Korea입니다.

프로그램 신청이 정상적으로 접수되었습니다.

신청 내역은 마이페이지에서 확인할 수 있습니다.

감사합니다.`

const DEMO_URL =
  'https://console.nhncloud.com/project/eSpBZ77a/notification/notification-hub#template'

const WEB_DESTINATIONS = { pc: DEMO_URL, mobile: DEMO_URL }

const APP_DESTINATIONS = {
  pc: DEMO_URL,
  mobile: DEMO_URL,
  android: DEMO_URL,
  ios: DEMO_URL,
}

const NONE_BUTTONS: AlimtalkTemplateItem['buttons'] = [
  { typeLabel: '채널 추가', name: '채널 추가', variant: 'channel' },
  {
    typeLabel: '웹 링크',
    name: 'test sample',
    variant: 'default',
    destinations: WEB_DESTINATIONS,
  },
  {
    typeLabel: '앱 링크',
    name: 'test sample',
    variant: 'default',
    destinations: APP_DESTINATIONS,
  },
  { typeLabel: '배송 조회', name: 'test sample', variant: 'default' },
  { typeLabel: '봇 키워드', name: 'test sample', variant: 'default' },
  { typeLabel: '메시지 전달', name: 'test sample', variant: 'default' },
  { typeLabel: '상담톡 전환', name: 'test sample', variant: 'default' },
  { typeLabel: '봇 전환', name: 'test sample', variant: 'default' },
  {
    typeLabel: '이미지 보안 전송 플러그인',
    name: 'test sample',
    variant: 'default',
    pluginId: 'jakorea',
  },
  {
    typeLabel: '개인정보 이용 플러그인',
    name: 'test sample',
    variant: 'default',
    pluginId: 'jakorea',
  },
]

const BASIC_BUTTONS: AlimtalkTemplateItem['buttons'] = NONE_BUTTONS.filter(
  button => button.variant !== 'channel'
)

const EXTRA_INFO = '부가 정보 더미 텍스트입니다.'

const EMPHASIS_TEXT_CONTENT = `템플릿 내용 더미 텍스트입니다.
템플릿 내용 더미 2줄 텍스트입니다.`

const EMPHASIS_TEXT_EXTRA_INFO = `부가 정보 더미 텍스트입니다.
부가 정보 더미 2줄 텍스트입니다.`

const NONE_QUICK_LINKS: AlimtalkTemplateItem['quickLinks'] = [
  { typeLabel: '웹 링크', name: '바로연결명', destinations: WEB_DESTINATIONS },
  { typeLabel: '앱 링크', name: '바로연결명 02', destinations: APP_DESTINATIONS },
  { typeLabel: '봇 키워드', name: 'test sample' },
  { typeLabel: '상담톡 전환', name: 'test sample' },
  { typeLabel: '봇 전환', name: 'test sample' },
  {
    typeLabel: '비즈니스 폼',
    name: '톡에서 예약하기',
    businessFormId: 'jakorea',
  },
]

const EMPHASIS_TEXT_BUTTONS: AlimtalkTemplateItem['buttons'] = [
  { typeLabel: '채널 추가', name: '채널 추가', variant: 'channel' },
  {
    typeLabel: '웹 링크',
    name: '버튼명',
    variant: 'default',
    destinations: WEB_DESTINATIONS,
  },
]

const EMPHASIS_TEXT_QUICK_LINKS: AlimtalkTemplateItem['quickLinks'] = [
  { typeLabel: '웹 링크', name: '바로연결명', destinations: WEB_DESTINATIONS },
]

export const ALIMTALK_CATEGORY_MOCK: AlimtalkCategory[] = [
  { id: 'cat-notice', name: '전체 공지', parentId: ALIMTALK_ROOT_CATEGORY_ID },
  { id: 'cat-system', name: '시스템 안내', parentId: 'cat-notice' },
  { id: 'cat-program', name: '프로그램 안내', parentId: ALIMTALK_ROOT_CATEGORY_ID },
  { id: 'cat-test-01', name: 'test 01', parentId: 'cat-program' },
  { id: 'cat-test-02', name: 'test 02', parentId: 'cat-test-01' },
  { id: 'cat-service', name: '서비스이용', parentId: ALIMTALK_ROOT_CATEGORY_ID },
  { id: 'cat-service-guide', name: '이용안내/공지', parentId: 'cat-service' },
]

export const ALIMTALK_TEMPLATE_ITEM_MOCK: AlimtalkTemplateItem[] = [
  {
    id: 'tpl-signup',
    name: '회원가입 안내',
    templateName: '회원가입 안내',
    categoryId: 'cat-system',
    registeredAt: '2026-09-15T09:15:00',
    updatedAt: '2026-09-15T09:15:00',
    senderProfile: 'JA KOREA',
    messageType: 'BASIC',
    emphasisType: 'NONE',
    isSecurityTemplate: false,
    content: SIGNUP_CONTENT,
    extraInfo: '',
    ctaLabel: 'JA 홈페이지 바로가기',
    buttons: BASIC_BUTTONS,
    quickLinks: NONE_QUICK_LINKS,
  },
  {
    id: 'tpl-password',
    name: '비밀번호 변경 안내',
    templateName: 'JA Company Of the Year 2차 교육 워크숍 수강 안내',
    categoryId: 'cat-notice',
    registeredAt: '2026-09-15T09:15:00',
    updatedAt: '2026-09-15T09:15:00',
    senderProfile: 'JA KOREA',
    messageType: 'BASIC',
    emphasisType: 'NONE',
    isSecurityTemplate: false,
    content: PASSWORD_CONTENT,
    extraInfo: '',
    ctaLabel: 'JA 홈페이지 바로가기',
    buttons: BASIC_BUTTONS,
    quickLinks: NONE_QUICK_LINKS,
  },
  {
    id: 'tpl-apply',
    name: '프로그램 신청 안내',
    templateName: '프로그램 신청 안내',
    categoryId: 'cat-program',
    registeredAt: '2026-09-15T09:15:00',
    updatedAt: '2026-09-15T09:15:00',
    senderProfile: 'JA KOREA',
    messageType: 'BASIC',
    emphasisType: 'NONE',
    isSecurityTemplate: false,
    content: APPLY_CONTENT,
    extraInfo: '',
    ctaLabel: 'JA 홈페이지 바로가기',
    buttons: BASIC_BUTTONS,
    quickLinks: NONE_QUICK_LINKS,
  },
  {
    id: 'tpl-extra-info',
    name: '부가 정보형 안내',
    templateName: '템플릿 내용 더미 (부가 정보형)',
    categoryId: 'cat-notice',
    registeredAt: '2026-09-15T09:15:00',
    updatedAt: '2026-09-15T09:15:00',
    senderProfile: 'JA KOREA',
    messageType: 'EXTRA_INFO',
    emphasisType: 'NONE',
    isSecurityTemplate: false,
    content: '템플릿 내용 더미 텍스트입니다.',
    extraInfo: EXTRA_INFO,
    ctaLabel: 'JA 홈페이지 바로가기',
    buttons: BASIC_BUTTONS,
    quickLinks: NONE_QUICK_LINKS,
  },
  {
    id: 'tpl-emphasis-none',
    name: '강조 유형 선택 안 함',
    templateName: '템플릿 내용 더미 (선택 안 함)',
    categoryId: 'cat-notice',
    registeredAt: '2026-09-15T09:15:00',
    updatedAt: '2026-09-15T09:15:00',
    senderProfile: 'JA KOREA',
    messageType: 'COMPLEX',
    emphasisType: 'NONE',
    isSecurityTemplate: false,
    content: '템플릿 내용 더미 텍스트입니다.',
    extraInfo: EXTRA_INFO,
    ctaLabel: '버튼명',
    buttons: NONE_BUTTONS,
    quickLinks: NONE_QUICK_LINKS,
  },
  {
    id: 'tpl-channel-add',
    name: '채널 추가형 안내',
    templateName: '채널 추가형 더미',
    categoryId: 'cat-notice',
    registeredAt: '2026-09-15T09:15:00',
    updatedAt: '2026-09-15T09:15:00',
    senderProfile: 'JA KOREA',
    messageType: 'CHANNEL_ADD',
    emphasisType: 'NONE',
    isSecurityTemplate: false,
    content: '템플릿 내용 더미 텍스트입니다.',
    extraInfo: '',
    ctaLabel: '버튼명',
    buttons: NONE_BUTTONS,
    quickLinks: NONE_QUICK_LINKS,
  },
  {
    id: 'tpl-emphasis-text',
    name: '강조 표기형 안내',
    templateName: '템플릿 내용 더미 (강조 표기형)',
    categoryId: 'cat-service-guide',
    registeredAt: '2026-09-15T09:15:00',
    updatedAt: '2026-09-15T09:15:00',
    senderProfile: 'JA KOREA',
    messageType: 'COMPLEX',
    emphasisType: 'TEXT',
    emphasisTitle: '템플릿 강조 제목 더미 텍스트 (최대 50자까지 작성 가능)',
    emphasisSubtitle: '템플릿 강조 부제목 더미 텍스트 (최대 50자까지 작성 가능)',
    isSecurityTemplate: false,
    content: EMPHASIS_TEXT_CONTENT,
    extraInfo: EMPHASIS_TEXT_EXTRA_INFO,
    ctaLabel: '버튼명',
    buttons: EMPHASIS_TEXT_BUTTONS,
    quickLinks: EMPHASIS_TEXT_QUICK_LINKS,
  },
  {
    id: 'tpl-emphasis-image',
    name: '이미지형 안내',
    templateName: '템플릿 내용 더미 (이미지형)',
    categoryId: 'cat-service-guide',
    registeredAt: '2026-09-15T09:15:00',
    updatedAt: '2026-09-15T09:15:00',
    senderProfile: 'JA KOREA',
    messageType: 'COMPLEX',
    emphasisType: 'IMAGE',
    imageUrl: alimtalkImageEmphasisBanner,
    imageFileName: 'banner_test image.png',
    isSecurityTemplate: false,
    content: '템플릿 내용 더미 텍스트입니다.',
    extraInfo: EXTRA_INFO,
    ctaLabel: '버튼명',
    buttons: EMPHASIS_TEXT_BUTTONS,
    quickLinks: EMPHASIS_TEXT_QUICK_LINKS,
  },
  {
    id: 'tpl-emphasis-item-list',
    name: '아이템 리스트형 안내',
    templateName: '템플릿 내용 더미 (아이템 리스트형)',
    categoryId: 'cat-service-guide',
    registeredAt: '2026-09-15T09:15:00',
    updatedAt: '2026-09-15T09:15:00',
    senderProfile: 'JA KOREA',
    messageType: 'COMPLEX',
    emphasisType: 'ITEM_LIST',
    imageUrl: alimtalkImageEmphasisBanner,
    imageFileName: 'banner_test image.png',
    templateHeader: '템플릿 헤더 텍스트',
    itemTitle: '아이템 제목 팔구십일이삼사오육칠팔구십일',
    itemDescription: '아이템 설명 팔구십일이삼',
    itemImageUrl: alimtalkItemListThumb,
    itemImageFileName: 'item_highlight_test image.png',
    itemList: [
      { name: '아이템명 01', content: '아이템 내용 01 일이삼사오육칠팔구십일이삼' },
      { name: '아이템명 02', content: '아이템 내용 02' },
    ],
    itemSummary: { name: '일이삼사오육', content: '일이삼사오육칠팔구십일이삼사' },
    isSecurityTemplate: false,
    content: '템플릿 내용 더미 텍스트입니다.',
    extraInfo: EXTRA_INFO,
    ctaLabel: '채널 추가',
    buttons: [{ typeLabel: '채널 추가', name: '채널 추가', variant: 'channel' }],
    quickLinks: EMPHASIS_TEXT_QUICK_LINKS,
  },
]

/** 알림톡 발송 템플릿 선택 팝업용 — 템플릿 목록 mock과 동일 데이터 */
export const ALIMTALK_SEND_TEMPLATE_PICKER_MOCK: AlimtalkTemplateItem[] =
  ALIMTALK_TEMPLATE_ITEM_MOCK
