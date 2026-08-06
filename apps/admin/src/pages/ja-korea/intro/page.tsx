/**
 * JA Korea 소개 관리
 */

import { useJaKoreaIntro } from '@/features/ja-korea-intro/api/hooks'
import { jaKoreaIntroQueryKeys } from '@/features/ja-korea-intro/api/query-keys'
import { JA_KOREA_INTRO_CHANGED_EVENT } from '@/features/ja-korea-intro/api/store'
import { IntroFormCard } from '@/features/ja-korea-intro/ui/intro-form'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'

import './page.css'

export function IntroPage() {
  const introQuery = useJaKoreaIntro()

  useInvalidateOnWindowEvent(JA_KOREA_INTRO_CHANGED_EVENT, jaKoreaIntroQueryKeys.all)

  const data = introQuery.data

  if (introQuery.isLoading || !data) {
    return (
      <div className="ja-korea-intro-page">
        <div className="admin-list-card">콘텐츠를 불러오는 중…</div>
      </div>
    )
  }

  return (
    <div className="ja-korea-intro-page">
      <IntroFormCard data={data} />
    </div>
  )
}
