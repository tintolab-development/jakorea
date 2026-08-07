import { useEffect, useState } from 'react'
import {
  MOCK_ADMIN_REGISTERED_BIRTH_DATE,
  MOCK_ADMIN_REGISTERED_EMAIL,
  MOCK_ADMIN_REGISTERED_PROFILE,
} from '@/features/auth/admin-registered'
import { MYPAGE_PATH } from '@/features/mypage'
import type { PlatformMemberProfile } from '@/features/mypage'
import {
  MOCK_DUPLICATE_EMAIL,
  MOCK_VERIFIED_NAME,
  MOCK_VERIFIED_PHONE,
} from '@/features/auth/sign-up'
import { AddressSearchModal } from '@/features/auth/sign-up/ui/address-search-modal'
import { PfRichTextEditor, RichTextViewer, useRichTextEditor } from '@/shared/rich-text'
import {
  GoogleSocialLoginIcon,
  KakaoSocialLoginIcon,
  NaverSocialLoginIcon,
  PFCategoryBadge,
  PFAlertModal,
  PFArrowButton,
  PFChevronButton,
  PFPageButton,
  PFButton,
  PFDivider,
  PFAttachmentDropdown,
  PFFileDownload,
  PFModal,
  PFMetaBadge,
  PFPagination,
  PFSearchFilter,
  PFSearchInput,
  PFStateBadge,
  PFStepProgress,
  PFTabs,
  PFToggle,
  PFText,
  PFTextInput,
  PFSelect,
  PFSort,
} from '@/shared/ui'
import searchMintIconUrl from '@/shared/assets/icons/search-mint.svg'
import { SearchListLayout } from '@/widgets/search-list-layout'
import {
  DEV_MEMBER_PROFILE_OPTIONS,
  getDevAuthLoggedIn,
  getDevMemberProfile,
  platformBreakpoints,
  setDevAuthLoggedIn,
  setDevMemberProfile,
} from '@/shared/lib'
import {
  educationTargetFilterOptions,
  mockOrgFilterOptions,
  recruitmentStatusFilterOptions,
} from '@/shared/lib/filter-options'
import styles from './page.module.css'
import { FormTemplateSmokeDemo } from '@/features/form-template/form-template-smoke-demo'

const tabItems: { key: string; label: string; badge: string }[] = [
  { key: 'tab-1', label: 'tab title', badge: '00' },
  { key: 'tab-2', label: 'tab title', badge: '00' },
  { key: 'tab-3', label: 'tab title', badge: '00' },
]

const pillItems: { key: string; label: string }[] = [
  { key: 'pill-1', label: 'tab title' },
  { key: 'pill-2', label: 'tab title' },
  { key: 'pill-3', label: 'tab title' },
]

const layoutSortOptions = [
  { key: 'latest', label: '최신순' },
  { key: 'name', label: '이름순' },
  { key: 'deadline', label: '마감일 가까운순' },
] as const

const typographyTokenSpecs = [
  {
    token: 'typo-page-title',
    pfText: 'page-title' as const,
    figma: 'Pagetitle/Large',
    size: '60px',
    weight: '700',
    lineHeight: '140%',
    letterSpacing: '-0.6px',
  },
  {
    token: 'typo-page-title-md',
    pfText: 'page-title-md' as const,
    figma: 'Pagetitle/Medium',
    size: '48px',
    weight: '700',
    lineHeight: '140%',
    letterSpacing: '-0.48px',
  },
  {
    token: 'typo-hd-lg',
    pfText: 'hd-lg',
    figma: 'Heading/Large',
    size: '38px',
    weight: '700',
    lineHeight: '144%',
    letterSpacing: '-0.76px',
  },
  {
    token: 'typo-hd-md',
    pfText: 'hd-md',
    figma: 'Heading/Medium',
    size: '34px',
    weight: '700',
    lineHeight: '144%',
    letterSpacing: '-0.68px',
  },
  {
    token: 'typo-hd-sm',
    pfText: 'hd-sm',
    figma: 'Heading/Small',
    size: '30px',
    weight: '700',
    lineHeight: '144%',
    letterSpacing: '0',
  },
  {
    token: 'typo-hl-lg',
    pfText: 'hl-lg',
    figma: 'Headline/Large',
    size: '24px',
    weight: '600',
    lineHeight: '150%',
    letterSpacing: '-0.24px',
  },
  {
    token: 'typo-hl-sm',
    pfText: 'hl-sm',
    figma: 'Headline/Small',
    size: '20px',
    weight: '600',
    lineHeight: '150%',
    letterSpacing: '-0.2px',
  },
  {
    token: 'typo-bd-lg-rg',
    pfText: 'bd-lg-rg',
    figma: 'Body/Large/regular',
    size: '18px',
    weight: '400',
    lineHeight: '150%',
    letterSpacing: '-0.18px',
  },
  {
    token: 'typo-bd-lg-sb',
    pfText: 'bd-lg-sb',
    figma: 'Body/Large/semibold',
    size: '18px',
    weight: '600',
    lineHeight: '150%',
    letterSpacing: '-0.18px',
  },
  {
    token: 'typo-bd-md-rg',
    pfText: 'bd-md-rg',
    figma: 'Body/Medium/regular',
    size: '16px',
    weight: '400',
    lineHeight: '150%',
    letterSpacing: '-0.16px',
  },
  {
    token: 'typo-bd-md-md',
    pfText: 'bd-md-md',
    figma: 'Body/Medium/medium',
    size: '16px',
    weight: '500',
    lineHeight: '150%',
    letterSpacing: '-0.16px',
    note: '참여하기 리스트 운영 일정',
  },
  {
    token: 'typo-bd-md-sb',
    pfText: 'bd-md-sb',
    figma: 'Body/Medium/semibold',
    size: '16px',
    weight: '600',
    lineHeight: '150%',
    letterSpacing: '-0.16px',
  },
  {
    token: 'typo-bd-md-bd',
    pfText: 'bd-md-bd',
    figma: 'Body/Medium/bold',
    size: '16px',
    weight: '700',
    lineHeight: '150%',
    letterSpacing: '-0.16px',
  },
  {
    token: 'typo-bd-sm-rg',
    pfText: 'bd-sm-rg',
    figma: 'Body/Small/regular',
    size: '14px',
    weight: '400',
    lineHeight: '160%',
    letterSpacing: '0',
  },
  {
    token: 'typo-bd-sm-md',
    pfText: 'bd-sm-md',
    figma: 'Body/Small/medium',
    size: '14px',
    weight: '500',
    lineHeight: '160%',
    letterSpacing: '0',
  },
  {
    token: 'typo-bd-sm-sb',
    pfText: 'bd-sm-sb',
    figma: 'Body/Small/semibold',
    size: '14px',
    weight: '600',
    lineHeight: '160%',
    letterSpacing: '0',
  },
  {
    token: 'typo-label-md',
    pfText: 'label-md',
    figma: 'Label/Medium',
    size: '13px',
    weight: '500',
    lineHeight: '140%',
    letterSpacing: '0',
  },
  {
    token: 'typo-caption-rg',
    pfText: 'caption-rg',
    figma: 'Caption/regular',
    size: '12px',
    weight: '400',
    lineHeight: '140%',
    letterSpacing: '0',
  },
  {
    token: 'typo-caption-sb',
    pfText: 'caption-sb',
    figma: 'Caption/semibold',
    size: '12px',
    weight: '600',
    lineHeight: '140%',
    letterSpacing: '0',
  },
] as const

