import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DIRECTIONS_PATH } from '@/features/directions'
import jaLogoGrayUrl from '@/shared/assets/brand/ja-logo-gray.svg'
import chevronDownGrayUrl from '@/shared/assets/icons/chevron-down-gray.svg'
import facebookIconUrl from './image/icon/facebook.svg'
import instagramIconUrl from './image/icon/instagram.svg'
import youtubeIconUrl from './image/icon/youtube.svg'
import ministryLogoUrl from './image/logo/footer-logo-1.svg'
import taxLogoUrl from './image/logo/footer-logo-2.svg'
import rightsLogoUrl from './image/logo/footer-logo-3.svg'
import styles from './footer.module.css'

const footerNavItems = [
  { label: '이용약관' },
  { label: '개인정보처리방침' },
  { label: '오시는길', href: DIRECTIONS_PATH },
  { label: '국세청 공시 및 공개 내역' },
  { label: '국세청 탈세 제보' },
  { label: '후원하기' },
  { label: '기부금영수증' },
  { label: '온라인 학습관리' },
] as const

const relatedSites = [
  { label: 'JA Worldwide', href: 'https://www.jaworldwide.org/' },
  { label: 'JA Africa', href: 'https://ja-africa.org/' },
  { label: 'JA Americas', href: 'https://www.jaamericas.org/' },
  { label: 'JA Asia Pacific', href: 'https://www.jaasiapacific.org/' },
  { label: 'JA Europe', href: 'https://www.jaeurope.org/' },
  { label: 'INJAZ Al-Arab', href: 'https://injazalarab.org/' },
  { label: 'Junior Achievement USA', href: 'https://jausa.ja.org/' },
] as const

const RELATED_SITES_SCROLL_THUMB_HEIGHT = 24
const RELATED_SITES_SCROLLBAR_INSET = 8

const companyAddress =
  '사단법인 제이에이코리아 서울특별시 강서구 마곡중앙로 171 마곡나루역 프라이빗타워2차 714호'

const socialLinks = [
  { label: 'JA Korea 유튜브', iconUrl: youtubeIconUrl },
  { label: 'JA Korea 인스타그램', iconUrl: instagramIconUrl },
  { label: 'JA Korea 페이스북', iconUrl: facebookIconUrl },
] as const

const partnerLogos = [
  { label: '기획재정부', logoUrl: ministryLogoUrl, logoClassName: styles.partnerLogoMinistry },
  { label: '국세청', logoUrl: taxLogoUrl, logoClassName: styles.partnerLogoTax },
  { label: '국민권익위원회', logoUrl: rightsLogoUrl, logoClassName: styles.partnerLogoRights },
] as const

const copyrightYear = new Date().getFullYear()

