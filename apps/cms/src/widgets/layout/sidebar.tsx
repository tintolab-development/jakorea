/**
 * 사이드바 컴포넌트 (LNB - Left Navigation Bar)
 * Phase 1.1: Ant Design Menu를 활용한 네비게이션
 * Phase 4.2.1: 권한별 메뉴 구성 적용
 * Phase 0.1.5: 역할별 메뉴 필터링 강화 (hidden 처리, 권한별 필터링)
 * 타이틀을 사이드바 최상단에 배치
 *
 * 참고사항:
 * - 각 권한(INSTRUCTOR/INDIVIDUAL/SCHOOL)별로 완전히 분리된 메뉴 구조
 * - 공통 메뉴 없이 권한별로 독립적으로 관리됨
 */

import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getMenuItemsByRole } from '@/shared/config/menu-config'
import './sidebar.css'
import { Header } from './header'

const { Sider } = Layout

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  // 권한별 메뉴 필터링 (사용자 정보 포함하여 인증 상태 확인)
  const menuItems = useMemo(() => {
    return getMenuItemsByRole(user?.role || null, user)
  }, [user?.role, user])

  // 현재 경로에 따라 열린 서브메뉴 결정
  const openKeys = useMemo(() => {
    const path = location.pathname
    const keys: string[] = []

    // 관리자용 프로그램 관리 (1뎁스 프로그램 관리 > 2뎁스 교육/봉사 > 3뎁스 목록·일정·수강/강의 신청 현황)
    const isProgramMgmt =
      user?.role === 'ADMIN' &&
      ((path.startsWith('/programs') &&
        !path.startsWith('/programs/my') &&
        !path.startsWith('/programs/favorites')) ||
        path === '/applications' ||
        path === '/instructor-applications')
    if (isProgramMgmt) {
      keys.push('programs-group')
      if (
        path.startsWith('/programs/education') ||
        path === '/applications' ||
        path === '/instructor-applications'
      ) {
        keys.push('education-programs-group')
      }
    }

    // 관리자용 정산 관리
    if (path.startsWith('/settlements') && !path.startsWith('/settlements/my')) {
      keys.push('settlements-group')
    }

    // 사용자(INSTRUCTOR, INDIVIDUAL, SCHOOL) 공통 메뉴
    // 내 학습 관리
    if (
      path.startsWith('/instructor/schedule') ||
      path.startsWith('/schedules/my') ||
      path.startsWith('/school/my-learning')
    ) {
      keys.push('my-learning-group')
    }

    // 교육 프로그램
    if (
      path.startsWith('/programs') &&
      !path.startsWith('/programs/my') &&
      !path.startsWith('/programs/favorites') &&
      !path.startsWith('/programs/volunteer') &&
      !path.startsWith('/programs/education')
    ) {
      keys.push('education-programs-group')
    }

    // 봉사 프로그램
    if (path.startsWith('/programs/volunteer')) {
      keys.push('volunteer-programs-group')
    }

    // 마이페이지 (공통 2뎁스 구조)
    if (
      path.startsWith('/mypage') ||
      path.startsWith('/settlements/my') ||
      path.startsWith('/notices/inquiries/my')
    ) {
      keys.push('mypage-group')
      // 개인정보 관리 하위 메뉴인 경우 확장
      if (
        path.startsWith('/mypage/profile') ||
        path.startsWith('/mypage/school-auth') ||
        path.startsWith('/mypage/school-info') ||
        path.startsWith('/mypage/instructor-auth') ||
        path.startsWith('/mypage/instructor-info')
      ) {
        keys.push('personal-info-group')
      }
    }

    // 관리자용 템플릿 관리 (1뎁스 템플릿 관리 > 2뎁스 프로그램 양식/파일 양식 > 3뎁스 각 카테고리)
    if (user?.role === 'ADMIN' && path.startsWith('/templates')) {
      keys.push('templates-group')
      // 프로그램 양식 하위 메뉴
      if (path.startsWith('/templates/program-forms')) {
        keys.push('program-forms-group')
      }
      // 파일 양식 하위 메뉴
      if (path.startsWith('/templates/file-forms')) {
        keys.push('file-forms-group')
      }
    }

    // 관리자용 회원 관리
    if (
      user?.role === 'ADMIN' &&
      (path.startsWith('/users') || path.startsWith('/schools') || path.startsWith('/instructors'))
    ) {
      keys.push('members-group')
    }

    // 관리자용 게시글 관리
    if (user?.role === 'ADMIN' && (path.startsWith('/admin/posts') || path.startsWith('/posts'))) {
      keys.push('posts-group')
    }

    // 관리자용 로그 관리
    if (user?.role === 'ADMIN' && path.startsWith('/logs')) {
      keys.push('logs-group')
    }

    return keys
  }, [location.pathname, user?.role])

  const [controlledOpenKeys, setControlledOpenKeys] = useState<string[]>(openKeys)

  // 경로가 변경될 때 openKeys를 controlledOpenKeys에 동기화
  useEffect(() => {
    setControlledOpenKeys(openKeys)
  }, [openKeys])

  // 선택된 메뉴 키 결정 (역할별 내 학습 관리 페이지일 때 /my-learning 활성화)
  const selectedKeys = useMemo(() => {
    const path = location.pathname

    // 역할별 내 학습 관리 페이지일 때 /my-learning 활성화
    if (
      (user?.role === 'INSTRUCTOR' && path.startsWith('/instructor/schedule')) ||
      (user?.role === 'INDIVIDUAL' && path.startsWith('/schedules/my')) ||
      (user?.role === 'SCHOOL' && path.startsWith('/school/my-learning'))
    ) {
      return ['/my-learning']
    }

    // 관리자: 프로그램 상세(/programs/:id) 또는 수정(/programs/:id/edit) 접근 시에도 '프로그램 목록' 카테고리 활성화
    const programsReserved = ['my', 'favorites', 'volunteer', 'education', 'new', 'satisfaction']
    if (user?.role === 'ADMIN' && path.startsWith('/programs/')) {
      const rest = path.slice('/programs/'.length)
      const segments = rest.split('/').filter(Boolean)
      const firstSegment = segments[0]
      if (firstSegment && !programsReserved.includes(firstSegment)) {
        return ['/programs/education']
      }
    }

    return [path]
  }, [location.pathname, user?.role])

  return (
    <Sider width={220} className="sidebar-container">
      <Header />
      <div className="sidebar-menu-wrapper">
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={controlledOpenKeys.length > 0 ? controlledOpenKeys : openKeys}
          onOpenChange={setControlledOpenKeys}
          className="sidebar-menu"
          items={menuItems}
          onClick={({ key }) => {
            if (typeof key === 'string' && key.startsWith('/')) navigate(key)
          }}
        />
      </div>
    </Sider>
  )
}
