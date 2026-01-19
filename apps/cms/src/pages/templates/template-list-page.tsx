/**
 * 템플릿 관리 - 템플릿 목록 페이지
 * Phase: 관리자 페이지 카테고리 정리 및 뎁스 변경
 */

import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams, Outlet } from 'react-router-dom'
import { Space, Tabs } from 'antd'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'

export function TemplateListPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabItems = useMemo(
    () => [
      { key: 'files', label: '파일 양식', path: '/templates/files' },
      { key: 'sms', label: '문자 양식', path: '/templates/sms' },
      { key: 'email', label: '메일 양식', path: '/templates/email' },
    ],
    []
  )

  // path 기반 활성 탭 계산
  const activeFromPath = useMemo(() => {
    const p = location.pathname
    if (p.includes('/templates/sms')) return 'sms'
    if (p.includes('/templates/email')) return 'email'
    return 'files'
  }, [location.pathname])

  // query 기반 활성 탭 (우선순위: query -> path)
  const tabParam = searchParams.get('tab')
  const activeKey = tabParam || activeFromPath

  useEffect(() => {
    // query가 없거나 잘못된 값이면, 현재 path 기반 탭으로 정규화
    const validKeys = new Set(tabItems.map(t => t.key))
    const next = tabParam && validKeys.has(tabParam) ? tabParam : activeFromPath
    if (tabParam !== next) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('tab', next)
      setSearchParams(nextParams, { replace: true })
    }
  }, [activeFromPath, searchParams, setSearchParams, tabItems, tabParam])

  const handleTabChange = (key: string) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', key)
    setSearchParams(nextParams, { replace: true })

    const target = tabItems.find(t => t.key === key)?.path || '/templates/files'
    if (location.pathname !== target) {
      navigate(target, { replace: true })
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={PAGE_HEADER_STYLE}>템플릿 관리</h1>
      </Space>
      <Tabs
        activeKey={activeKey}
        onChange={handleTabChange}
        items={tabItems.map(t => ({ key: t.key, label: t.label }))}
        style={{ marginBottom: 12 }}
      />
      <Outlet />
    </div>
  )
}