export function Footer() {
  const relatedSitesListId = useId()
  const relatedSitesRef = useRef<HTMLDivElement>(null)
  const relatedSitesTriggerRef = useRef<HTMLButtonElement>(null)
  const relatedSitesListRef = useRef<HTMLUListElement>(null)
  const [isRelatedSitesOpen, setIsRelatedSitesOpen] = useState(false)
  const [scrollThumbTop, setScrollThumbTop] = useState(0)
  const [showScrollThumb, setShowScrollThumb] = useState(false)

  const updateRelatedSitesScrollThumb = () => {
    const list = relatedSitesListRef.current
    if (!list) return

    const { scrollTop, scrollHeight, clientHeight } = list
    const overflow = scrollHeight - clientHeight
    if (overflow <= 0) {
      setShowScrollThumb(false)
      setScrollThumbTop(0)
      return
    }

    const trackHeight = clientHeight - RELATED_SITES_SCROLLBAR_INSET * 2
    const trackTravel = Math.max(0, trackHeight - RELATED_SITES_SCROLL_THUMB_HEIGHT)
    setShowScrollThumb(true)
    setScrollThumbTop((scrollTop / overflow) * trackTravel)
  }

  useEffect(() => {
    if (!isRelatedSitesOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const root = relatedSitesRef.current
      if (!root) return
      if (event.target instanceof Node && !root.contains(event.target)) {
        setIsRelatedSitesOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsRelatedSitesOpen(false)
        relatedSitesTriggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isRelatedSitesOpen])

  useEffect(() => {
    if (!isRelatedSitesOpen) {
      setShowScrollThumb(false)
      setScrollThumbTop(0)
      return
    }

    const frame = requestAnimationFrame(updateRelatedSitesScrollThumb)
    const list = relatedSitesListRef.current
    if (!list) return () => cancelAnimationFrame(frame)

    list.addEventListener('scroll', updateRelatedSitesScrollThumb)
    window.addEventListener('resize', updateRelatedSitesScrollThumb)
    return () => {
      cancelAnimationFrame(frame)
      list.removeEventListener('scroll', updateRelatedSitesScrollThumb)
      window.removeEventListener('resize', updateRelatedSitesScrollThumb)
    }
  }, [isRelatedSitesOpen])

  return (
    <footer className={styles.footer}>
      <div className={styles.navigationArea}>
        <div className={styles.shell}>
          <nav className={styles.navigation} aria-label="하단 메뉴">
            {footerNavItems.map(item =>
              'href' in item && item.href ? (
                <Link className={styles.navigationButton} to={item.href} key={item.label}>
                  {item.label}
                </Link>
              ) : (
                <button className={styles.navigationButton} type="button" key={item.label}>
                  {item.label}
                </button>
              )
            )}
          </nav>
          <div className={styles.relatedSitesRoot} ref={relatedSitesRef}>
            <button
              ref={relatedSitesTriggerRef}
              className={styles.relatedSites}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isRelatedSitesOpen}
              aria-controls={isRelatedSitesOpen ? relatedSitesListId : undefined}
              onClick={() => setIsRelatedSitesOpen(open => !open)}
            >
              <span className={styles.relatedSitesLabel}>관련 사이트 보기</span>
              <img
                className={[
                  styles.relatedSitesChevron,
                  isRelatedSitesOpen ? styles.relatedSitesChevronOpen : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                src={chevronDownGrayUrl}
                alt=""
                aria-hidden="true"
              />
            </button>

            {isRelatedSitesOpen ? (
              <div className={styles.relatedSitesDropdown}>
                <ul
                  ref={relatedSitesListRef}
                  id={relatedSitesListId}
                  className={styles.relatedSitesList}
                  role="listbox"
                  aria-label="관련 사이트"
                >
                  {relatedSites.map(site => (
                    <li key={site.label} className={styles.relatedSitesOption} role="option">
                      <a
                        className={styles.relatedSitesLink}
                        href={site.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsRelatedSitesOpen(false)}
                      >
                        {site.label}
                      </a>
                    </li>
                  ))}
                </ul>
                {showScrollThumb ? (
                  <div className={styles.relatedSitesScrollbar} aria-hidden="true">
                    <div
                      className={styles.relatedSitesScrollbarThumb}
                      style={{ transform: `translateY(${scrollThumbTop}px)` }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.contentArea}>
        <div className={styles.shell}>
          <div className={styles.logoRow}>
            <img className={styles.jaLogo} src={jaLogoGrayUrl} alt="JA Korea" />
            <div className={styles.partnerLogos}>
              {partnerLogos.map(({ label, logoUrl, logoClassName }) => (
                <img
                  className={[styles.partnerLogo, logoClassName].join(' ')}
                  src={logoUrl}
                  alt={label}
                  key={label}
                />
              ))}
            </div>
          </div>

          <div className={styles.infoArea}>
            <p className={styles.address}>{companyAddress}</p>

            <p className={styles.companyInfoLine}>
              <span className={styles.infoDetail}>우편번호 : 07788</span>
              <span className={styles.infoDetail}>대표 : 이은형</span>
              <span className={styles.infoDetail}>사업자번호 : 107-82-10367</span>
            </p>

            <p className={styles.companyInfoLine}>
              <span className={styles.infoDetail}>대표전화 : 02-783-2367</span>
              <span className={styles.infoDetail}>팩스 : 070-4275-5115</span>
            </p>

            <p className={[styles.infoDetail, styles.companyInfoEmailOnly].join(' ')}>
              이메일 : jakorea@jakorea.org
            </p>

            <p className={styles.companyInfoLineDesktop}>
              <span className={styles.infoDetail}>우편번호 : 07788</span>
              <span className={styles.infoDetail}>대표 : 이은형</span>
              <span className={styles.infoDetail}>사업자번호 : 107-82-10367</span>
              <span className={styles.infoDetail}>대표전화 : 02-783-2367</span>
              <span className={styles.infoDetail}>팩스 : 070-4275-5115</span>
              <span className={styles.infoDetail}>이메일 : jakorea@jakorea.org</span>
            </p>
          </div>

          <div className={styles.metaRow}>
            <p className={[styles.infoDetail, styles.copyright].join(' ')}>
              ©JA Korea, {copyrightYear}
            </p>
            <div className={styles.socialLinks}>
              {socialLinks.map(({ label, iconUrl }) => (
                <a className={styles.socialLink} href="/" aria-label={label} key={label}>
                  <img src={iconUrl} alt="" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
