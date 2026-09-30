/**
 * 프로그램 목록 청크와 상세·등록 모달을 분리한다.
 * 목록 전환은 모달 모듈 평가를 기다리지 않고, 모달이 열릴 때만 해당 청크를 로드한다.
 */
import { lazy, Suspense, type ReactNode } from 'react'
import { Spin } from 'antd'

function ProgramModalChunkFallback() {
  return (
    <div
      className="router-loading-fallback"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.65)',
      }}
    >
      <Spin size="large" />
    </div>
  )
}

export function ProgramModalWhenOpen({
  open,
  children,
}: {
  open: boolean
  children: ReactNode
}) {
  if (!open) return null
  return <Suspense fallback={<ProgramModalChunkFallback />}>{children}</Suspense>
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
  import('@/features/program/general/ui/registration/registration-fullpage-modal').then(module => ({
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
  import('@/features/program/ujat/ui/registration/ujat-program-registration-fullpage-modal').then(
    module => ({
      default: module.UjatProgramRegistrationFullpageModal,
    })
  )
)
