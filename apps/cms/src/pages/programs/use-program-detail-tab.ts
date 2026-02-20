/**
 * 프로그램 상세 페이지 탭 쿼리 파라미터 동기화 훅
 * - URL ?tab= 파라미터 기반 activeKey 관리
 * - 유효하지 않은 탭 키 → default 탭 폴백
 */

import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

const TAB_KEYS = ['info', 'progress', 'applicants', 'managers'] as const
export type ProgramDetailTabKey = (typeof TAB_KEYS)[number]

export const TAB_LABELS: Record<ProgramDetailTabKey, string> = {
  info: '프로그램 상세 정보',
  progress: '프로그램 진행 현황',
  applicants: '신청자 목록',
  managers: '담당자 정보',
}

const DEFAULT_TAB: ProgramDetailTabKey = 'info'

function isValidTabKey(value: string): value is ProgramDetailTabKey {
  return (TAB_KEYS as readonly string[]).includes(value)
}

export function useProgramDetailTab() {
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get('tab')
  const activeTabKey = useMemo((): ProgramDetailTabKey => {
    if (tabParam && isValidTabKey(tabParam)) return tabParam
    return DEFAULT_TAB
  }, [tabParam])

  const setTab = (key: ProgramDetailTabKey) => {
    const next = new URLSearchParams(searchParams)
    if (key === DEFAULT_TAB) {
      next.delete('tab')
    } else {
      next.set('tab', key)
    }
    setSearchParams(next, { replace: true })
  }

  const onTabChange = (key: string) => {
    setTab(isValidTabKey(key) ? key : DEFAULT_TAB)
  }

  return { activeTabKey, setTab, onTabChange, TAB_KEYS }
}