const colorTokenGroups = [
  {
    id: 'primary',
    label: 'Primary',
    tokens: [
      { cssVar: '--color-primary-100', hex: '#CDF4F7' },
      { cssVar: '--color-primary-200', hex: '#95E8F0' },
      { cssVar: '--color-primary-300', hex: '#4CD9E5' },
      { cssVar: '--color-primary-400', hex: '#0CBDCC' },
      {
        cssVar: '--color-primary-500',
        hex: '#01A1AF',
        figma: 'Color/primary/500 · resilient_turquoise',
        pfText: 'primary-500',
        note: '참여하기 리스트 운영 일정',
      },
      { cssVar: '--color-primary-600', hex: '#337791' },
      { cssVar: '--color-primary-700', hex: '#285F74', pfText: 'primary-700' },
      { cssVar: '--color-primary-800', hex: '#22404D', pfText: 'primary-800' },
    ],
  },
  {
    id: 'neutral',
    label: 'Neutral',
    tokens: [
      { cssVar: '--color-neutral-black', hex: '#3D3D3D', pfText: 'black' },
      {
        cssVar: '--color-neutral-black-30',
        hex: 'rgba(35, 35, 35, 0.40)',
        figma: 'Color/netural-black-30',
        note: '카테고리 탭 비활성 텍스트',
      },
      {
        cssVar: '--color-neutral-black-50',
        hex: 'rgba(61, 61, 61, 0.50)',
        figma: 'Divider',
        note: 'PFDivider default border',
      },
      {
        cssVar: '--color-border-focus',
        hex: '#01A1AF',
        figma: 'Color/border-focus',
        note: 'PFDivider focus (결과 확인)',
      },
      { cssVar: '--color-neutral-white', hex: '#FFFFFF', pfText: 'white' },
      { cssVar: '--color-neutral-cool-50', hex: '#F5F7F7' },
      { cssVar: '--color-neutral-cool-80', hex: '#EEF3F4' },
      { cssVar: '--color-neutral-cool-100', hex: '#E6E9EB' },
      { cssVar: '--color-neutral-cool-200', hex: '#D0D9DB' },
      { cssVar: '--color-neutral-cool-300', hex: '#BBC4C7' },
      { cssVar: '--color-neutral-cool-400', hex: '#9FAFB5' },
      { cssVar: '--color-neutral-cool-500', hex: '#85969D', pfText: 'neutral-cool-500' },
      { cssVar: '--color-neutral-cool-600', hex: '#667278', pfText: 'neutral-cool-600' },
      { cssVar: '--color-neutral-cool-700', hex: '#41494D' },
      { cssVar: '--color-neutral-warm-80', hex: '#F7F7F7' },
      { cssVar: '--color-neutral-warm-100', hex: '#F0F1F2' },
      { cssVar: '--color-neutral-warm-200', hex: '#E8E8E8' },
      { cssVar: '--color-neutral-warm-300', hex: '#D1D1D1' },
      { cssVar: '--color-neutral-warm-400', hex: '#BDBDBD' },
      { cssVar: '--color-neutral-warm-500', hex: '#999999', pfText: 'neutral-warm-500' },
      { cssVar: '--color-neutral-warm-600', hex: '#7A7A7A', pfText: 'neutral-warm-600' },
      { cssVar: '--color-neutral-warm-700', hex: '#525252' },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    tokens: [
      { cssVar: '--color-status-error-default', hex: '#C31D20', pfText: 'error' },
      { cssVar: '--color-status-error-light', hex: '#ED4A4C' },
      { cssVar: '--color-status-error-strong', hex: '#850D0F' },
      { cssVar: '--color-status-success-default', hex: '#1D5CC2', pfText: 'success' },
      { cssVar: '--color-status-success-light', hex: '#4A88ED' },
      { cssVar: '--color-status-success-strong', hex: '#0D3B85' },
    ],
  },
  {
    id: 'palette',
    label: 'Palette',
    tokens: [
      { cssVar: '--color-palette-cream', hex: '#F3F2B3' },
      { cssVar: '--color-palette-yellow', hex: '#E3E24F' },
      { cssVar: '--color-palette-green', hex: '#BBD153' },
      { cssVar: '--color-palette-ice', hex: '#C2EDF0' },
      { cssVar: '--color-palette-red', hex: '#F65F4E' },
      { cssVar: '--color-palette-jade', hex: '#46B17B' },
      { cssVar: '--color-palette-forest', hex: '#00763D' },
    ],
  },
  {
    id: 'gradient',
    label: 'Gradient',
    tokens: [
      {
        cssVar: '--color-gradient-primary-01',
        hex: '90deg #285F74 → #00A0AF',
        isGradient: true,
        figma: 'Primary_GR_01',
        pfText: 'gradient-primary-01' as const,
        utility: 'text-gradient-primary-01',
      },
      {
        cssVar: '--color-gradient-primary-02',
        hex: '101deg #2EAAFD → #0D81CF',
        isGradient: true,
        figma: 'Primary_GR_02',
        pfText: 'gradient-primary-02' as const,
        utility: 'text-gradient-primary-02',
      },
      {
        cssVar: '--color-gradient-primary-03',
        hex: '93deg #46B17B → #BBD153',
        isGradient: true,
        figma: 'Primary_GR_03',
        pfText: 'gradient-primary-03' as const,
        utility: 'text-gradient-primary-03',
      },
    ],
  },
] as const

const designSystemNav = [
  { id: 'breakpoints', label: 'Breakpoints' },
  { id: 'typography', label: 'Typography' },
  { id: 'color', label: 'Color' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'badges', label: 'Badges' },
  { id: 'forms', label: 'Forms' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'layout', label: 'Layout' },
  { id: 'modals', label: 'Modals' },
  { id: 'icons', label: 'Social Icons' },
  { id: 'rich-text', label: 'Rich Text' },
  { id: 'form-template', label: 'FormTemplate' },
  { id: 'dev-tools', label: 'Dev Tools' },
] as const

const BREAKPOINT_RULES = [
  {
    key: 'mobile',
    label: 'Mobile',
    range: '~1079',
    media: '--bp-below-pc',
    query: 'max-width: 1079px',
    description: '모바일 UI · 햄버거 헤더 · 타이트 페이지 패딩',
  },
  {
    key: 'pc-compact',
    label: 'PC compact',
    range: '1080~1599',
    media: '--bp-pc-compact',
    query: 'min-width: 1080px and max-width: 1599px',
    description: 'PC UI · 타이트 마진 · compact 헤더 간격',
  },
  {
    key: 'pc-full',
    label: 'PC full',
    range: '1600~',
    media: '--bp-pc-full-up',
    query: 'min-width: 1600px',
    description: 'PC UI · wide shell 마진 · full 레이아웃',
  },
] as const

/**
 * Platform 반응형 룰 프리셋 (breakpoints.css / breakpoints.ts 와 동기)
 * Mobile · ~1079 · PC compact · 1080~1599 · PC full · 1600~
 */
const VIEWPORT_PRESETS = [
  {
    key: 'mobile',
    label: 'Mobile',
    rangeLabel: `mobile · ≤${platformBreakpoints.belowPcMax}`,
    description: '모바일 UI · 햄버거 헤더',
    width: platformBreakpoints.layoutMinWidth + 15, // 390
  },
  {
    key: 'pc-compact',
    label: 'PC compact',
    rangeLabel: `PC compact · ${platformBreakpoints.pcMin}–${platformBreakpoints.pcCompactMax}`,
    description: 'PC UI · 타이트 마진',
    width: 1280,
  },
  {
    key: 'pc-full',
    label: 'PC full',
    rangeLabel: `PC full · ≥${platformBreakpoints.pcFullMin}`,
    description: 'PC UI · wide shell 마진',
    width: platformBreakpoints.pcFullMin,
  },
  {
    key: 'live',
    label: 'Live',
    rangeLabel: '현재 브라우저 폭',
    description: '뷰포트 리사이즈 없이 실제 창 크기',
    width: null,
  },
] as const

type ViewportPresetKey = (typeof VIEWPORT_PRESETS)[number]['key']

const VIEWPORT_PREVIEW_QUERY = 'viewport-preview'

function isViewportPreviewEmbed() {
  return new URLSearchParams(window.location.search).get(VIEWPORT_PREVIEW_QUERY) === '1'
}

const viewportTabItems = VIEWPORT_PRESETS.map(preset => ({
  key: preset.key,
  label: preset.label,
}))

const arrowButtonSizes = ['large', 'medium'] as const
const arrowButtonVariants = ['primary', 'secondary'] as const
const badgeSizes = ['large', 'small'] as const
const categoryBadgeVariants = ['primary', 'secondary', 'closed'] as const
const categoryBadgeIconVariants = ['primary', 'secondary'] as const
const stateBadgeTones = ['progress', 'success', 'error', 'disabled'] as const
const buttonSizes = ['small', 'medium', 'large', 'xlarge'] as const
const buttonVariants = ['primary', 'secondary', 'tertiary', 'text'] as const
const inputSizes = ['medium', 'large', 'xlarge'] as const

const selectDemoOptions = [
  { value: 'edit', label: '수정하기' },
  { value: 'delete', label: '삭제하기' },
]
const paginationSizes = ['large', 'small'] as const

const authMockDataRows = [
  { label: '본인인증 이름', value: MOCK_VERIFIED_NAME },
  { label: '본인인증 휴대폰', value: MOCK_VERIFIED_PHONE },
  { label: '회원가입 중복 이메일', value: MOCK_DUPLICATE_EMAIL },
  { label: '관리자 등록 이메일', value: MOCK_ADMIN_REGISTERED_EMAIL },
  { label: '관리자 등록 판별 생년월일', value: MOCK_ADMIN_REGISTERED_BIRTH_DATE },
  { label: '비밀번호 찾기 — 미가입 이메일', value: 'ja@gmail.com' },
  { label: '이메일 찾기 결과 mock', value: 'Ja****@gmail.com' },
  { label: '이메일 ID 금칙어 예시', value: 'admin@test.com' },
  { label: '이메일 ID 공백 거부 예시', value: 'user name@test.com' },
  { label: '이메일 ID 형식 거부 예시', value: '.user@test.com' },
  {
    label: '관리자 등록 프로필 — 주소',
    value: `${MOCK_ADMIN_REGISTERED_PROFILE.address} ${MOCK_ADMIN_REGISTERED_PROFILE.addressDetail}`,
  },
] as const

type AuthGuideScenario = {
  title: string
  steps: readonly string[]
  href?: string
  buttonLabel?: string
}

const authGuideSections: { title: string; scenarios: readonly AuthGuideScenario[] }[] = [
  {
    title: '로그인 (/auth/sign-in)',
    scenarios: [
      {
        title: '일반 로그인 (dev mock)',
        steps: [
          '유효한 이메일 형식 입력 후 로그인하기 클릭 (validateEmailId 통과 필요)',
          '형식·금칙어·공백 오류 시 정책 안내 문구 표시 (예: admin@test.com, user name@test.com)',
          '통과 시 localStorage 로그인 처리 (platform:dev:is-logged-in = true)',
          'URL에 ?redirect= 경로가 있으면 해당 경로로, 없으면 / 로 이동',
        ],
        href: '/auth/sign-in',
        buttonLabel: '로그인 화면',
      },
      {
        title: '관리자 등록 회원 — 최초 로그인',
        steps: [
          '유효한 이메일 형식에서 이메일과 비밀번호를 동일하게 입력 (예: test@gmail.com / test@gmail.com)',
          '로그인 처리 없이 /auth/admin-registered/notice (최초 로그인 전용 UI)로 이동',
          '본인인증 후 비밀번호 변경하기 → birth → identity → change-password → confirm → (edit) → complete',
          'complete에서 dev 로그인 처리 후 wizard state 초기화',
        ],
        href: '/auth/sign-in',
        buttonLabel: '로그인 화면',
      },
      {
        title: '소셜 로그인',
        steps: [
          'Google / 네이버 / 카카오 아이콘 클릭',
          '/auth/social/error?reason=not-linked 로 이동 (연동 계정 없음 mock)',
        ],
      },
    ],
  },
  {
    title: '회원가입 (/auth/sign-up)',
    scenarios: [
      {
        title: '일반 회원가입',
        steps: [
          '스텝1~7 일반 플로우 (회원유형 → 생년월일·성별 → 본인인증 → 약관 → 이메일 → 비밀번호 → 프로필 → 확인)',
          '본인인증·프로필 단계 이름/휴대폰은 mock 고정값 표시',
          `이메일 중복확인(mock): ${MOCK_DUPLICATE_EMAIL} → "이미 가입된 이메일이에요. 로그인하거나 다른 이메일을 입력해 주세요."`,
          '금칙어: admin@test.com → "사용할 수 없는 이메일이에요. 다른 이메일을 입력해 주세요."',
          '원격 API(VITE_API_*): 이메일·약관·학교검색·본인인증(NICE) 실API / 세션 없으면 가입 완료 단계에서 안내',
          '가입 완료(mock·로컬·본인인증 mock) → /auth/sign-up/complete',
        ],
        href: '/auth/sign-up',
        buttonLabel: '회원가입 시작',
      },
      {
        title: '관리자 등록 회원 — 스텝3 본인인증 감지',
        steps: [
          '스텝1~2 일반과 동일',
          `스텝2 생년월일 ${MOCK_ADMIN_REGISTERED_BIRTH_DATE} 입력 후 스텝3 본인인증하기`,
          '회원가입 전용 관리자 등록 안내 (안내 박스 + 비밀번호 변경하기 / 이메일 찾기)',
          '비밀번호 변경하기 → change-password → confirm → complete (birth·identity 생략)',
        ],
        href: '/auth/sign-up',
        buttonLabel: '회원가입 시작',
      },
      {
        title: '관리자 등록 회원 — 이메일 중복확인',
        steps: [
          `이메일 단계에서 ${MOCK_ADMIN_REGISTERED_EMAIL} 중복확인`,
          '회원가입 전용 관리자 등록 안내 화면으로 이동',
        ],
        href: '/auth/sign-up',
        buttonLabel: '회원가입 시작',
      },
    ],
  },
  {
    title: '이메일 찾기 (/auth/find-email)',
    scenarios: [
      {
        title: '이메일 찾기 mock',
        steps: [
          '본인인증 모듈 placeholder → "본인인증 후 이메일 찾기" 클릭',
          '/auth/find-email/complete — Ja****@gmail.com 표시',
        ],
        href: '/auth/find-email',
        buttonLabel: '이메일 찾기',
      },
    ],
  },
  {
    title: '비밀번호 찾기 (/auth/find-password)',
    scenarios: [
      {
        title: '미가입 이메일 에러',
        steps: [
          'ja@gmail.com 입력 → 본인인증 하기',
          '"가입한 이메일을 찾지 못했어요. 입력한 정보를 다시 확인해 주세요."',
        ],
        href: '/auth/find-password',
        buttonLabel: '비밀번호 찾기',
      },
      {
        title: '정상 플로우',
        steps: ['그 외 유효한 이메일 → reset (새 비밀번호 2필드) → complete → sign-in'],
        href: '/auth/find-password',
        buttonLabel: '비밀번호 찾기',
      },
    ],
  },
  {
    title: '관리자 등록 회원 — 비밀번호 변경 (change-password mock)',
    scenarios: [
      {
        title: '검증 규칙',
        steps: [
          '현재 비밀번호 = 로그인 이메일(초기 비밀번호)과 일치해야 함',
          '새 비밀번호 = 이메일과 동일하면 에러',
          '새/확인 불일치, isValidPassword 미충족 시 에러',
        ],
      },
    ],
  },
  {
    title: '소셜 계정 연결 (/auth/sign-up/social-connect)',
    scenarios: [
      {
        title: '연결 mock',
        steps: [
          'Google 선택 → complete · 네이버 → connection-failed · 카카오 → already-linked',
          'complete / error 화면으로 이동',
        ],
        href: '/auth/sign-up/social-connect',
        buttonLabel: '소셜 연결',
      },
    ],
  },
]

const authRouteLinks = [
  { label: '로그인', href: '/auth/sign-in' },
  { label: '회원가입', href: '/auth/sign-up' },
  { label: '관리자 등록 안내', href: '/auth/admin-registered/notice' },
  { label: '이메일 찾기', href: '/auth/find-email' },
  { label: '비밀번호 찾기', href: '/auth/find-password' },
  { label: '로그인 필요', href: '/auth/required' },
  { label: '마이페이지', href: MYPAGE_PATH },
  { label: '소셜 오류', href: '/auth/social/error?reason=not-linked' },
] as const

export function DesignSystemPage() {
  const [numberedPage, setNumberedPage] = useState(1)
  const [compactPage, setCompactPage] = useState(1)
  const [underlineIsolatedTab, setUnderlineIsolatedTab] = useState('tab-1')
  const [underlineBorderedTab, setUnderlineBorderedTab] = useState('tab-1')
  const [pillLargeTab, setPillLargeTab] = useState('pill-1')
  const [pillMediumTab, setPillMediumTab] = useState('pill-1')
  const [categoryTab, setCategoryTab] = useState('pill-1')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFilterValue, setSearchFilterValue] = useState('all')
  const [searchFilterStatus, setSearchFilterStatus] = useState('all')
  const [selectValue, setSelectValue] = useState('')
  const [selectCompletedValue, setSelectCompletedValue] = useState('edit')
  const [toggleLarge, setToggleLarge] = useState(false)
  const [toggleSmall, setToggleSmall] = useState(true)
  const [toggleText, setToggleText] = useState(false)
  const [layoutSearchQuery, setLayoutSearchQuery] = useState('')
  const [layoutFilterTarget, setLayoutFilterTarget] = useState('all')
  const [layoutFilterStatus, setLayoutFilterStatus] = useState('all')
  const [layoutFilterOrg, setLayoutFilterOrg] = useState('all')
  const [layoutSort, setLayoutSort] = useState<(typeof layoutSortOptions)[number]['key']>('latest')
  const [layoutPage, setLayoutPage] = useState(1)
  const [richTextPreview, setRichTextPreview] = useState('')
  const [richTextHtmlPreview, setRichTextHtmlPreview] = useState('')
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBottomModalOpen, setIsBottomModalOpen] = useState(false)
  const [isFullModalOpen, setIsFullModalOpen] = useState(false)
  const [isAddressSearchModalOpen, setIsAddressSearchModalOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState('')
  const [stepProgressCurrent, setStepProgressCurrent] = useState(3)
  const [devMemberProfile, setDevMemberProfileState] = useState<PlatformMemberProfile>(() =>
    getDevMemberProfile()
  )
  const [devIsLoggedIn, setDevIsLoggedInState] = useState(() => getDevAuthLoggedIn())
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth)
  const [viewportPreset, setViewportPreset] = useState<ViewportPresetKey>('live')
  const [isViewportPreview] = useState(() => isViewportPreviewEmbed())

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleDevMemberProfileChange = (profile: PlatformMemberProfile) => {
    setDevMemberProfile(profile)
    setDevMemberProfileState(profile)
  }

  const handleDevLoginToggle = (loggedIn: boolean) => {
    setDevAuthLoggedIn(loggedIn)
    setDevIsLoggedInState(loggedIn)
  }

  const activeViewportPreset =
    VIEWPORT_PRESETS.find(preset => preset.key === viewportPreset) ?? VIEWPORT_PRESETS[3]
  const isFramedViewport = !isViewportPreview && viewportPreset !== 'live'
  const effectiveViewportWidth = isViewportPreview
    ? viewportWidth
    : (activeViewportPreset.width ?? viewportWidth)
  const isMobileHeader = effectiveViewportWidth <= platformBreakpoints.belowPcMax
  const isPcFull = effectiveViewportWidth >= platformBreakpoints.pcFullMin
  const layoutBandLabel = isMobileHeader
    ? `Mobile (≤${platformBreakpoints.belowPcMax})`
    : isPcFull
      ? `PC full (≥${platformBreakpoints.pcFullMin})`
      : `PC compact (${platformBreakpoints.pcMin}–${platformBreakpoints.pcCompactMax})`
  const headerModeLabel = isMobileHeader
    ? `모바일 헤더 (≤${platformBreakpoints.belowPcMax})`
    : `PC 헤더 (≥${platformBreakpoints.pcMin})`

  const { editor, api } = useRichTextEditor({
    enabled: true,
    initialContent: '**Platform** rich text 데모',
    contentFormat: 'markdown',
    placeholder: '내용을 입력해 주세요.',
  })

  const viewportToolbar = !isViewportPreview ? (
    <div
      className={isFramedViewport ? styles.viewportToolbarOverlay : styles.viewportToolbar}
    >
      <div className={styles.viewportToolbarTop}>
        <div className={styles.viewportToolbarInfo}>
          <PFText as="div" typo="bd-sm-sb" color="black">
            반응형 프리뷰
          </PFText>
          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
            {activeViewportPreset.rangeLabel}
            {activeViewportPreset.width != null ? ` · ${activeViewportPreset.width}px` : ` · ${viewportWidth}px`}
            {' · '}
            {layoutBandLabel}
            {' · '}
            {headerModeLabel}
            {' · '}
            {activeViewportPreset.description}
          </PFText>
        </div>
        <div className={styles.viewportToolbarActions}>
          <PFButton
            size="small"
            variant={devIsLoggedIn ? 'primary' : 'tertiary'}
            onClick={() => handleDevLoginToggle(true)}
          >
            로그인 ON
          </PFButton>
          <PFButton
            size="small"
            variant={!devIsLoggedIn ? 'primary' : 'tertiary'}
            onClick={() => handleDevLoginToggle(false)}
          >
            로그인 OFF
          </PFButton>
        </div>
      </div>
      <PFTabs
        items={viewportTabItems}
        value={viewportPreset}
        onChange={key => setViewportPreset(key as ViewportPresetKey)}
        variant="pill"
        size="medium"
        ariaLabel="반응형 프리셋"
        className={styles.viewportTabs}
      />
    </div>
  ) : null

  if (isFramedViewport) {
    return (
      <div className={styles.viewportShell}>
        {viewportToolbar}
        <div className={styles.viewportStage}>
          <iframe
            className={styles.viewportFrame}
            title={`반응형 프리뷰 ${activeViewportPreset.label}`}
            src={`/design-system?${VIEWPORT_PREVIEW_QUERY}=1`}
            style={{ width: activeViewportPreset.width ?? undefined }}
          />
        </div>
      </div>
    )
  }

  return (
    <section className={styles.page}>
      {viewportToolbar}

      {isViewportPreview ? (
        <div className={styles.viewportPreviewBadge}>
          <PFText as="div" typo="bd-sm-sb" color="black">
            Viewport preview embed
          </PFText>
          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
            {viewportWidth}px · {layoutBandLabel} · {headerModeLabel}
          </PFText>
        </div>
      ) : null}

      <div className={styles.header}>
        <PFText as="div" typo="hd-lg" color="black">
          Platform Design System
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          shared/ui 공통 컴포넌트와 스타일 토큰 쇼케이스입니다. (`/design-system`) 상단 탭으로
          반응형 3구간(Mobile · PC compact · PC full)을 확인할 수 있습니다.
        </PFText>
        <nav className={styles.dsNav} aria-label="디자인 시스템 섹션">
          {designSystemNav.map(item => (
            <a key={item.id} className={styles.dsNavLink} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <div className={styles.section} id="breakpoints">
        <PFText as="div" typo="hl-sm" color="black">
          Breakpoints
        </PFText>
        <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
          토큰: <code>shared/styles/breakpoints.css</code> · JS:{' '}
          <code>shared/lib/breakpoints.ts</code> · CSS custom media
        </PFText>
        <div className={styles.breakpointGrid}>
          {BREAKPOINT_RULES.map(rule => (
            <article key={rule.key} className={styles.breakpointCard} data-range={rule.key}>
              <PFText as="div" typo="bd-md-sb" color="black">
                {rule.label}
              </PFText>
              <PFText as="p" typo="hl-sm" color="primary-500">
                {rule.range}
              </PFText>
              <code className={styles.breakpointCode}>{rule.media}</code>
              <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
                {rule.query}
              </PFText>
              <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
                {rule.description}
              </PFText>
            </article>
          ))}
        </div>
        <div className={styles.usageCard}>
          <PFText as="div" typo="bd-sm-sb" color="black">
            CSS · JS 사용 예시
          </PFText>
          <code className={styles.codeBlock}>
            {`@media (--bp-below-pc) { /* mobile ~1079 */ }
@media (--bp-pc-up) { /* 1080+ shared PC */ }
@media (--bp-pc-compact) { /* 1080~1599 only */ }
@media (--bp-pc-full-up) { /* 1600+ */ }

platformMediaQueries.belowPc | pcUp | pcCompact | pcFullUp`}
          </code>
          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
            현재 폭: {effectiveViewportWidth}px · {layoutBandLabel}
          </PFText>
        </div>
      </div>

      <div className={styles.section} id="typography">
        <PFText as="div" typo="hl-sm" color="black">
          Typography
        </PFText>
        <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
          토큰 파일: <code>shared/styles/typography.css</code> · PFText{' '}
          <code>typo</code> prop · 형식: typo-&#123;분류&#125;-&#123;크기&#125;-&#123;굵기&#125;
        </PFText>

        <div className={styles.usageCard}>
          <PFText as="div" typo="bd-sm-sb" color="black">
            프로그램 목록 · 상단 타이틀
          </PFText>
          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
            Figma Pagetitle/Large · Primary_GR_01 (text gradient fill)
          </PFText>
          <code className={styles.codeBlock}>
            {'<PFText as="h1" typo="page-title" color="gradient-primary-01">'}
          </code>
          <PFText as="p" typo="page-title" color="gradient-primary-01" className={styles.pageTitleSample}>
            나에게 맞는
            <br />
            프로그램을 찾아볼까요?
          </PFText>
        </div>

        <div className={styles.usageCard}>
          <PFText as="div" typo="bd-sm-sb" color="black">
            참여하기 리스트 · 운영 일정
          </PFText>
          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
            Figma Body/Medium/medium · primary-500 · text-align right
          </PFText>
          <code className={styles.codeBlock}>
            {
              '<p className={styles.operatingPeriod}><PFText typo="bd-md-md" color="primary-500">'
            }
          </code>
          <p className={styles.scheduleSample}>
            <PFText as="span" typo="bd-md-md" color="primary-500">
              2026.04.03(금) – 2026.11.20(금)
            </PFText>
          </p>
        </div>

        <div className={styles.tokenTableWrap}>
          <table className={styles.tokenTable}>
            <thead>
              <tr>
                <th>CSS token</th>
                <th>PFText</th>
                <th>Figma</th>
                <th>Size</th>
                <th>Weight</th>
                <th>LH</th>
                <th>Tracking</th>
                <th>Sample</th>
              </tr>
            </thead>
            <tbody>
              {typographyTokenSpecs.map(item => (
                <tr key={item.token} className={'note' in item ? styles.tokenRowHighlight : undefined}>
                  <td>
                    <code>{item.token}</code>
                    {'note' in item ? (
                      <span className={styles.tokenNote}>{item.note}</span>
                    ) : null}
                  </td>
                  <td>
                    <code>{item.pfText}</code>
                  </td>
                  <td>{item.figma}</td>
                  <td>{item.size}</td>
                  <td>{item.weight}</td>
                  <td>{item.lineHeight}</td>
                  <td>{item.letterSpacing}</td>
                  <td>
                    <PFText as="span" typo={item.pfText} color="black">
                      가나다 Aa 12
                    </PFText>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section} id="color">
        <PFText as="div" typo="hl-sm" color="black">
          Color
        </PFText>
        <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
          토큰 파일: <code>shared/styles/color.css</code> · 그라디언트 텍스트 유틸:{' '}
          <code>shared/styles/text-gradient.css</code> · PFText <code>color</code> prop은 솔리드 +
          gradient-primary-0* 텍스트 필을 노출합니다.
        </PFText>

        {colorTokenGroups.map(group => (
          <div key={group.id} className={styles.colorGroup}>
            <PFText as="div" typo="bd-md-sb" color="black">
              {group.label}
            </PFText>
            <div className={styles.colorSwatchGrid}>
              {group.tokens.map(token => {
                const isLight =
                  token.hex.toUpperCase() === '#FFFFFF' ||
                  token.hex.toUpperCase().startsWith('#F') ||
                  token.hex.toUpperCase().startsWith('#E') ||
                  token.hex.toUpperCase().startsWith('#D') ||
                  token.hex.toUpperCase().startsWith('#C') ||
                  ('isGradient' in token && token.isGradient)
                return (
                  <div
                    key={token.cssVar}
                    className={[
                      styles.colorSwatch,
                      'note' in token ? styles.colorSwatchHighlight : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div
                      className={[styles.colorSwatchChip, isLight ? styles.colorSwatchChipBordered : undefined]
                        .filter(Boolean)
                        .join(' ')}
                      style={{ background: `var(${token.cssVar})` }}
                    />
                    <div className={styles.colorSwatchMeta}>
                      <code className={styles.colorSwatchVar}>{token.cssVar}</code>
                      <span className={styles.colorSwatchHex}>{token.hex}</span>
                      {'figma' in token && token.figma ? (
                        <span className={styles.tokenNote}>{token.figma}</span>
                      ) : null}
                      {'utility' in token && token.utility ? (
                        <span className={styles.tokenNote}>
                          utility: .{token.utility}
                        </span>
                      ) : null}
                      {'pfText' in token && token.pfText ? (
                        <span className={styles.tokenNote}>PFText color=&quot;{token.pfText}&quot;</span>
                      ) : null}
                      {'pfText' in token && token.pfText ? (
                        <PFText as="span" typo="hl-sm" color={token.pfText} className={styles.gradientTextSample}>
                          가나다 Gradient
                        </PFText>
                      ) : null}
                      {'note' in token && token.note ? (
                        <span className={styles.tokenNote}>{token.note}</span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.section} id="buttons">
        <PFText as="div" typo="hl-sm" color="black">
          PFArrowButton
        </PFText>
        <div className={styles.buttonStack}>
          {arrowButtonVariants.map(variant => (
            <div className={styles.buttonRow} key={variant}>
              <PFText typo="label-md" color="neutral-cool-500">
                {variant}
              </PFText>
              <div className={styles.buttonList}>
                {arrowButtonSizes.map(size => (
                  <PFArrowButton
                    key={`${variant}-${size}`}
                    size={size}
                    variant={variant}
                    aria-label={`${variant} ${size} arrow`}
                  />
                ))}
                <PFArrowButton variant={variant} disabled aria-label={`${variant} disabled`} />
                <PFArrowButton
                  variant={variant}
                  decorative
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFChevronButton
        </PFText>
        <div className={styles.buttonStack}>
          <div className={styles.buttonRow}>
            <PFText typo="label-md" color="neutral-cool-500">
              default
            </PFText>
            <div className={styles.buttonList}>
              <PFChevronButton direction="left" aria-label="이전" />
              <PFChevronButton direction="right" aria-label="다음" />
            </div>
          </div>
          <div className={styles.buttonRow}>
            <PFText typo="label-md" color="neutral-cool-500">
              disabled
            </PFText>
            <div className={styles.buttonList}>
              <PFChevronButton direction="left" disabled aria-label="이전 disabled" />
              <PFChevronButton direction="right" disabled aria-label="다음 disabled" />
            </div>
          </div>
          <div className={styles.buttonRow}>
            <PFText typo="label-md" color="neutral-cool-500">
              decorative
            </PFText>
            <div className={styles.buttonList}>
              <PFChevronButton direction="left" decorative />
              <PFChevronButton direction="right" decorative />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFPageButton
        </PFText>
        <div className={styles.buttonStack}>
          <div className={styles.buttonRow}>
            <PFText typo="label-md" color="neutral-cool-500">
              large
            </PFText>
            <div className={styles.buttonList}>
              <PFPageButton size="large" direction="left" aria-label="이전 large" />
              <PFPageButton size="large" direction="right" aria-label="다음 large" />
              <PFPageButton size="large" direction="left" disabled aria-label="이전 large disabled" />
              <PFPageButton size="large" direction="right" disabled aria-label="다음 large disabled" />
            </div>
          </div>
          <div className={styles.buttonRow}>
            <PFText typo="label-md" color="neutral-cool-500">
              small
            </PFText>
            <div className={styles.buttonList}>
              <PFPageButton size="small" direction="left" aria-label="이전 small" />
              <PFPageButton size="small" direction="right" aria-label="다음 small" />
              <PFPageButton size="small" direction="left" disabled aria-label="이전 small disabled" />
              <PFPageButton size="small" direction="right" disabled aria-label="다음 small disabled" />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFButton
        </PFText>
        <div className={styles.buttonStack}>
          {buttonVariants.map(variant => (
            <div className={styles.buttonRow} key={variant}>
              <PFText as="span" typo="label-md" color="neutral-cool-500">
                {variant}
              </PFText>
              <div className={styles.buttonList}>
                {buttonSizes.map(size => (
                  <PFButton size={size} variant={variant} key={`${variant}-${size}`}>
                    {size}
                  </PFButton>
                ))}
                <PFButton variant={variant} selected>
                  selected
                </PFButton>
                <PFButton variant={variant} disabled>
                  disabled
                </PFButton>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFFileDownload
        </PFText>
        <div className={styles.buttonStack}>
          <PFFileDownload fileName="[명단] UJAT 36기 최종합격 명단.pdf" />
          <PFFileDownload fileName="[안내문] UJAT 36기 향후 일정 안내 아주_긴_파일명_말줄임_테스트.pdf" />
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFAttachmentDropdown
        </PFText>
        <div className={styles.buttonStack}>
          <PFAttachmentDropdown
            files={[{ fileName: '디지털 범죄예방 코믹북.pdf' }]}
          />
          <PFAttachmentDropdown
            files={[
              { fileName: '디지털 범죄예방 코믹북.pdf' },
              { fileName: '디지털 범죄예방 코믹북_2.pdf' },
            ]}
          />
        </div>
      </div>

      <div className={styles.section} id="badges">
        <PFText as="div" typo="hl-sm" color="black">
          PFCategoryBadge
        </PFText>
        <div className={styles.buttonStack}>
          {categoryBadgeVariants.map(variant => (
            <div className={styles.buttonRow} key={variant}>
              <PFText as="span" typo="label-md" color="neutral-cool-500">
                {variant}
              </PFText>
              <div className={styles.buttonList}>
                {badgeSizes.map(size => (
                  <PFCategoryBadge key={`${variant}-${size}`} size={size} variant={variant}>
                    카테고리
                  </PFCategoryBadge>
                ))}
              </div>
            </div>
          ))}
          {categoryBadgeIconVariants.map(iconVariant => (
            <div className={styles.buttonRow} key={`icon-${iconVariant}`}>
              <PFText as="span" typo="label-md" color="neutral-cool-500">
                icon / {iconVariant}
              </PFText>
              <div className={styles.buttonList}>
                {badgeSizes.map(size => (
                  <PFCategoryBadge
                    key={`icon-${iconVariant}-${size}`}
                    size={size}
                    iconVariant={iconVariant}
                    icon={
                      <img
                        src={searchMintIconUrl}
                        alt=""
                        width={16}
                        height={16}
                        aria-hidden="true"
                      />
                    }
                  >
                    카테고리
                  </PFCategoryBadge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFStateBadge
        </PFText>
        <div className={styles.buttonStack}>
          {stateBadgeTones.map(tone => (
            <div className={styles.buttonRow} key={tone}>
              <PFText as="span" typo="label-md" color="neutral-cool-500">
                {tone}
              </PFText>
              <div className={styles.buttonList}>
                {badgeSizes.map(size => (
                  <PFStateBadge key={`${tone}-${size}`} size={size} tone={tone}>
                    상태
                  </PFStateBadge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFMetaBadge
        </PFText>
        <div className={styles.buttonList}>
          <PFMetaBadge
            icon={<img src={searchMintIconUrl} alt="" width={16} height={16} aria-hidden="true" />}
            primary="text"
            secondary="text"
          />
          <PFMetaBadge
            icon={<img src={searchMintIconUrl} alt="" width={16} height={16} aria-hidden="true" />}
            primary="학교"
            secondary="서울"
          />
        </div>
      </div>

      <div className={styles.section} id="forms">
        <PFText as="div" typo="hl-sm" color="black">
          PFTextInput
        </PFText>
        <div className={styles.inputStack}>
          {inputSizes.map(size => (
            <div className={styles.inputRow} key={size}>
              <PFText as="span" typo="label-md" color="neutral-cool-500">
                {size}
              </PFText>
              <PFTextInput size={size} label="Label" placeholder="text" required />
              <PFTextInput size={size} label="Label" placeholder="text" defaultValue="text" />
              <PFTextInput size={size} label="Label" placeholder="text" hasIcon />
              <PFTextInput
                size={size}
                label="Label"
                placeholder="text"
                defaultValue="text"
                disabled
              />
              <PFTextInput size={size} label="Label" placeholder="text" defaultValue="text" error />
              <PFTextInput
                size={size}
                label="Label"
                placeholder="text"
                message="안내 메시지"
                messageStatus="neutral"
              />
              <PFTextInput
                size={size}
                label="Label"
                placeholder="text"
                defaultValue="text"
                message="사용 가능한 값입니다."
                messageStatus="success"
              />
              <PFTextInput
                size={size}
                label="Label"
                placeholder="text"
                defaultValue="text"
                error
                message="오류 메시지"
                messageStatus="error"
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFSelect
        </PFText>
        <div className={styles.inputStack}>
          {inputSizes.map(size => (
            <div className={styles.inputRow} key={size}>
              <PFText as="span" typo="label-md" color="neutral-cool-500">
                {size}
              </PFText>
              <PFSelect
                size={size}
                label="Label"
                placeholder="text"
                options={selectDemoOptions}
                value={selectValue}
                onValueChange={setSelectValue}
                required
              />
              <PFSelect
                size={size}
                label="Label"
                placeholder="text"
                options={selectDemoOptions}
                value={selectCompletedValue}
                onValueChange={setSelectCompletedValue}
              />
              <PFSelect
                size={size}
                label="Label"
                placeholder="text"
                options={selectDemoOptions}
                value="edit"
                onValueChange={() => undefined}
                disabled
              />
              <PFSelect
                size={size}
                label="Label"
                placeholder="text"
                options={selectDemoOptions}
                value="edit"
                onValueChange={() => undefined}
                error
                message="오류 메시지"
                messageStatus="error"
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFSearchInput
        </PFText>
        <div className={styles.searchStack}>
          <PFSearchInput value={searchQuery} onValueChange={setSearchQuery} />
          <PFSearchInput defaultValue="기업가 정신" />
          <PFSearchInput disabled placeholder="disabled" />
          <PFSearchInput
            variant="outlined"
            placeholder="제목, 내용으로 검색해 보세요"
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <PFSearchInput variant="outlined" defaultValue="기업가 정신" />
          <PFSearchInput variant="outlined" disabled placeholder="disabled" />
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFSearchFilter
        </PFText>
        <div className={styles.searchStack}>
          <div className={styles.searchFilterRow}>
            <PFSearchFilter
              label="교육대상"
              options={educationTargetFilterOptions}
              value={searchFilterValue}
              onChange={setSearchFilterValue}
            />
            <PFSearchFilter
              label="모집현황"
              options={recruitmentStatusFilterOptions}
              value={searchFilterStatus}
              onChange={setSearchFilterStatus}
            />
            <PFSearchFilter
              label="모집현황"
              options={recruitmentStatusFilterOptions}
              value="all"
              onChange={() => undefined}
              disabled
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFToggle
        </PFText>
        <div className={styles.toggleStack}>
          <PFToggle variant="check-large" checked={toggleLarge} onChange={setToggleLarge}>
            <PFText typo="bd-lg-sb" color="inherit">
              전체 동의하기
            </PFText>
          </PFToggle>
          <PFToggle variant="check-small" checked={toggleSmall} onChange={setToggleSmall}>
            <PFText typo="bd-md-md" color="black">
              서비스 이용약관
            </PFText>
          </PFToggle>
          <PFToggle
            variant="text"
            checked={toggleText}
            onChange={setToggleText}
            offLabel="선택"
            onLabel="필수"
          />
          <PFToggle
            variant="text"
            checked={!toggleText}
            onChange={checked => setToggleText(!checked)}
            offLabel="오름차순"
            onLabel="내림차순"
          />
        </div>
      </div>

      <div className={styles.section} id="navigation">
        <PFText as="div" typo="hl-sm" color="black">
          PFStepProgress
        </PFText>
        <div className={styles.buttonStack}>
          <div className={styles.buttonRow}>
            <PFText as="span" typo="label-md" color="neutral-cool-500">
              step {stepProgressCurrent} / 7
            </PFText>
            <div className={styles.buttonList}>
              <PFButton
                size="small"
                variant="tertiary"
                onClick={() => setStepProgressCurrent(step => Math.max(1, step - 1))}
              >
                이전
              </PFButton>
              <PFButton
                size="small"
                variant="tertiary"
                onClick={() => setStepProgressCurrent(step => Math.min(7, step + 1))}
              >
                다음
              </PFButton>
            </div>
          </div>
          <PFStepProgress currentStep={stepProgressCurrent} totalSteps={7} />
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFPagination
        </PFText>
        <div className={styles.paginationStack}>
          <div className={styles.paginationRow}>
            <PFText as="span" typo="label-md" color="neutral-cool-500">
              numbered
            </PFText>
            <div className={styles.paginationList}>
              {paginationSizes.map(size => (
                <PFPagination
                  currentPage={numberedPage}
                  totalPages={8}
                  onPageChange={setNumberedPage}
                  size={size}
                  key={`numbered-${size}`}
                />
              ))}
            </div>
          </div>

          <div className={styles.paginationRow}>
            <PFText as="span" typo="label-md" color="neutral-cool-500">
              compact
            </PFText>
            <div className={styles.paginationList}>
              {paginationSizes.map(size => (
                <PFPagination
                  currentPage={compactPage}
                  totalPages={8}
                  onPageChange={setCompactPage}
                  variant="compact"
                  size={size}
                  key={`compact-${size}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFSort
        </PFText>
        <PFSort
          options={[...layoutSortOptions]}
          value={layoutSort}
          onChange={key => setLayoutSort(key as (typeof layoutSortOptions)[number]['key'])}
        />
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFDivider
        </PFText>
        <div className={styles.buttonStack}>
          <div className={styles.buttonRow}>
            <PFText as="span" typo="label-md" color="neutral-cool-500">
              default
            </PFText>
            <PFDivider />
          </div>
          <div className={styles.buttonRow}>
            <PFText as="span" typo="label-md" color="neutral-cool-500">
              focus (결과 확인)
            </PFText>
            <PFDivider variant="focus" />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFTabs
        </PFText>
        <div className={styles.tabsStack}>
          <div className={styles.tabsRow}>
            <PFText as="span" typo="label-md" color="neutral-cool-500">
              underline / isolated
            </PFText>
            <PFTabs
              items={tabItems}
              value={underlineIsolatedTab}
              onChange={setUnderlineIsolatedTab}
              variant="underline"
              underlineStyle="isolated"
            />
          </div>

          <div className={styles.tabsRow}>
            <PFText as="span" typo="label-md" color="neutral-cool-500">
              underline / bordered
            </PFText>
            <PFTabs
              items={tabItems}
              value={underlineBorderedTab}
              onChange={setUnderlineBorderedTab}
              variant="underline"
              underlineStyle="bordered"
            />
          </div>

          <div className={styles.tabsRow}>
            <PFText as="span" typo="label-md" color="neutral-cool-500">
              pill / large
            </PFText>
            <PFTabs
              items={pillItems}
              value={pillLargeTab}
              onChange={setPillLargeTab}
              variant="pill"
              size="large"
            />
          </div>

          <div className={styles.tabsRow}>
            <PFText as="span" typo="label-md" color="neutral-cool-500">
              pill / medium
            </PFText>
            <PFTabs
              items={pillItems}
              value={pillMediumTab}
              onChange={setPillMediumTab}
              variant="pill"
              size="medium"
            />
          </div>

          <div className={styles.tabsRow}>
            <PFText as="span" typo="label-md" color="neutral-cool-500">
              category (카테고리 배지 탭)
            </PFText>
            <PFTabs
              items={[
                { key: 'pill-1', label: '전체' },
                { key: 'pill-2', label: '결과발표' },
                { key: 'pill-3', label: '서류 심사' },
                { key: 'pill-4', label: '심사결과' },
              ]}
              value={categoryTab}
              onChange={setCategoryTab}
              variant="category"
              ariaLabel="카테고리"
            />
          </div>
        </div>
      </div>

      <div className={styles.section} id="layout">
        <PFText as="div" typo="hl-sm" color="black">
          SearchListLayout
        </PFText>
        <SearchListLayout
          search={<PFSearchInput value={layoutSearchQuery} onValueChange={setLayoutSearchQuery} />}
          filters={
            <>
              <PFSearchFilter
                label="교육대상"
                options={educationTargetFilterOptions}
                value={layoutFilterTarget}
                onChange={setLayoutFilterTarget}
              />
              <PFSearchFilter
                label="모집현황"
                options={recruitmentStatusFilterOptions}
                value={layoutFilterStatus}
                onChange={setLayoutFilterStatus}
              />
              <PFSearchFilter
                label="운영기관"
                options={mockOrgFilterOptions}
                value={layoutFilterOrg}
                onChange={setLayoutFilterOrg}
              />
            </>
          }
          onFilterReset={() => {
            setLayoutFilterTarget('all')
            setLayoutFilterStatus('all')
            setLayoutFilterOrg('all')
          }}
          toolbarTitle="총 32개 프로그램"
          sort={
            <PFSort
              options={[...layoutSortOptions]}
              value={layoutSort}
              onChange={key => setLayoutSort(key as (typeof layoutSortOptions)[number]['key'])}
            />
          }
          pagination={
            <PFPagination currentPage={layoutPage} totalPages={8} onPageChange={setLayoutPage} />
          }
        >
          <div className={styles.listSlotPlaceholder} />
        </SearchListLayout>
      </div>

      <div className={styles.section} id="modals">
        <PFText as="div" typo="hl-sm" color="black">
          PFModal
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          mobilePlacement: center(기본) · bottom(바텀시트) · full(전체 화면). PC 미만에서 확인하세요.
        </PFText>
        <div className={styles.modalStack}>
          <PFButton variant="secondary" onClick={() => setIsModalOpen(true)}>
            center
          </PFButton>
          <PFButton variant="secondary" onClick={() => setIsBottomModalOpen(true)}>
            bottom
          </PFButton>
          <PFButton variant="secondary" onClick={() => setIsFullModalOpen(true)}>
            full
          </PFButton>
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          AddressSearchModal
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          회원가입 프로필 등과 동일한 주소 검색 모달입니다. PC는 중앙, 1080 미만은 바텀시트입니다.
        </PFText>
        <div className={styles.modalStack}>
          <PFButton variant="secondary" onClick={() => setIsAddressSearchModalOpen(true)}>
            주소 검색 모달 열기
          </PFButton>
          {selectedAddress ? (
            <PFText as="p" typo="bd-sm-md" color="black">
              선택 주소: {selectedAddress}
            </PFText>
          ) : null}
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFAlertModal
        </PFText>
        <div className={styles.modalStack}>
          <PFButton variant="secondary" onClick={() => setIsAlertModalOpen(true)}>
            PFAlertModal 열기
          </PFButton>
        </div>
      </div>

      <div className={styles.section} id="icons">
        <PFText as="div" typo="hl-sm" color="black">
          Social Login Icons
        </PFText>
        <div className={styles.buttonList}>
          <GoogleSocialLoginIcon />
          <NaverSocialLoginIcon />
          <KakaoSocialLoginIcon />
        </div>
      </div>

      <div className={styles.section} id="rich-text">
        <PFText as="div" typo="hl-sm" color="black">
          PfRichTextEditor
        </PFText>
        <div className={styles.richTextDemo}>
          <PfRichTextEditor editor={editor} />
          <div className={styles.richTextActions}>
            <PFButton
              size="medium"
              variant="secondary"
              onClick={() => setRichTextPreview(api?.getMarkdown() ?? '')}
            >
              Markdown 미리보기
            </PFButton>
            <PFButton
              size="medium"
              variant="secondary"
              onClick={() => setRichTextHtmlPreview(api?.getHTML() ?? '')}
            >
              HTML 미리보기
            </PFButton>
          </div>
          {richTextPreview ? (
            <div className={styles.richTextPreview}>
              <PFText as="div" typo="label-md" color="neutral-cool-500">
                Markdown 미리보기
              </PFText>
              <RichTextViewer markdown={richTextPreview} maxHeight="240px" />
            </div>
          ) : null}
          {richTextHtmlPreview ? (
            <div className={styles.richTextPreview}>
              <PFText as="div" typo="label-md" color="neutral-cool-500">
                HTML 미리보기
              </PFText>
              <pre className={styles.richTextHtmlPreview}>{richTextHtmlPreview}</pre>
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.section} id="form-template">
        <PFText as="div" typo="hl-sm" color="black">
          FormTemplate (CMS embed)
        </PFText>
        <FormTemplateSmokeDemo />
      </div>

      <div className={styles.section} id="dev-tools">
        <PFText as="div" typo="hl-sm" color="black">
          Mypage Dev Tools
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          마이페이지 유형 분기·로그인 게이트를 localStorage mock으로 확인합니다.
        </PFText>

        <div className={styles.guideBlock}>
          <PFText as="div" typo="bd-md-sb" color="black">
            회원 프로필 (platform:dev:member-profile)
          </PFText>
          <div className={styles.guideLinkRow}>
            {DEV_MEMBER_PROFILE_OPTIONS.map(option => (
              <PFButton
                key={option.value}
                size="medium"
                variant={devMemberProfile === option.value ? 'primary' : 'tertiary'}
                onClick={() => handleDevMemberProfileChange(option.value)}
              >
                {option.label}
              </PFButton>
            ))}
          </div>
        </div>

        <div className={styles.guideBlock}>
          <PFText as="div" typo="bd-md-sb" color="black">
            dev 로그인 상태
          </PFText>
          <div className={styles.guideLinkRow}>
            <PFButton
              size="medium"
              variant={devIsLoggedIn ? 'primary' : 'tertiary'}
              onClick={() => handleDevLoginToggle(true)}
            >
              로그인 ON
            </PFButton>
            <PFButton
              size="medium"
              variant={!devIsLoggedIn ? 'primary' : 'tertiary'}
              onClick={() => handleDevLoginToggle(false)}
            >
              로그인 OFF
            </PFButton>
            <PFButton
              size="medium"
              variant="secondary"
              onClick={() => window.location.assign(MYPAGE_PATH)}
            >
              마이페이지 열기
            </PFButton>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          Platform Auth 화면 테스트 가이드 (Mock)
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          API 연동 전 인증 관련 화면의 mock 동작·분기 조건·테스트 데이터입니다. 이메일 ID는
          shared/lib/email-id 정책(형식·길이·금칙어·소문자 정규화)을 따르며, 관리자 등록 회원은 최초
          로그인과 회원가입에서 서로 다른 안내 UI로 분기합니다.
        </PFText>

        <div className={styles.guideBlock}>
          <PFText as="div" typo="bd-md-sb" color="black">
            Mock 데이터
          </PFText>
          <div className={styles.guideTable}>
            {authMockDataRows.map(row => (
              <div className={styles.guideTableRow} key={row.label}>
                <PFText as="span" typo="bd-sm-md" color="neutral-cool-500">
                  {row.label}
                </PFText>
                <PFText as="span" typo="bd-sm-sb" color="black">
                  {row.value}
                </PFText>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.guideBlock}>
          <PFText as="div" typo="bd-md-sb" color="black">
            화면 바로가기
          </PFText>
          <div className={styles.guideLinkRow}>
            {authRouteLinks.map(link => (
              <PFButton
                key={link.href}
                size="medium"
                variant="tertiary"
                onClick={() => window.location.assign(link.href)}
              >
                {link.label}
              </PFButton>
            ))}
          </div>
        </div>

        {authGuideSections.map(section => (
          <div className={styles.guideBlock} key={section.title}>
            <PFText as="div" typo="bd-md-sb" color="black">
              {section.title}
            </PFText>
            <div className={styles.guideScenarioStack}>
              {section.scenarios.map(scenario => (
                <div className={styles.guideCard} key={scenario.title}>
                  <PFText as="div" typo="bd-md-sb" color="black">
                    {scenario.title}
                  </PFText>
                  <ol className={styles.guideList}>
                    {scenario.steps.map(step => (
                      <li key={step}>
                        <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
                          {step}
                        </PFText>
                      </li>
                    ))}
                  </ol>
                  {scenario.href ? (
                    <PFButton
                      size="medium"
                      variant="primary"
                      onClick={() => window.location.assign(scenario.href!)}
                    >
                      {scenario.buttonLabel}
                    </PFButton>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className={styles.guideNote}>
          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
            dev 로그인 상태: localStorage{' '}
            <PFText as="span" typo="bd-sm-sb" color="black">
              platform:dev:is-logged-in
            </PFText>
            . 마이페이지 프로필:{' '}
            <PFText as="span" typo="bd-sm-sb" color="black">
              platform:dev:member-profile
            </PFText>
            . 관리자 등록 wizard:{' '}
            <PFText as="span" typo="bd-sm-sb" color="black">
              platform:dev:admin-registered-wizard
            </PFText>
            . API 연동 후 mock 함수(isMockAdminRegisteredFirstLogin,
            isMockAdminRegisteredIdentityMatch 등)를 API 응답으로 교체합니다.
          </PFText>
        </div>
      </div>

      <PFModal open={isModalOpen} title="모달 제목" onClose={() => setIsModalOpen(false)}>
        <PFText as="p" typo="bd-md-rg" color="neutral-warm-600">
          PFModal 기본(center) 배치입니다. X 버튼과 자유로운 children 콘텐츠를 가집니다.
        </PFText>
      </PFModal>

      <PFModal
        open={isBottomModalOpen}
        title="바텀시트 모달"
        mobilePlacement="bottom"
        onClose={() => setIsBottomModalOpen(false)}
      >
        <PFText as="p" typo="bd-md-rg" color="neutral-warm-600">
          mobilePlacement=&quot;bottom&quot; — PC 미만에서 바텀시트로 표시됩니다.
        </PFText>
      </PFModal>

      <PFModal
        open={isFullModalOpen}
        title="전체 화면 모달"
        mobilePlacement="full"
        onClose={() => setIsFullModalOpen(false)}
      >
        <PFText as="p" typo="bd-md-rg" color="neutral-warm-600">
          mobilePlacement=&quot;full&quot; — PC 미만에서 전체 화면으로 표시됩니다.
        </PFText>
      </PFModal>

      <AddressSearchModal
        open={isAddressSearchModalOpen}
        onClose={() => setIsAddressSearchModalOpen(false)}
        onSelect={selection => setSelectedAddress(selection.address)}
      />

      <PFAlertModal
        open={isAlertModalOpen}
        title="본인인증을 완료하지 못했어요."
        description="정보를 확인한 뒤 다시 시도해 주세요."
        onConfirm={() => setIsAlertModalOpen(false)}
      />
    </section>
  )
}
