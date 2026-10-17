import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import type { PortalProfileResponse } from '@/features/auth/sign-in/api/types'
import {
  getSettingsLnbItems,
  isInstructorMypageProfile,
  isSchoolTeacherMypageProfile,
  mapPortalProfileToSettingsView,
  MYPAGE_PATH,
  MYPAGE_SETTINGS_PATH,
  SettingsConsentsView,
  SettingsEditForm,
  SettingsSocialAccountsView,
  SettingsView,
  useMypageMember,
  useSettingsView,
  type MypageLnbItemKey,
  type SettingsProfileInput,
} from '@/features/mypage'
import { mapInstructorFormValuesToCmsProfile } from '@/features/mypage/instructor-apply/api/map-create-request'
import type { InstructorSettingsSectionId } from '@/features/mypage/settings/lib/format-instructor-settings-display'
import { INSTRUCTOR_SETTINGS_ESSAY_SECTIONS } from '@/features/mypage/settings/lib/format-instructor-settings-display'
import { buildInstructorSettingsFormValues } from '@/features/mypage/settings/lib/map-instructor-settings-form'
import { SettingsInstructorSectionEditForm } from '@/features/mypage/settings/ui/instructor-profile/section-edit-form'
import { INSTRUCTOR_FORM_SECTION_BASE_TITLES } from '@jakorea/domain/instructor/form-layout'
import { ProgramBackButton } from '@/features/program'
import { useMediaQuery } from '@/shared/hooks'
import {
  getAccessToken,
  getDevAuthLoggedIn,
  isRemoteApiConfigured,
  platformMediaQueries,
  resolveLoginRequiredPath,
} from '@/shared/lib'
import { PFLoadingSpinner, PFText } from '@/shared/ui'
import { MypageLayout } from '@/widgets/mypage-layout'
import styles from './page.module.css'

type SettingsTab = 'profile' | 'social' | 'consents'
type SettingsInstructorEditMode = `edit-instructor-${InstructorSettingsSectionId}`
type SettingsMode = 'view' | 'edit-basic' | SettingsInstructorEditMode

const INSTRUCTOR_EDIT_PREFIX = 'edit-instructor-'

function parseInstructorSectionFromMode(mode: SettingsMode): InstructorSettingsSectionId | null {
  if (!mode.startsWith(INSTRUCTOR_EDIT_PREFIX)) return null
  return mode.slice(INSTRUCTOR_EDIT_PREFIX.length) as InstructorSettingsSectionId
}

function resolveInstructorEditPageTitle(section: InstructorSettingsSectionId): string {
  const essay = INSTRUCTOR_SETTINGS_ESSAY_SECTIONS.find(item => item.id === section)
  if (essay) return `${essay.title} 수정`
  switch (section) {
    case 'education':
      return `${INSTRUCTOR_FORM_SECTION_BASE_TITLES.education} 수정`
    case 'career':
      return `${INSTRUCTOR_FORM_SECTION_BASE_TITLES.career} 수정`
    case 'ja':
      return `${INSTRUCTOR_FORM_SECTION_BASE_TITLES.ja} 수정`
    case 'license':
      return `${INSTRUCTOR_FORM_SECTION_BASE_TITLES.license} 수정`
    case 'award':
      return '수상 및 수료 내역 수정'
    default:
      return '프로필 수정'
  }
}

function readSettingsTab(params: URLSearchParams): SettingsTab {
  const tab = params.get('tab')
  if (tab === 'social' || tab === 'consents') return tab
  return 'profile'
}

function resolvePageTitle(tab: SettingsTab, mode: SettingsMode) {
  const instructorSection = parseInstructorSectionFromMode(mode)
  if (instructorSection) return resolveInstructorEditPageTitle(instructorSection)
  if (mode === 'edit-basic') return '회원정보 수정'
  if (tab === 'social') return '소셜 계정 연동 관리'
  if (tab === 'consents') return '약관 및 정책 동의 관리'
  return '회원정보 설정'
}

function resolveLnbKey(tab: SettingsTab, mode: SettingsMode) {
  if (
    tab === 'profile' ||
    mode === 'edit-basic' ||
    mode.startsWith(INSTRUCTOR_EDIT_PREFIX)
  ) {
    return 'settingsProfile' as const
  }
  if (tab === 'social') return 'settingsSocial' as const
  return 'settingsConsents' as const
}

