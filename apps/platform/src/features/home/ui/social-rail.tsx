import snsFacebookUrl from '@/shared/assets/icons/sns-facebook.svg'
import snsInstagramUrl from '@/shared/assets/icons/sns-instagram.svg'
import snsLinkedinUrl from '@/shared/assets/icons/sns-linkedin.svg'
import snsMailUrl from '@/shared/assets/icons/sns-mail.svg'
import snsNaverBlogUrl from '@/shared/assets/icons/sns-naver-blog.svg'
import snsYoutubeUrl from '@/shared/assets/icons/sns-youtube.svg'
import styles from './social-rail.module.css'

/** 우측 고정 소셜 링크 — URL은 실제 채널 주소 수급 후 교체 */
const socialLinks = [
  { label: 'JA Korea 인스타그램', href: 'https://www.instagram.com/', iconUrl: snsInstagramUrl },
  { label: 'JA Korea 페이스북', href: 'https://www.facebook.com/', iconUrl: snsFacebookUrl },
  { label: 'JA Korea 링크드인', href: 'https://www.linkedin.com/', iconUrl: snsLinkedinUrl },
  { label: 'JA Korea 네이버 블로그', href: 'https://blog.naver.com/', iconUrl: snsNaverBlogUrl },
  { label: 'JA Korea 이메일', href: 'mailto:jakorea@jakorea.org', iconUrl: snsMailUrl },
  { label: 'JA Korea 유튜브', href: 'https://www.youtube.com/', iconUrl: snsYoutubeUrl },
] as const

export function SocialRail() {
  return (
    <nav className={styles.rail} aria-label="JA Korea 소셜 미디어">
      {socialLinks.map(({ label, href, iconUrl }) => (
        <a
          className={styles.link}
          href={href}
          target={href.startsWith('mailto:') ? undefined : '_blank'}
          rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
          aria-label={label}
          key={label}
        >
          <img className={styles.icon} src={iconUrl} alt="" aria-hidden="true" />
        </a>
      ))}
    </nav>
  )
}
