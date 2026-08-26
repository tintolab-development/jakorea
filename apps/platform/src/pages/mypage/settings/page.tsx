import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import {
  getSettingsLnbItems,
  isInstructorMypageProfile,
  mapPortalProfileToSettingsView,
  MYPAGE_PATH,
  MYPAGE_SETTINGS_PATH,
  SettingsConsentsView,
  SettingsEditForm,
  SettingsView,
  useMypageMember,
  useSettingsView,
  type MypageLnbItemKey,
  type SettingsProfileInput,
} from '@/features/mypage'
import { ProgramBackButton } from '@/features/program'
import {
  getAccessToken,
  getDevAuthLoggedIn,
  isRemoteApiConfigured,
  resolveLoginRequiredPath,
} from '@/shared/lib'
import { PFText } from '@/shared/ui'
import { MypageLayout } from '@/widgets/mypage-layout'
import styles from './page.module.css'

type SettingsTab = 'profile' | 'consents'
type SettingsMode = 'view' | 'edit-basic'

function resolvePageTitle(tab: SettingsTab, mode: SettingsMode) {
  if (mode === 'edit-basic') return '회원정보 수정'
  if (tab === 'consents') return '약관 및 정책 동의 관리'
  return '회원정보 설정'
}

export function MypageSettingsPage() {
  const navigate = useNavigate()
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [tab, setTab] = useState<SettingsTab>('profile')
  const [mode, setMode] = useState<SettingsMode>('view')
  const [localProfile, setLocalProfile] = useState<SettingsProfileInput | null>(null)
  const { isChecking, isRedirecting } = useAdminRegisteredNoticeRedirect()
  const { isRemoteSession, isLoading, isError, profile, guardian } = useSettingsView()
  const member = useMypageMember()
  const effectiveProfile = localProfile ?? profile
  const view = mapPortalProfileToSettingsView(effectiveProfile, guardian)
  const lnbActiveKey = mode === 'edit-basic' || tab === 'profile' ? 'settingsProfile' : 'settingsConsents'
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

  const handleLnbItemSelect = (key: MypageLnbItemKey) => {
    if (key === 'settingsConsents') {
      if (mode === 'edit-basic') return
      setTab('consents')
      return
    }

    if (key === 'settingsProfile') {
      setTab('profile')
    }
  }

  const wrap = (children: ReactNode) => (
    <MypageLayout
      variant="subpage"
      lnbItems={lnbItems}
      lnbAriaLabel="회원정보 설정 메뉴"
      onLnbItemSelect={handleLnbItemSelect}
    >
      <div className={styles.body}>
        <div className={styles.backLink}>
          <ProgramBackButton
            size="small"
            label="마이페이지로"
            onClick={() => navigate(MYPAGE_PATH)}
          />
        </div>
        <PFText as="h1" typo="hd-lg" color="black" className={styles.pageTitle}>
          {pageTitle}
        </PFText>
        {children}
      </div>
    </MypageLayout>
  )

  if (isRemoteSession && isLoading) {
    return wrap(
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
        회원 정보를 불러오는 중이에요…
      </PFText>,
    )
  }

  if (isRemoteSession && isError) {
    return wrap(
      <PFText as="p" typo="bd-md-rg" color="error">
        회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </PFText>,
    )
  }

  if (mode === 'edit-basic') {
    return wrap(
      <SettingsEditForm
        profile={effectiveProfile}
        onCancel={() => setMode('view')}
        onSaved={next => {
          if (!isRemoteSession) {
            setLocalProfile(next)
          }
          setMode('view')
        }}
      />,
    )
  }

  if (tab === 'consents') {
    return wrap(
      <SettingsConsentsView showInstructorDocuments={isInstructorMypageProfile(member.profile)} />,
    )
  }

  return wrap(
    <SettingsView
      basicRows={view.basicRows}
      guardian={view.guardian}
      onEditBasic={() => setMode('edit-basic')}
    />,
  )
}
