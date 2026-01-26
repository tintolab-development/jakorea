/**
 * 템플릿 관리 - 템플릿 목록 페이지
 * Phase: 관리자 페이지 카테고리 정리 및 뎁스 변경
 */

import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { Space, Tabs } from 'antd'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { getCategoryNameByPath } from '@/shared/config/menu-config'

export function TemplateListPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { params, setParams } = useQueryParams<{ tab?: string }>()
  const categoryName = getCategoryNameByPath(location.pathname, 1) || '템플릿 관리'

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
  const tabParam = params.tab
  const activeKey = tabParam || activeFromPath

  useEffect(() => {
    // query가 없거나 잘못된 값이면, 현재 path 기반 탭으로 정규화
    const validKeys = new Set(tabItems.map(t => t.key))
    const next = tabParam && validKeys.has(tabParam) ? tabParam : activeFromPath
    if (tabParam !== next) {
      setParams({
        tab: next,
      })
    }
  }, [activeFromPath, params.tab, setParams, tabItems, tabParam])

  const handleTabChange = (key: string) => {
    setParams({
      tab: key,
    })

    const target = tabItems.find(t => t.key === key)?.path || '/templates/files'
    if (location.pathname !== target) {
      navigate(target, { replace: true })
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
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
