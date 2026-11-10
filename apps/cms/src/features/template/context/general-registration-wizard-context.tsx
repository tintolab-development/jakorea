import { createContext, useContext } from 'react'

/**
 * true면 일반 프로그램 등록 위저드(`registrationFormVariant === 'general'`) 안에서 렌더 중이다.
 * 모집·신청 폼·공통 정보 단락 중 1사1교·UJAT·Gemini·교육받은 교사·템플릿 관리와 공유되는 컴포넌트가
 * 일반 등록 시안 문구·형식만 쓰도록 분기할 때 쓴다. 기본 false — 다른 유형·화면은 기존 동작 유지.
 */
export const GeneralRegistrationWizardContext = createContext(false)

export function useIsGeneralRegistrationWizard(): boolean {
  return useContext(GeneralRegistrationWizardContext)
}
