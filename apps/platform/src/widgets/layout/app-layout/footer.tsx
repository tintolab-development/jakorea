import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { TermsViewModal, useTermsViewModal } from '@/features/auth'
import { useSiteFooter, type SiteFooterPartner } from '@/features/site-shell'
import jaLogoGrayUrl from '@/shared/assets/brand/ja-logo-gray.svg'
import chevronDownGrayUrl from './image/icon/toggle-down-gray-16.svg'
import chevronDownGrayMobileUrl from './image/icon/toggle-down-gray-20-mobile.svg'
import ministryLogoUrl from './image/logo/footer-logo-1.svg'
import taxLogoUrl from './image/logo/footer-logo-2.png'
import rightsLogoUrl from './image/logo/footer-logo-3.svg'
import styles from './footer.module.css'

const LOCAL_PARTNER_LOGOS: Record<number, { logoUrl: string; logoClassName: string }> = {
  1: { logoUrl: ministryLogoUrl, logoClassName: styles.partnerLogoMinistry },
  2: { logoUrl: taxLogoUrl, logoClassName: styles.partnerLogoTax },
  3: { logoUrl: rightsLogoUrl, logoClassName: styles.partnerLogoRights },
}

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

const copyrightYear = new Date().getFullYear()

function OrgLogo({ logoUrl }: { logoUrl: string | null }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [logoUrl])

  const src = !failed && logoUrl ? logoUrl : jaLogoGrayUrl
  return (
    <img
      className={styles.jaLogo}
      src={src}
      alt="JA Korea"
      onError={() => setFailed(true)}
    />
  )
}

function PartnerLogoImage({
  partner,
  allowLocal,
}: {
  partner: SiteFooterPartner
  allowLocal: boolean
}) {
  const local = LOCAL_PARTNER_LOGOS[partner.partnerId]
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [partner.logoUrl, partner.partnerId])

  const remoteSrc = partner.logoUrl && !failed ? partner.logoUrl : null
  const localSrc = local && (allowLocal || failed) ? local.logoUrl : null
  const src = remoteSrc ?? localSrc
  if (!src) return null

  const sizeClass = remoteSrc ? styles.partnerLogoRemote : local?.logoClassName

  const image = (
    <img
      className={[styles.partnerLogo, sizeClass].filter(Boolean).join(' ')}
      src={src}
      alt={partner.name}
      onError={() => {
        if (local) setFailed(true)
      }}
    />
  )

  if (partner.href) {
    return (
      <a
        className={styles.partnerLogoArea}
        href={partner.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {image}
      </a>
    )
  }

  return <span className={styles.partnerLogoArea}>{image}</span>
}

export function Footer() {
  const footer = useSiteFooter()
  const privacyNotice = useTermsViewModal()
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
            {footer.menus.map(item => {
              if (item.kind === 'directions') {
                return (
                  <Link className={styles.navigationButton} to={item.href} key={item.key}>
                    {item.label}
                  </Link>
                )
              }
              if (item.kind === 'external') {
                return (
                  <a
                    className={styles.navigationButton}
                    href={item.href}
                    key={item.key}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.label}
                  </a>
                )
              }
              return (
                <button
                  className={styles.navigationButton}
                  type="button"
                  key={item.key}
                  onClick={
                    item.kind === 'privacy'
                      ? () => privacyNotice.open('privacyNotice')
                      : item.kind === 'terms'
                        ? () => privacyNotice.open('serviceTerms')
                        : undefined
                  }
                >
                  {item.label}
                </button>
              )
            })}
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
              {/* 시안: 모바일은 입력칸 화살표 20, PC는 토글 화살표 16 */}
              <img
                className={[
                  styles.relatedSitesChevron,
                  styles.relatedSitesChevronMobile,
                  isRelatedSitesOpen ? styles.relatedSitesChevronOpen : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                src={chevronDownGrayMobileUrl}
                alt=""
                aria-hidden="true"
              />
              <img
                className={[
                  styles.relatedSitesChevron,
                  styles.relatedSitesChevronDesktop,
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
            <OrgLogo logoUrl={footer.organizationLogoUrl} />
            <div className={styles.partnerLogos}>
              {footer.partners.map(partner => (
                <PartnerLogoImage
                  partner={partner}
                  allowLocal={footer.source === 'fallback'}
                  key={partner.partnerId}
                />
              ))}
            </div>
          </div>

          <div className={styles.infoArea}>
            <p className={styles.address}>{footer.addressLine}</p>

            <div className={styles.companyInfoMobile}>
              <p className={styles.companyInfoLine}>
                <span className={styles.infoDetail}>우편번호 : {footer.postalCode}</span>
                <span className={styles.infoDetail}>대표 : {footer.representativeName}</span>
                <span className={styles.infoDetail}>
                  사업자번호 : {footer.businessRegistrationNumber}
                </span>
              </p>

              <p className={styles.companyInfoLine}>
                <span className={styles.infoDetail}>대표전화 : {footer.phone}</span>
                <span className={styles.infoDetail}>팩스 : {footer.fax}</span>
              </p>

              <p className={[styles.infoDetail, styles.companyInfoEmailOnly].join(' ')}>
                이메일 : {footer.email}
              </p>
            </div>

            <p className={styles.companyInfoLineDesktop}>
              <span className={styles.infoDetail}>우편번호 : {footer.postalCode}</span>
              <span className={styles.infoDetail}>대표 : {footer.representativeName}</span>
              <span className={styles.infoDetail}>
                사업자번호 : {footer.businessRegistrationNumber}
              </span>
              <span className={styles.infoDetail}>대표전화 : {footer.phone}</span>
              <span className={styles.infoDetail}>팩스 : {footer.fax}</span>
              <span className={styles.infoDetail}>이메일 : {footer.email}</span>
              <span className={[styles.infoDetail, styles.copyright].join(' ')}>
                ©JA Korea, {copyrightYear}
              </span>
            </p>
          </div>

          <div className={styles.metaRow}>
            <p className={[styles.infoDetail, styles.copyright].join(' ')}>
              ©JA Korea, {copyrightYear}
            </p>
          </div>
        </div>
      </div>
      <TermsViewModal
        open={privacyNotice.isOpen}
        type={privacyNotice.openType ?? 'privacyNotice'}
        onClose={privacyNotice.close}
      />
    </footer>
  )
}
