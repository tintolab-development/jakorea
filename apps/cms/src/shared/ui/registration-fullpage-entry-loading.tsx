import { Spin } from 'antd'
import './registration-fullpage-entry-loading.css'

type RegistrationFullpageEntryLoadingProps = {
  /** Suspense 청크 로드 — 뷰포트 전체 딤 */
  variant?: 'viewport' | 'modal-body'
}

/** 프로그램 신규 등록: 청크 로드·양식 draft fetch 공통 로딩 UI */
export function RegistrationFullpageEntryLoading({
  variant = 'modal-body',
}: RegistrationFullpageEntryLoadingProps) {
  return (
    <div
      className={[
        'registration-fullpage-entry-loading',
        variant === 'viewport' ? 'registration-fullpage-entry-loading--viewport' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="프로그램 등록 화면 불러오는 중"
    >
      <Spin size="large" />
    </div>
  )
}
