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

export const ALIMTALK_CATEGORY_MOCK: AlimtalkCategory[] = [
  { id: 'cat-notice', name: '전체 공지', parentId: ALIMTALK_ROOT_CATEGORY_ID },
  { id: 'cat-system', name: '시스템 안내', parentId: 'cat-notice' },
  { id: 'cat-program', name: '프로그램 안내', parentId: ALIMTALK_ROOT_CATEGORY_ID },
  { id: 'cat-test-01', name: 'test 01', parentId: 'cat-program' },
  { id: 'cat-test-02', name: 'test 02', parentId: 'cat-test-01' },
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
    extraInfo: EXTRA_INFO,
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
    extraInfo: EXTRA_INFO,
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
    extraInfo: EXTRA_INFO,
    ctaLabel: '버튼명',
    buttons: NONE_BUTTONS,
    quickLinks: NONE_QUICK_LINKS,
  },
]
