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
  PFCategoryBadge,
  PFAlertModal,
  PFArrowButton,
  PFChevronButton,
  PFButton,
  PFModal,
  PFMetaBadge,
  PFPagination,
  PFSearchFilter,
  PFSearchInput,
  PFStateBadge,
  PFTabs,
  PFToggle,
  PFText,
  PFTextInput,
  PFSelect,
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

const typographyItems = [
  { label: 'page-title', typo: 'page-title' },
  { label: 'hd-lg', typo: 'hd-lg' },
  { label: 'hl-lg', typo: 'hl-lg' },
  { label: 'bd-lg-rg', typo: 'bd-lg-rg' },
  { label: 'bd-md-rg', typo: 'bd-md-rg' },
  { label: 'bd-sm-rg', typo: 'bd-sm-rg' },
  { label: 'caption-rg', typo: 'caption-rg' },
] as const

const colorItems = [
  { label: 'black', color: 'black' },
  { label: 'neutral-cool-500', color: 'neutral-cool-500' },
  { label: 'neutral-cool-600', color: 'neutral-cool-600' },
  { label: 'primary-500', color: 'primary-500' },
  { label: 'primary-700', color: 'primary-700' },
  { label: 'error', color: 'error' },
  { label: 'success', color: 'success' },
  { label: 'gradient-primary-01', color: 'gradient-primary-01' },
] as const

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

export function TestPage() {
  const [numberedPage, setNumberedPage] = useState(1)
  const [compactPage, setCompactPage] = useState(1)
  const [underlineIsolatedTab, setUnderlineIsolatedTab] = useState('tab-1')
  const [underlineBorderedTab, setUnderlineBorderedTab] = useState('tab-1')
  const [pillLargeTab, setPillLargeTab] = useState('pill-1')
  const [pillMediumTab, setPillMediumTab] = useState('pill-1')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFilterValue, setSearchFilterValue] = useState('all')
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
  const [isAddressSearchModalOpen, setIsAddressSearchModalOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState('')
  const [devMemberProfile, setDevMemberProfileState] = useState<PlatformMemberProfile>(() =>
    getDevMemberProfile()
  )
  const [devIsLoggedIn, setDevIsLoggedInState] = useState(() => getDevAuthLoggedIn())
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth)

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

  const isMobileHeader = viewportWidth <= platformBreakpoints.belowPcMax
  const viewportLabel = isMobileHeader
    ? `모바일 헤더 (≤${platformBreakpoints.belowPcMax})`
    : `PC 헤더 (≥${platformBreakpoints.pcMin})`

  const { editor, api } = useRichTextEditor({
    enabled: true,
    initialContent: '**Platform** rich text 데모',
    contentFormat: 'markdown',
    placeholder: '내용을 입력해 주세요.',
  })

  return (
    <section className={styles.page}>
      <div className={styles.mobileVerifyBar}>
        <div className={styles.mobileVerifyInfo}>
          <PFText as="div" typo="bd-sm-sb" color="black">
            모바일 UI 검증
          </PFText>
          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
            {viewportWidth}px · {viewportLabel}
            {isMobileHeader ? ' · 햄버거로 메뉴 확인' : ' · DevTools에서 폭을 줄여 모바일 헤더 확인'}
          </PFText>
        </div>
        <div className={styles.mobileVerifyActions}>
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

      <div className={styles.header}>
        <PFText as="div" typo="hd-lg" color="black">
          Platform Component Test
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          공통 컴포넌트와 스타일 토큰을 확인하기 위한 테스트 페이지입니다.
        </PFText>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          FormTemplate (CMS embed)
        </PFText>
        <FormTemplateSmokeDemo />
      </div>

      <div className={styles.section}>
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

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFText Typography
        </PFText>
        <div className={styles.stack}>
          {typographyItems.map(({ label, typo }) => (
            <div className={styles.sampleRow} key={label}>
              <PFText as="span" typo="label-md" color="neutral-cool-500">
                {label}
              </PFText>
              <PFText as="span" typo={typo} color="black">
                JA Korea 사용자 홈페이지 텍스트 샘플
              </PFText>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFText Color
        </PFText>
        <div className={styles.colorGrid}>
          {colorItems.map(({ label, color }) => (
            <div className={styles.colorCard} key={label}>
              <PFText as="span" typo="bd-sm-sb" color={color}>
                {label}
              </PFText>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
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

      <div className={styles.section}>
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
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFSearchFilter
        </PFText>
        <div className={styles.searchStack}>
          <PFSearchFilter
            label="모집현황"
            options={recruitmentStatusFilterOptions}
            value={searchFilterValue}
            onChange={setSearchFilterValue}
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
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          SearchListLayout
        </PFText>
        <SearchListLayout
          search={<PFSearchInput value={layoutSearchQuery} onValueChange={setLayoutSearchQuery} />}
          filters={
            <>
              <PFSearchFilter
                label="모집대상"
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
            <>
              {layoutSortOptions.map(option => (
                <button
                  key={option.key}
                  type="button"
                  className={[
                    styles.sortOption,
                    layoutSort === option.key ? styles.sortOptionActive : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setLayoutSort(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </>
          }
          pagination={
            <PFPagination currentPage={layoutPage} totalPages={8} onPageChange={setLayoutPage} />
          }
        >
          <div className={styles.listSlotPlaceholder} />
        </SearchListLayout>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFModal
        </PFText>
        <div className={styles.modalStack}>
          <PFButton variant="secondary" onClick={() => setIsModalOpen(true)}>
            PFModal 열기
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

      <div className={styles.section}>
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
          PFModal은 X 버튼과 자유로운 children 콘텐츠를 가진 작업용 모달입니다.
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
