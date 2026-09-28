import ctaPhotoUrl from '../image/illustration/cta-photo.png'
import era1920Url from '../image/illustration/era-1920.png'
import era1950Url from '../image/illustration/era-1950.png'
import era1960Url from '../image/illustration/era-1960.png'
import era1980Url from '../image/illustration/era-1980.png'
import expansionPhotoUrl from '../image/illustration/expansion-photo.png'
import koreaPhotoUrl from '../image/illustration/korea-photo.png'
import learningPhotoUrl from '../image/illustration/learning-photo.png'
import philosophyMindsetUrl from '../image/illustration/philosophy-mindset.png'
import philosophyPracticeUrl from '../image/illustration/philosophy-practice.png'
import philosophyRoleModelUrl from '../image/illustration/philosophy-role-model.png'
import philosophySupportUrl from '../image/illustration/philosophy-support.png'
import thriveDigitalUrl from '../image/illustration/thrive-digital.svg'
import thriveEmpowerUrl from '../image/illustration/thrive-empower.svg'
import thriveEnablersUrl from '../image/illustration/thrive-enablers.svg'
import thrivePartnerUrl from '../image/illustration/thrive-partner.svg'
import year1919Url from '../image/illustration/year-1919.svg'
import heroVisualUrl from '../image/hero-visual.png'

/** 시드 fileName → 번들 이미지. url이 null이어도 같은 파일명으로 블록을 유지한다. */
export const HISTORY_LOCAL_MEDIA: Record<string, string> = {
  'hero-visual.png': heroVisualUrl,
  'year-1919.svg': year1919Url,
  'learning-photo.png': learningPhotoUrl,
  'era-1920.png': era1920Url,
  'era-1950.png': era1950Url,
  'era-1960.png': era1960Url,
  'era-1980.png': era1980Url,
  'expansion-photo.png': expansionPhotoUrl,
  'korea-photo.png': koreaPhotoUrl,
  'philosophy-practice.png': philosophyPracticeUrl,
  'philosophy-role-model.png': philosophyRoleModelUrl,
  'philosophy-mindset.png': philosophyMindsetUrl,
  'philosophy-support.png': philosophySupportUrl,
  'thrive-empower.svg': thriveEmpowerUrl,
  'thrive-digital.svg': thriveDigitalUrl,
  'thrive-partner.svg': thrivePartnerUrl,
  'thrive-enablers.svg': thriveEnablersUrl,
  'cta-photo.png': ctaPhotoUrl,
}
