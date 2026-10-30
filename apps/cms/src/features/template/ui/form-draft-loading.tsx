import { Spin } from 'antd'
import './form-draft-loading.css'

/** 양식 draft API(또는 시드 fallback) 로드가 끝날 때까지 표시 — 가용 영역 중앙 */
export function FormDraftLoading({ ariaLabel = '불러오는 중' }: { ariaLabel?: string }) {
  return (
    <div
      className="form-draft-loading page-content-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <Spin size="large" />
    </div>
  )
}
