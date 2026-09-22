import { CmsButton } from '@/shared/ui/cms-button'

type RegistrationDevAutofillButtonProps = {
  onClick: () => void | Promise<void>
}

/** 프로그램 등록 풀페이지 — 닫기 왼쪽. Vite DEV에서만 렌더. */
export function RegistrationDevAutofillButton({ onClick }: RegistrationDevAutofillButtonProps) {
  if (!import.meta.env.DEV) return null
  return (
    <CmsButton variant="secondary" type="button" onClick={onClick}>
      자동입력(개발용)
    </CmsButton>
  )
}
