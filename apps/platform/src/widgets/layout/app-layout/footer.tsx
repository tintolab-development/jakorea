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
  '이용약관',
  '개인정보처리방침',
  '오시는길',
  '국세청 공시 및 공개 내역',
  '국세청 탈세 제보',
  '후원하기',
  '기부금영수증',
  '온라인 학습관리',
] as const

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

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.navigationArea}>
        <div className={styles.shell}>
          <nav className={styles.navigation} aria-label="하단 메뉴">
            {footerNavItems.map(item => (
              <button className={styles.navigationButton} type="button" key={item}>
                {item}
              </button>
            ))}
          </nav>
          <button className={styles.relatedSites} type="button" aria-haspopup="listbox">
            <span className={styles.relatedSitesLabel}>관련 사이트 보기</span>
            <img
              className={styles.relatedSitesChevron}
              src={chevronDownGrayUrl}
              alt=""
              aria-hidden="true"
            />
          </button>
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
            <p className={[styles.infoDetail, styles.copyright].join(' ')}>©JA Korea, 2022</p>
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