export function MypageSettingsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [tab, setTab] = useState<SettingsTab>(() => readSettingsTab(searchParams))
  const [mode, setMode] = useState<SettingsMode>('view')
  const [localProfile, setLocalProfile] = useState<SettingsProfileInput | null>(null)
  const { isChecking, isRedirecting } = useAdminRegisteredNoticeRedirect()
  const { isRemoteSession, isLoading, isError, profile, guardian } = useSettingsView()
  const member = useMypageMember()
  const isBelowPc = useMediaQuery(platformMediaQueries.belowPc)
  const effectiveProfile = localProfile ?? profile
  const isTeacher = isSchoolTeacherMypageProfile(member.profile)
  const isInstructor = isInstructorMypageProfile(member.profile)
  const instructorSection = parseInstructorSectionFromMode(mode)
  const [instructorFormValues, setInstructorFormValues] =
    useState<InstructorSharedProfileFormValues | null>(null)

  useEffect(() => {
    if (!isInstructor) {
      setInstructorFormValues(null)
      return
    }
    setInstructorFormValues(
      buildInstructorSettingsFormValues(effectiveProfile as PortalProfileResponse),
    )
  }, [effectiveProfile, isInstructor])

  const instructorProfileForView = useMemo(() => {
    if (!isInstructor) return null
    return (
      instructorFormValues ??
      buildInstructorSettingsFormValues(effectiveProfile as PortalProfileResponse)
    )
  }, [effectiveProfile, instructorFormValues, isInstructor])
  const view = mapPortalProfileToSettingsView(effectiveProfile, guardian, {
    variant: isTeacher ? 'teacher' : 'individual',
  })
  const lnbActiveKey = resolveLnbKey(tab, mode)
  const lnbItems = getSettingsLnbItems(lnbActiveKey)
  const pageTitle = resolvePageTitle(tab, mode)

  useEffect(() => {
    const hasRemoteToken = isRemoteApiConfigured() && Boolean(getAccessToken())
    if (hasRemoteToken) {
      setIsAuthReady(true)
      return
    }

    if (!getDevAuthLoggedIn()) {
      navigate(resolveLoginRequiredPath(MYPAGE_SETTINGS_PATH))
      return
    }

    setIsAuthReady(true)
  }, [navigate])

  if (!isAuthReady || isChecking || isRedirecting) {
    return null
  }

  const selectTab = (next: SettingsTab) => {
    setTab(next)
    const params = new URLSearchParams(searchParams)
    params.delete('socialError')
    if (next === 'profile') {
      params.delete('tab')
    } else {
      params.set('tab', next)
    }
    setSearchParams(params, { replace: true })
  }

  const handleLnbItemSelect = (key: MypageLnbItemKey) => {
    if (key === 'settingsConsents' || key === 'settingsSocial') {
      setMode('view')
      selectTab(key === 'settingsSocial' ? 'social' : 'consents')
      return
    }

    if (key === 'settingsProfile') {
      selectTab('profile')
    }
  }

  const backButton = (
    <ProgramBackButton size="small" label="마이페이지로" onClick={() => navigate(MYPAGE_PATH)} />
  )

  const pageTitleNode = (
    <PFText as="h1" typo="hd-lg" color="black" className={styles.pageTitle}>
      {pageTitle}
    </PFText>
  )

  const mobilePageHeader = (
    <>
      <div className={styles.backLink}>{backButton}</div>
      {pageTitleNode}
    </>
  )

  const wrap = (children: ReactNode) => (
    <MypageLayout
      variant="subpage"
      mobileStack={isBelowPc ? 'headingFirst' : 'default'}
      lnbItems={lnbItems}
      lnbAppearance={isBelowPc ? 'category' : undefined}
      lnbAriaLabel="회원정보 설정 메뉴"
      sidebarLeading={isBelowPc ? undefined : backButton}
      contentHeading={isBelowPc ? mobilePageHeader : undefined}
      onLnbItemSelect={handleLnbItemSelect}
    >
      <div className={styles.body}>
        {isBelowPc ? null : pageTitleNode}
        {children}
      </div>
    </MypageLayout>
  )

  if (isRemoteSession && isLoading) {
    return wrap(
      <PFLoadingSpinner centered label="회원 정보를 불러오는 중" />
    )
  }

  if (isRemoteSession && isError) {
    return wrap(
      <PFText as="p" typo="bd-md-rg" color="error">
        회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </PFText>
    )
  }

  if (instructorSection && instructorProfileForView) {
    return wrap(
      <SettingsInstructorSectionEditForm
        section={instructorSection}
        fullValues={instructorProfileForView}
        onCancel={() => setMode('view')}
        onSaved={next => {
          setInstructorFormValues(next)
          if (!isRemoteSession) {
            setLocalProfile(prev => ({
              ...(prev ?? effectiveProfile),
              instructorProfile: {
                profile: mapInstructorFormValuesToCmsProfile(next),
              },
            }))
          }
          setMode('view')
        }}
      />,
    )
  }

  if (mode === 'edit-basic') {
    return wrap(
      <SettingsEditForm
        profile={effectiveProfile}
        variant={isTeacher ? 'teacher' : 'individual'}
        onCancel={() => setMode('view')}
        onSaved={next => {
          if (!isRemoteSession) {
            setLocalProfile(next)
          }
          setMode('view')
        }}
      />
    )
  }

  if (tab === 'social') {
    return wrap(<SettingsSocialAccountsView linkErrorReason={searchParams.get('socialError')} />)
  }

  if (tab === 'consents') {
    return wrap(<SettingsConsentsView />)
  }

  return wrap(
    <SettingsView
      basicRows={view.basicRows}
      guardian={view.guardian}
      onEditBasic={() => setMode('edit-basic')}
      instructorProfileValues={instructorProfileForView}
      onEditInstructorSection={
        isInstructor
          ? section => setMode(`edit-instructor-${section}` as SettingsInstructorEditMode)
          : undefined
      }
    />
  )
}
