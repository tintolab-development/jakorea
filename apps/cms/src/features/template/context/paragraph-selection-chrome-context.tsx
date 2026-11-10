import { createContext, useContext } from 'react'

/**
 * true면 단락 카드 선택 강조·하단 토글/액션·드래그 핸들·표 행 선택 강조를 숨긴다.
 * 선택 상태 자체는 유지되어 본문 입력·제목 편집 등 동작은 그대로다. (프로그램 등록 위저드 공통·모집)
 */
export const HideParagraphSelectionChromeContext = createContext(false)

export function useHideParagraphSelectionChrome(): boolean {
  return useContext(HideParagraphSelectionChromeContext)
}

/**
 * true면 `HideParagraphSelectionChromeContext`로 선택 chrome을 숨겨도 선택된 단락 카드의
 * 청록 테두리(`paragraph-card--active`)만은 보여 준다. (일반 프로그램 등록 위저드 공통·모집 — 시안)
 * 기본 false — 다른 위저드·미리보기는 기존 동작 유지.
 */
export const ShowParagraphActiveOutlineContext = createContext(false)

export function useShowParagraphActiveOutline(): boolean {
  return useContext(ShowParagraphActiveOutlineContext)
}
