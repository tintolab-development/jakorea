/**
 * 프로그램 목록 청크와 상세·등록 모달을 분리한다.
 * 목록 전환은 모달 모듈 평가를 기다리지 않고, 모달이 열릴 때만 해당 청크를 로드한다.
 */
import { lazy, Suspense, type ReactNode } from 'react'
import { RegistrationFullpageEntryLoading } from '@/shared/ui/registration-fullpage-entry-loading'

function ProgramModalChunkFallback() {
  return <RegistrationFullpageEntryLoading variant="viewport" />
}

function ProgramRegistrationModalChunkFallback() {
  return <RegistrationFullpageEntryLoading variant="viewport" />
}

export function ProgramModalWhenOpen({
  open,
  children,
  registrationEntry = false,
}: {
  open: boolean
  children: ReactNode
  /** 신규 등록 풀페이지 — 청크 로드 UI를 등록 모달과 동일하게 */
  registrationEntry?: boolean
}) {
  if (!open) return null
  const fallback = registrationEntry ? (
    <ProgramRegistrationModalChunkFallback />
  ) : (
    <ProgramModalChunkFallback />
  )
  return <Suspense fallback={fallback}>{children}</Suspense>
}

const generalRegistrationModalImport = () =>
  import('@/features/program/general/ui/registration/registration-fullpage-modal')

const ujatRegistrationModalImport = () =>
  import('@/features/program/ujat/ui/registration/ujat-program-registration-fullpage-modal')

/** 신규 등록 클릭 직전·직후 청크 선로드 — URL 반영과 병렬 */
export function preloadGeneralProgramRegistrationModal(): void {
  void generalRegistrationModalImport()
}

export function preloadUjatProgramRegistrationModal(): void {
  void ujatRegistrationModalImport()
}

export const LazyGeneralProgramDetailFullPageModal = lazy(() =>
  import('@/features/program/general/ui/detail-modal/detail-fullpage-modal').then(module => ({
    default: module.GeneralProgramDetailFullPageModal,
  }))
)

export const LazyProgramDetailFullPageModal = lazy(() =>
  import('@/features/program/general/ui/detail-modal/program-detail-fullpage-modal').then(module => ({
    default: module.ProgramDetailFullPageModal,
  }))
)

export const LazyGeneralProgramRegistrationFullpageModal = lazy(() =>
  generalRegistrationModalImport().then(module => ({
    default: module.GeneralProgramRegistrationFullpageModal,
  }))
)

export const LazyUjatProgramDetailFullPageModal = lazy(() =>
  import('@/features/program/ujat/ui/detail-modal/ujat-program-detail-fullpage-modal').then(
    module => ({
      default: module.UjatProgramDetailFullPageModal,
    })
  )
)

export const LazyUjatProgramRegistrationFullpageModal = lazy(() =>
  ujatRegistrationModalImport().then(module => ({
    default: module.UjatProgramRegistrationFullpageModal,
  }))
)
