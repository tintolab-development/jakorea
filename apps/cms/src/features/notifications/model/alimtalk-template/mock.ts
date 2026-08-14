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
    content: SIGNUP_CONTENT,
    ctaLabel: 'JA 홈페이지 바로가기',
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
    content: PASSWORD_CONTENT,
    ctaLabel: 'JA 홈페이지 바로가기',
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
    content: APPLY_CONTENT,
    ctaLabel: 'JA 홈페이지 바로가기',
  },
]
