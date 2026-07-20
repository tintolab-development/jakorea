import { Spin } from 'antd'
import './form-draft-loading.css'

/** 양식 draft API(또는 시드 fallback) 로드가 끝날 때까지 표시 — 가용 영역 중앙 */
export function FormDraftLoading() {
  return (
    <div
      className="form-draft-loading page-content-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spin size="large" />
    </div>
  )
}
