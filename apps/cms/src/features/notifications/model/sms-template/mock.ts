import type { SmsMessageType } from '@/features/notifications/api/adapters/sms-channel'
import { SMS_ROOT_CATEGORY_ID, type SmsCategory, type SmsTemplateItem } from './types'

const WORKSHOP_BODY = `안녕하세요, #{회원명}님 #{프로그램명}입니다.

2026 JA Company Of the Year 2차 교육 워크숍 수강 안내드립니다.
https://youtu.be/zJFb0JnTsFM

설문조사: #{설문조사 URL}`

export const SMS_CATEGORY_MOCK: SmsCategory[] = [
  { id: 'sms-cat-notice', name: '전체 공지', parentId: SMS_ROOT_CATEGORY_ID },
  { id: 'sms-cat-system', name: '시스템 안내', parentId: 'sms-cat-notice' },
  { id: 'sms-cat-signup', name: '회원가입 안내', parentId: 'sms-cat-notice' },
  { id: 'sms-cat-program', name: '프로그램 안내', parentId: SMS_ROOT_CATEGORY_ID },
  { id: 'sms-cat-test01', name: 'test 01', parentId: 'sms-cat-program' },
  { id: 'sms-cat-test02', name: 'test 02', parentId: 'sms-cat-test01' },
]

export const SMS_TEMPLATE_ITEM_MOCK: SmsTemplateItem[] = [
  {
    id: 'sms-tpl-password',
    name: '비밀번호 변경 안내',
    templateName: 'JA Company Of the Year 2차 교육 워크숍 수강 안내',
    categoryId: 'sms-cat-notice',
    registeredAt: '2026-09-15T09:15:00',
    updatedAt: '2026-09-15T09:15:00',
    senderPhone: '027832367',
    messageType: 'LMS',
    subject: '[JA Korea] 2026 JA Company Of the Year 2차 교육 워크숍 수강 안내',
    bodyText: WORKSHOP_BODY,
    attachmentFileNames: [],
  },
  {
    id: 'sms-tpl-signup',
    name: '회원가입 안내',
    templateName: '회원가입 안내',
    categoryId: 'sms-cat-system',
    registeredAt: '2026-09-15T09:15:00',
    updatedAt: '2026-09-15T09:15:00',
    senderPhone: '027832367',
    messageType: 'SMS',
    subject: '',
    bodyText: '안녕하세요, #{회원명}님. 회원가입이 완료되었습니다.',
    attachmentFileNames: [],
  },
  {
    id: 'sms-tpl-program',
    name: '프로그램 신청 안내',
    templateName: '프로그램 신청 안내',
    categoryId: 'sms-cat-program',
    registeredAt: '2026-09-15T09:15:00',
    updatedAt: '2026-09-15T09:15:00',
    senderPhone: '027832367',
    messageType: 'LMS',
    subject: '[JA Korea] 프로그램 신청 안내',
    bodyText: WORKSHOP_BODY,
    attachmentFileNames: [],
  },
  {
    id: 'sms-tpl-mms',
    name: 'MMS 안내',
    templateName: 'MMS 안내',
    categoryId: 'sms-cat-program',
    registeredAt: '2026-09-15T09:15:00',
    updatedAt: '2026-09-15T09:15:00',
    senderPhone: '027832367',
    messageType: 'MMS' satisfies SmsMessageType,
    subject: '[JA Korea] MMS 안내',
    bodyText: '이미지와 함께 안내드립니다.',
    attachmentFileNames: ['안내이미지.jpg'],
  },
]
