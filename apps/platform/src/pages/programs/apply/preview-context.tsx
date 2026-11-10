/**
 * CMS 신청 정보 미리보기 — Platform 신청 화면을 API 없이 띄운다.
 * Provider가 있으면 신청 페이지는 주입된 프로그램·양식을 쓰고,
 * 로그인·신청 조건 확인·제출·화면 이동을 하지 않는다. Provider 밖(실제 서비스)은 기존 동작 그대로.
 */

import { createContext, useContext, type ReactNode } from 'react'
import type { ProgramApplicationFormQuery, ProgramDetail } from '@/features/program'

export type ProgramApplyPreview = {
  /** 신청 페이지 내부 키용 — 실제 programId가 없을 수 있다(등록 전). */
  programId: string
  program: ProgramDetail
  formQuery: ProgramApplicationFormQuery
}

const ProgramApplyPreviewContext = createContext<ProgramApplyPreview | null>(null)

export function ProgramApplyPreviewProvider({
  value,
  children,
}: {
  value: ProgramApplyPreview
  children: ReactNode
}) {
  return (
    <ProgramApplyPreviewContext.Provider value={value}>{children}</ProgramApplyPreviewContext.Provider>
  )
}

/** 미리보기가 아니면 null */
export function useProgramApplyPreview(): ProgramApplyPreview | null {
  return useContext(ProgramApplyPreviewContext)
}
