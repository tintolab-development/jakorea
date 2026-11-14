import { describe, expect, it } from 'vitest'
import {
  ADMIN_PERMISSION_CATEGORIES,
  ADMIN_PERMISSION_SETTINGS_ROLE_LABELS,
  countChecked,
  createInitialPermissionsByRole,
  deriveCategoryCheckboxState,
  listAdminPermissionCatalogItems,
  resolveAdminPermissionSettingsRole,
} from './admin-permission-settings-ui-data'
import { ADMIN_PERMISSION_SETTINGS_DISPLAY_ROLES } from '@/types/admin-permission-settings-ui'
import type { AdminPermissionFlags } from '@/types/admin-permission-settings-ui'

const EXPECTED_LABELS = {
  crud: [
    '프로그램 등록·삭제',
    '회원 등록·수정·삭제',
    '학교 등록·수정·삭제',
    '관리자 등록·수정·삭제',
    '관리자 코멘트 등록',
    '공지사항 등록·수정·삭제',
    'FAQ 등록·수정·삭제',
    '공지사항·FAQ 카테고리 관리',
    '문의내역 답변·삭제',
    '문의 카테고리 관리',
    '후원사 등록·수정·삭제',
    '후원사 담당자 등록·삭제·변경',
    '후원사 연도별 후원금 입력',
    '교재 등록·수정·삭제',
    '교재 키트 수량 수정',
    '교재 사업 분야 관리',
    '세부 프로그램 등록·수정·삭제',
    '템플릿 등록·수정',
    '알림톡 템플릿 등록·수정·삭제',
    '메일 템플릿 등록·수정·삭제',
    '문자 템플릿 등록·수정·삭제',
    '알림 메시지 템플릿 카테고리 관리',
    'UJAT 교육 지역 등록·삭제',
    'Gemini 승인 연수 등록·삭제',
    'Gemini 연수 보고서 등록',
    'Gemini 실적 삭제',
  ],
  pii: [
    '주민등록번호 확인',
    '계좌정보 확인',
    '성별 확인',
    '생년월일 확인',
    '주소지 확인',
    '연락처 확인',
    '이메일 확인',
    '학력사항 확인',
    '연동 소셜계정 확인',
    '약관 및 동의 내역 확인',
    '약관 및 동의서 확인',
  ],
  screen_view: [
    '대시보드',
    '회원 목록·상세',
    '강사 권한 승인',
    '관리자 권한 승인',
    '관리자 권한 설정',
    '프로그램 담당자 권한 설정',
    '프로그램 목록·상세',
    'UJAT 프로그램 관리',
    '지급조서 확인',
    '계좌 지급 확인',
    '대량이체 양식 미리보기',
    '세금신고 양식 미리보기',
    '정산 항목 설정',
    '템플릿 관리',
    '공지사항 관리',
    'FAQ 관리',
    '문의내역 관리',
    '후원사 관리',
    '교재 관리',
    '세부 프로그램 관리',
    '알림톡·메일·문자 템플릿 관리',
    '알림톡·메일·문자 발송 내역 조회',
    '실적 관리',
    'Gemini 실적 관리',
    'CMS 로그인 이력',
    '파일 다운로드 이력',
    '개인정보 조회 이력',
    '버그/이슈 이력',
  ],
  file_download: [
    '프로그램 목록',
    'Gemini 찾아가는 연수 목록',
    'Gemini 실적 목록',
    '회원 목록',
    '수료증·참가인증서 발급',
    '봉사·강사 활동인증서 발급',
    '강사 권한 신청 목록',
    '관리자 목록',
    '관리자 권한 신청 목록',
    '지급조서 확인 목록',
    '계좌 지급 확인 목록',
    '지급조서 발급',
    '대량이체 양식 발급',
    '세금신고 양식 발급',
    '템플릿 문서',
    '공지사항 목록',
    'FAQ 목록',
    '문의내역 목록',
    '후원사 목록',
    '교재 목록',
    '세부 프로그램 목록',
    '실적 데이터',
    '보안 로그',
  ],
  settings: [
    '회원 탈퇴 처리',
    '관리자 탈퇴 처리',
    '강사 권한 신청 승인·반려·취소',
    '관리자 권한 신청 승인·반려·취소',
    '강사 등급 평가',
    '강사 권한 종료',
    '지급조서 확인·반려·정정',
    '계좌 지급 확인',
    '정산 항목 설정',
    '알림톡·메일·문자 발송',
    '발송된 알림 재발송',
    'GNB 알림 수신',
    '관리자 기본 역할 권한 설정',
    '프로그램 역할 권한 설정',
  ],
} as const

