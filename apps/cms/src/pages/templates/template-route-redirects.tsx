/**
 * 템플릿 관리 구 URL → 신규 경로 리다이렉트 (쿼리 보존)
 */

import { Navigate, useLocation } from 'react-router-dom'

export function RedirectLegacyTemplatesProgramForms() {
  const { search } = useLocation()
  return <Navigate to={`/templates/form-management${search}`} replace />
}

export function RedirectLegacyTemplatesSms() {
  return <Navigate to="/templates/kakao-notification" replace />
}

export function RedirectLegacyTemplatesEmail() {
  return <Navigate to="/templates/email-management" replace />
}

export function RedirectLegacyTemplatesKakaoAlimtalk() {
  return <Navigate to="/templates/kakao-notification" replace />
}
