/**
 * 콘텐츠 상단 GNB — CMS MainHeader 이식
 * (알림 API 연동 전: mock 알림 UI · 유저는 auth store)
 */

import { Layout, Space, Typography, Dropdown, message } from 'antd'
import { BellOutlined, BellFilled } from '@ant-design/icons'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import {
  NotificationDropdown,
  type HeaderNotification,
} from './notification-dropdown'
import './main-header.css'

const { Header: AntHeader } = Layout
const { Text } = Typography

const MOCK_NOTIFICATIONS: HeaderNotification[] = [
  {
    id: 'n1',
    type: 'schedule',
    message: '히어로 배너 게시 기간이 곧 만료됩니다.',
    createdAt: '2026-08-03T09:00:00+09:00',
    read: false,
  },
  {
    id: 'n2',
    type: 'matching',
    message: '메인 콘텐츠 게시 요청이 승인 대기 중입니다.',
    createdAt: '2026-08-02T11:20:00+09:00',
    read: false,
  },
  {
    id: 'n3',
    type: 'settlement',
    message: '후원 상담 신청 건이 등록되었습니다.',
    createdAt: '2026-08-01T16:00:00+09:00',
    read: true,
  },
  {
    id: 'n4',
    type: 'system',
    message: '홈페이지 어드민 셸이 배포되었습니다.',
    createdAt: '2026-08-01T14:30:00+09:00',
    read: true,
  },
]