const ACCOUNTING_MANAGER_UNCHECKED_LABELS = {
  crud: ['관리자 등록·수정·삭제'],
  pii: [],
  screen_view: [
    '관리자 권한 승인',
    '관리자 권한 설정',
    '프로그램 담당자 권한 설정',
    'CMS 로그인 이력',
    '파일 다운로드 이력',
    '개인정보 조회 이력',
    '버그/이슈 이력',
  ],
  file_download: ['관리자 목록', '관리자 권한 신청 목록', '보안 로그'],
  settings: [
    '관리자 탈퇴 처리',
    '관리자 권한 신청 승인·반려·취소',
    '관리자 기본 역할 권한 설정',
    '프로그램 역할 권한 설정',
  ],
} as const

const PROGRAM_MANAGER_UNCHECKED_LABELS = {
  crud: ['관리자 등록·수정·삭제'],
  pii: ['주민등록번호 확인', '계좌정보 확인'],
  screen_view: [
    '관리자 권한 승인',
    '관리자 권한 설정',
    '프로그램 담당자 권한 설정',
    '계좌 지급 확인',
    '대량이체 양식 미리보기',
    '세금신고 양식 미리보기',
    'CMS 로그인 이력',
    '파일 다운로드 이력',
    '개인정보 조회 이력',
    '버그/이슈 이력',
  ],
  file_download: [
    '관리자 목록',
    '관리자 권한 신청 목록',
    '계좌 지급 확인 목록',
    '대량이체 양식 발급',
    '세금신고 양식 발급',
    '보안 로그',
  ],
  settings: [
    '관리자 탈퇴 처리',
    '관리자 권한 신청 승인·반려·취소',
    '계좌 지급 확인',
    '관리자 기본 역할 권한 설정',
    '프로그램 역할 권한 설정',
  ],
} as const

const PROGRAM_VIEWER_CHECKED_LABELS = {
  crud: [],
  pii: [],
  screen_view: [
    '대시보드',
    '회원 목록·상세',
    '프로그램 목록·상세',
    'UJAT 프로그램 관리',
    '지급조서 확인',
    '공지사항 관리',
    'FAQ 관리',
    '문의내역 관리',
    '후원사 관리',
    '교재 관리',
    '세부 프로그램 관리',
    '알림톡·메일·문자 템플릿 관리',
    '알림톡·메일·문자 발송 내역 조회',
    '실적 관리',
    'Gemini 실적 관리',
  ],
  file_download: [],
  settings: ['GNB 알림 수신'],
} as const

type CategoryId = keyof typeof EXPECTED_LABELS

function labelsWhere(
  flags: AdminPermissionFlags,
  categoryId: CategoryId,
  checked: boolean
): string[] {
  const category = ADMIN_PERMISSION_CATEGORIES.find(item => item.id === categoryId)
  if (!category) throw new Error(`missing category ${categoryId}`)
  return category.items.filter(item => flags[item.id] === checked).map(item => item.label)
}

