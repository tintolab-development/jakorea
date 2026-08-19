import { MAIL_ROOT_CATEGORY_ID, type MailCategory, type MailTemplateItem } from './types'

const WORKSHOP_BODY_HTML = `<p>안녕하세요, <strong><span style="color: #01A1AF; font-size: 15px">#{회원명}</span></strong>님 <strong><span style="color: #01A1AF; font-size: 15px">#{서비스명}</span></strong>입니다.</p><p>2026 JA Company Of the Year 2차 교육 워크숍 수강 안내드립니다.</p>`

export const MAIL_CATEGORY_MOCK: MailCategory[] = [
  { id: 'cat-notice', name: '전체 공지', parentId: MAIL_ROOT_CATEGORY_ID },
  { id: 'cat-system', name: '시스템 안내', parentId: 'cat-notice' },
  { id: 'cat-program', name: '프로그램 안내', parentId: MAIL_ROOT_CATEGORY_ID },
]

export const MAIL_TEMPLATE_ITEM_MOCK: MailTemplateItem[] = [
  {
    id: 'mail-tpl-signup',
    name: '회원가입 안내',
    templateName: '회원가입 안내',
    categoryId: 'cat-system',
    registeredAt: '2026-09-15T09:15:00',
    updatedAt: '2026-09-15T09:15:00',
    senderName: '홍길동',
    senderEmail: 'gildong@jakorea.org',
    subject: '[JA Korea] 회원가입 안내',
    bodyHtml:
      '<p>안녕하세요, <strong><span style="color: #01A1AF; font-size: 15px">#{회원명}</span></strong>님.</p><p>회원가입이 완료되었습니다.</p>',
    attachmentFileNames: [],
  },
  {
    id: 'mail-tpl-password',
    name: '비밀번호 변경 안내',
    templateName: 'JA Company Of the Year 2차 교육 워크숍 수강 안내',
    categoryId: 'cat-notice',
    registeredAt: '2026-09-15T09:15:00',
    updatedAt: '2026-09-15T09:15:00',
    senderName: '홍길동',
    senderEmail: 'gildong@jakorea.org',
    subject: '[JA Korea] 2026 JA Company Of the Year 2차 교육 워크숍 수강 안내',
    bodyHtml: WORKSHOP_BODY_HTML,
    attachmentFileNames: ['JA Company Of the Year 2차 교육 워크숍 수강 안내.pdf'],
  },
  {
    id: 'mail-tpl-workshop',
    name: '워크숍 수강 안내',
    templateName: 'JA Company Of the Year 2차 교육 워크숍 수강 안내',
    categoryId: 'cat-program',
    registeredAt: '2026-09-15T09:15:00',
    updatedAt: '2026-09-15T09:15:00',
    senderName: '홍길동',
    senderEmail: 'gildong@jakorea.org',
    subject: '[JA Korea] 2026 JA Company Of the Year 2차 교육 워크숍 수강 안내',
    bodyHtml: WORKSHOP_BODY_HTML,
    attachmentFileNames: ['JA Company Of the Year 2차 교육 워크숍 수강 안내.pdf'],
  },
]
