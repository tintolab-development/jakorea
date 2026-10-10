/** JA Korea 가로 로고 (Member of JA Worldwide) — Platform `ja-logo.svg` 동일 */

import jaLogoUrl from '@/shared/assets/brand/ja-logo.svg'

type JaKoreaMemberLogoProps = {
  className?: string
}

export function JaKoreaMemberLogo({ className }: JaKoreaMemberLogoProps) {
  return (
    <img
      className={className}
      src={jaLogoUrl}
      alt="JA Korea"
      width={195}
      height={60}
      decoding="async"
    />
  )
}
