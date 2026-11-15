import { Spin } from 'antd'
import './blocking-overlay.css'

/**
 * 조회 중 표시 — 「로딩 중…」「불러오는 중입니다」 같은 문구 대신 쓰는 전체 화면 스피너.
 * 저장 중 `BlockingOverlay`와 같은 모양(모달 위 z-index 4000, primary 색 점)이다.
 * 렌더되는 동안만 보이므로 `{loading ? <FullscreenSpinner /> : null}`처럼 조건부로 둔다.
 */
export function FullscreenSpinner() {
  return <Spin spinning fullscreen size="large" rootClassName="blocking-overlay" />
}
