import { createContext, useContext, useMemo, type ReactNode } from 'react'

export type TemplateDetailViewModeValue = {
  /** true면 상세 조회 모드 — `TemplateFullpageModal`이 본문을 잠그고 저장·삭제 대신 「수정」을 보여 준다 */
  readOnly: boolean
  /** 「수정」 클릭 — URL mode를 `edit`로 바꾼다 */
  onRequestEdit?: () => void
  /** true면 템플릿 관리(작성·발급 양식 탭) 화면 — Provider 안에서만 true */
  templateManagement?: boolean
}

const DEFAULT_VALUE: TemplateDetailViewModeValue = { readOnly: false }

const TemplateDetailViewModeContext = createContext<TemplateDetailViewModeValue>(DEFAULT_VALUE)

/**
 * 양식 관리 탭(작성·발급)이 상세 모달 영역을 감싼다.
 * 프로그램 등록 등 다른 화면의 `TemplateFullpageModal`은 Provider 밖이라 기존 동작(편집) 그대로다.
 */
export function TemplateDetailViewModeProvider({
  readOnly,
  onRequestEdit,
  children,
}: Omit<TemplateDetailViewModeValue, 'templateManagement'> & { children: ReactNode }) {
  const value = useMemo(
    () => ({ readOnly, onRequestEdit, templateManagement: true }),
    [readOnly, onRequestEdit]
  )
  return (
    <TemplateDetailViewModeContext.Provider value={value}>
      {children}
    </TemplateDetailViewModeContext.Provider>
  )
}

export function useTemplateDetailViewMode(): TemplateDetailViewModeValue {
  return useContext(TemplateDetailViewModeContext)
}

/** 템플릿 관리(작성·발급 양식 탭) 안에서 렌더 중인지 — 프로그램 등록 등 다른 화면은 false */
export function useIsTemplateManagementScreen(): boolean {
  return useContext(TemplateDetailViewModeContext).templateManagement === true
}