describe('admin-permission-settings-ui-data', () => {
  it('역할 탭 4개와 카테고리 5개, 항목 102개를 순서대로 둔다', () => {
    expect(ADMIN_PERMISSION_SETTINGS_DISPLAY_ROLES).toEqual([
      'master',
      'accounting-manager',
      'program-manager',
      'program-viewer',
    ])
    expect(
      ADMIN_PERMISSION_SETTINGS_DISPLAY_ROLES.map(
        role => ADMIN_PERMISSION_SETTINGS_ROLE_LABELS[role]
      )
    ).toEqual(['Master', 'Accounting Manager', 'Program Manager', 'Program Viewer'])

    expect(ADMIN_PERMISSION_CATEGORIES.map(category => category.title)).toEqual([
      '등록·수정·삭제',
      '개인정보 열람',
      '화면 열람',
      '파일 다운로드',
      '설정·처리',
    ])
    expect(ADMIN_PERMISSION_CATEGORIES.map(category => category.items.length)).toEqual([
      26, 11, 28, 23, 14,
    ])
    expect(
      ADMIN_PERMISSION_CATEGORIES.map(category => category.items.map(item => item.label))
    ).toEqual([
      [...EXPECTED_LABELS.crud],
      [...EXPECTED_LABELS.pii],
      [...EXPECTED_LABELS.screen_view],
      [...EXPECTED_LABELS.file_download],
      [...EXPECTED_LABELS.settings],
    ])
  })

  it('항목 id는 유일하고, 같은 라벨도 카테고리별로 다른 id를 가진다', () => {
    const items = listAdminPermissionCatalogItems()
    expect(items).toHaveLength(102)
    expect(new Set(items.map(item => item.id)).size).toBe(102)

    const settlement = items.filter(item => item.label === '정산 항목 설정')
    expect(settlement.map(item => item.categoryId)).toEqual(['screen_view', 'settings'])
    expect(new Set(settlement.map(item => item.id)).size).toBe(2)

    const accountPayment = items.filter(item => item.label === '계좌 지급 확인')
    expect(accountPayment.map(item => item.categoryId)).toEqual(['screen_view', 'settings'])
    expect(new Set(accountPayment.map(item => item.id)).size).toBe(2)

    for (const category of ADMIN_PERMISSION_CATEGORIES) {
      const orders = items.filter(item => item.categoryId === category.id).map(item => item.order)
      expect(orders).toEqual(category.items.map((_, index) => index + 1))
    }
  })

  it('Master는 102개 전부 체크하고 헤더도 checked다', () => {
    const flags = createInitialPermissionsByRole().master
    expect(countChecked(flags)).toBe(102)
    expect(ALL_UNCHECKED(flags)).toEqual([])
    for (const category of ADMIN_PERMISSION_CATEGORIES) {
      const values = category.items.map(item => flags[item.id] === true)
      expect(values.every(Boolean)).toBe(true)
      expect(deriveCategoryCheckboxState(values)).toEqual({
        checked: true,
        indeterminate: false,
      })
    }
  })

  it('Accounting Manager는 지정한 15개만 해제한다', () => {
    const flags = createInitialPermissionsByRole()['accounting-manager']
    expect(countChecked(flags)).toBe(87)
    expectUncheckedLabels(flags, ACCOUNTING_MANAGER_UNCHECKED_LABELS)
    expect(deriveCategoryCheckboxState(flagsOf('crud', flags))).toEqual({
      checked: false,
      indeterminate: true,
    })
    expect(deriveCategoryCheckboxState(flagsOf('pii', flags))).toEqual({
      checked: true,
      indeterminate: false,
    })
  })

  it('Program Manager는 지정한 24개만 해제한다', () => {
    const flags = createInitialPermissionsByRole()['program-manager']
    expect(countChecked(flags)).toBe(78)
    expectUncheckedLabels(flags, PROGRAM_MANAGER_UNCHECKED_LABELS)
    expect(categoryCounts(flags)).toEqual({
      crud: { checked: 25, unchecked: 1 },
      pii: { checked: 9, unchecked: 2 },
      screen_view: { checked: 18, unchecked: 10 },
      file_download: { checked: 17, unchecked: 6 },
      settings: { checked: 9, unchecked: 5 },
    })
  })

  it('Program Viewer는 지정한 16개만 체크한다', () => {
    const flags = createInitialPermissionsByRole()['program-viewer']
    expect(countChecked(flags)).toBe(16)
    expect(labelsWhere(flags, 'crud', true)).toEqual([])
    expect(labelsWhere(flags, 'pii', true)).toEqual([])
    expect(labelsWhere(flags, 'file_download', true)).toEqual([])
    expect(labelsWhere(flags, 'screen_view', true)).toEqual([
      ...PROGRAM_VIEWER_CHECKED_LABELS.screen_view,
    ])
    expect(labelsWhere(flags, 'settings', true)).toEqual([
      ...PROGRAM_VIEWER_CHECKED_LABELS.settings,
    ])
    expect(deriveCategoryCheckboxState(flagsOf('crud', flags))).toEqual({
      checked: false,
      indeterminate: false,
    })
    expect(deriveCategoryCheckboxState(flagsOf('screen_view', flags))).toEqual({
      checked: false,
      indeterminate: true,
    })
    expect(deriveCategoryCheckboxState(flagsOf('settings', flags))).toEqual({
      checked: false,
      indeterminate: true,
    })
    expect(categoryCounts(flags)).toEqual({
      crud: { checked: 0, unchecked: 26 },
      pii: { checked: 0, unchecked: 11 },
      screen_view: { checked: 15, unchecked: 13 },
      file_download: { checked: 0, unchecked: 23 },
      settings: { checked: 1, unchecked: 13 },
    })
  })

  it('과거 role 쿼리는 화면 역할로만 해석하고 API 코드는 연결하지 않는다', () => {
    expect(resolveAdminPermissionSettingsRole('master')).toBe('master')
    expect(resolveAdminPermissionSettingsRole('accounting-manager')).toBe('accounting-manager')
    expect(resolveAdminPermissionSettingsRole('accounting_manager')).toBe('accounting-manager')
    expect(resolveAdminPermissionSettingsRole('program-manager')).toBe('program-manager')
    expect(resolveAdminPermissionSettingsRole('program_manager')).toBe('program-manager')
    expect(resolveAdminPermissionSettingsRole('pm')).toBe('program-manager')
    expect(resolveAdminPermissionSettingsRole('program-viewer')).toBe('program-viewer')
    expect(resolveAdminPermissionSettingsRole('program_viewer')).toBe('program-viewer')
    expect(resolveAdminPermissionSettingsRole('viewer')).toBe('program-viewer')
    expect(resolveAdminPermissionSettingsRole('partner')).toBeNull()
    expect(resolveAdminPermissionSettingsRole('MASTER')).toBeNull()
    expect(resolveAdminPermissionSettingsRole('ACCOUNTING_MANAGER')).toBeNull()
    expect(resolveAdminPermissionSettingsRole(null)).toBeNull()
  })
})

function flagsOf(categoryId: CategoryId, flags: AdminPermissionFlags): boolean[] {
  const category = ADMIN_PERMISSION_CATEGORIES.find(item => item.id === categoryId)
  if (!category) throw new Error(`missing category ${categoryId}`)
  return category.items.map(item => flags[item.id] === true)
}

function ALL_UNCHECKED(flags: AdminPermissionFlags): string[] {
  return listAdminPermissionCatalogItems()
    .filter(item => flags[item.id] !== true)
    .map(item => `${item.categoryId}:${item.label}`)
}

function expectUncheckedLabels(
  flags: AdminPermissionFlags,
  expected: Record<CategoryId, readonly string[]>
) {
  for (const categoryId of Object.keys(EXPECTED_LABELS) as CategoryId[]) {
    expect(labelsWhere(flags, categoryId, false)).toEqual([...expected[categoryId]])
  }
}

function categoryCounts(flags: AdminPermissionFlags) {
  return Object.fromEntries(
    (Object.keys(EXPECTED_LABELS) as CategoryId[]).map(categoryId => {
      const values = flagsOf(categoryId, flags)
      const checked = values.filter(Boolean).length
      return [categoryId, { checked, unchecked: values.length - checked }]
    })
  )
}