export function MainHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  const categoryName = useMemo(
    () => getCategoryNameByPath(location.pathname),
    [location.pathname]
  )

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  )

  const roleLabel =
    user?.adminLevel === 'MASTER' || !user?.adminLevel ? '최고관리자' : '관리자'
  const displayName = user?.name?.trim() || user?.email || '관리자'

  const handleNotificationClick = (notification: HeaderNotification) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
    )
  }

  const handleAccountMenuAction = (action: 'profile' | 'notification' | 'logout') => {
    setAccountDropdownOpen(false)
    if (action === 'profile') {
      message.info('정보 수정은 이후 Phase에서 연동합니다.')
      return
    }
    if (action === 'notification') {
      message.info('알림 설정은 이후 Phase에서 연동합니다.')
      return
    }
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <AntHeader className="main-header">
      <div className="main-header-content">
        <div className="main-header-left">
          <div className="main-header-title-wrap">
            <h1 className="main-header-title">{categoryName}</h1>
          </div>
        </div>
        <div className="main-header-right">
          <Space size="middle" align="center">
            <Dropdown
              open={dropdownOpen}
              onOpenChange={setDropdownOpen}
              trigger={['click']}
              placement="bottomRight"
              overlayStyle={{ overflow: 'visible' }}
              popupRender={() => (
                <div className="main-header-notification-dropdown">
                  <NotificationDropdown
                    notifications={notifications}
                    onNotificationClick={handleNotificationClick}
                    onClose={() => setDropdownOpen(false)}
                  />
                </div>
              )}
            >
              <div className="main-header-notification-badge" role="button" tabIndex={0}>
                {unreadCount > 0 ? (
                  <BellFilled className="main-header-notification-icon" />
                ) : (
                  <BellOutlined className="main-header-notification-icon" />
                )}
                <Text className="main-header-notification-count">{unreadCount}건</Text>
              </div>
            </Dropdown>

            <div className="main-header-user-info">
              <Text className="main-header-user-role">{roleLabel}</Text>
              <div className="main-header-user-divider" />
              <Text className="main-header-user-name" strong>
                {displayName}
              </Text>
              <div className="main-header-avatar-button" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  className="main-header-avatar"
                  aria-hidden="true"
                  focusable="false"
                >
                  <g clipPath="url(#admin-main-header-avatar-clip)">
                    <rect width="32" height="32" rx="16" fill="var(--color-mint-02, #296075)" />
                    <circle opacity="0.7" cx="16" cy="13" r="6" fill="white" />
                    <circle opacity="0.7" cx="16" cy="32" r="12" fill="white" />
                  </g>
                  <defs>
                    <clipPath id="admin-main-header-avatar-clip">
                      <rect width="32" height="32" rx="16" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <Dropdown
                open={accountDropdownOpen}
                onOpenChange={setAccountDropdownOpen}
                trigger={['click']}
                placement="bottomRight"
                popupRender={() => (
                  <div className="main-header-account-dropdown">
                    <button
                      type="button"
                      className="main-header-account-dropdown-item"
                      onClick={() => handleAccountMenuAction('profile')}
                    >
                      정보 수정
                    </button>
                    <button
                      type="button"
                      className="main-header-account-dropdown-item"
                      onClick={() => handleAccountMenuAction('notification')}
                    >
                      알림 설정
                    </button>
                    <button
                      type="button"
                      className="main-header-account-dropdown-item"
                      onClick={() => handleAccountMenuAction('logout')}
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              >
                <button
                  type="button"
                  className="main-header-icon-button main-header-account-trigger"
                  aria-label="계정 메뉴 열기"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <mask
                      id="admin-main-header-account-gear-mask"
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width="28"
                      height="28"
                    >
                      <rect width="28" height="28" fill="#D9D9D9" />
                    </mask>
                    <g mask="url(#admin-main-header-account-gear-mask)">
                      <path
                        d="M12.7076 25.0833C12.3098 25.0833 11.9662 24.9513 11.6769 24.6872C11.3873 24.4233 11.2112 24.0984 11.1484 23.7125L10.8634 21.5293C10.5509 21.4247 10.2305 21.2782 9.90208 21.0898C9.57385 20.9012 9.28034 20.6992 9.02153 20.484L6.99999 21.3433C6.63347 21.5048 6.26519 21.5205 5.89516 21.3902C5.52494 21.2601 5.23735 21.0239 5.03241 20.6815L3.71758 18.4018C3.51263 18.0594 3.45362 17.697 3.54053 17.3148C3.62726 16.9327 3.82617 16.6175 4.13728 16.3692L5.88495 15.0567C5.85812 14.8832 5.83906 14.709 5.82778 14.534C5.81651 14.359 5.81087 14.1847 5.81087 14.011C5.81087 13.8452 5.81651 13.6766 5.82778 13.5053C5.83906 13.334 5.85812 13.1466 5.88495 12.9433L4.13728 11.6308C3.82617 11.3824 3.6291 11.0653 3.54608 10.6793C3.46305 10.2936 3.52401 9.92936 3.72895 9.58675L5.03241 7.34092C5.23735 7.00589 5.52494 6.77149 5.89516 6.63771C6.26519 6.50374 6.63347 6.51754 6.99999 6.67913L9.01016 7.52729C9.29152 7.30446 9.59184 7.10068 9.91112 6.91596C10.2304 6.73124 10.5441 6.58278 10.8523 6.47058L11.1484 4.28746C11.2112 3.90149 11.3873 3.57657 11.6769 3.31271C11.9662 3.04865 12.3098 2.91663 12.7076 2.91663H15.2924C15.6902 2.91663 16.0338 3.04865 16.3231 3.31271C16.6126 3.57657 16.7888 3.90149 16.8516 4.28746L17.1366 6.48167C17.4866 6.60883 17.8032 6.75729 18.0865 6.92704C18.37 7.09679 18.6562 7.29688 18.9449 7.52729L21.0114 6.67913C21.3777 6.51754 21.746 6.50374 22.1162 6.63771C22.4864 6.77149 22.7739 7.00589 22.9787 7.34092L24.2824 9.59813C24.4874 9.94054 24.5464 10.3029 24.4595 10.6852C24.3727 11.0673 24.1738 11.3824 23.8627 11.6308L22.0701 12.9768C22.1119 13.1652 22.1348 13.3414 22.1387 13.5053C22.1424 13.669 22.1442 13.8339 22.1442 14C22.1442 14.1584 22.1404 14.3196 22.1328 14.4835C22.1254 14.6473 22.0986 14.8346 22.0523 15.0456L23.8111 16.3692C24.1222 16.6175 24.323 16.9327 24.4137 17.3148C24.5041 17.697 24.4468 18.0594 24.2419 18.4018L22.9203 20.6701C22.7156 21.0127 22.4262 21.249 22.0523 21.3791C21.6784 21.5092 21.3082 21.4935 20.9417 21.3319L18.9449 20.4726C18.6562 20.703 18.3615 20.9068 18.0609 21.084C17.7603 21.2613 17.4522 21.4061 17.1366 21.5183L16.8516 23.7125C16.7888 24.0984 16.6126 24.4233 16.3231 24.6872C16.0338 24.9513 15.6902 25.0833 15.2924 25.0833H12.7076ZM12.8333 23.3333H15.1264L15.5458 20.2081C16.1412 20.0525 16.6853 19.8315 17.178 19.5451C17.6709 19.2585 18.1462 18.8901 18.6039 18.44L21.5025 19.6583L22.6514 17.675L20.1206 15.768C20.2178 15.4659 20.284 15.1696 20.319 14.8793C20.3541 14.5892 20.3717 14.2961 20.3717 14C20.3717 13.6962 20.3541 13.4031 20.319 13.1206C20.284 12.8379 20.2178 12.5491 20.1206 12.2543L22.6736 10.325L21.525 8.34163L18.5926 9.57771C18.2021 9.16043 17.7344 8.79177 17.1894 8.47171C16.6441 8.15165 16.0926 7.92503 15.5347 7.79183L15.1667 4.66663H12.8514L12.4652 7.78075C11.87 7.92133 11.3205 8.13668 10.8165 8.42679C10.3123 8.7171 9.8313 9.09101 9.37358 9.54854L6.47499 8.34163L5.32641 10.325L7.84583 12.2027C7.7486 12.4796 7.68055 12.7676 7.64166 13.0666C7.60277 13.3657 7.58333 13.6805 7.58333 14.011C7.58333 14.3148 7.60277 14.6125 7.64166 14.9041C7.68055 15.1958 7.74491 15.4838 7.83474 15.768L5.32641 17.675L6.47499 19.6583L9.36249 18.4333C9.80524 18.8879 10.2786 19.2604 10.7826 19.5507C11.2868 19.8408 11.844 20.0636 12.4542 20.2192L12.8333 23.3333ZM14.0134 17.5C14.9841 17.5 15.8101 17.1593 16.4914 16.478C17.1727 15.7966 17.5134 14.9706 17.5134 14C17.5134 13.0293 17.1727 12.2033 16.4914 11.522C15.8101 10.8406 14.9841 10.5 14.0134 10.5C13.0307 10.5 12.2017 10.8406 11.5264 11.522C10.8511 12.2033 10.5134 13.0293 10.5134 14C10.5134 14.9706 10.8511 15.7966 11.5264 16.478C12.2017 17.1593 13.0307 17.5 14.0134 17.5Z"
                        fill="#3D3D3D"
                      />
                    </g>
                  </svg>
                </button>
              </Dropdown>
            </div>
          </Space>
        </div>
      </div>
    </AntHeader>
  )
}
