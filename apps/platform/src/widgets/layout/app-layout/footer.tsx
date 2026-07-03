import { PFText } from '@/shared/ui'
import jaLogoGrayUrl from '@/shared/assets/brand/ja-logo-gray.svg'
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
  '국세청 공시 제보',
  '후원하기',
  '기부금영수증',
  '디자인 학습관리',
]

const companyInfoItems = [
  '우편번호 : 07788',
  '대표 : 여문환',
  '사업자번호 : 107-82-10367',
  '대표전화 : 02-783-2367',
  '팩스 : 070-4275-5115',
  '이메일 : jakorea@jakorea.org',
]

const socialLinks = [
  { label: 'JA Korea 유튜브', iconUrl: youtubeIconUrl },
  { label: 'JA Korea 인스타그램', iconUrl: instagramIconUrl },
  { label: 'JA Korea 페이스북', iconUrl: facebookIconUrl },
]

const partnerLogos = [
  { label: '기획재정부', logoUrl: ministryLogoUrl },
  { label: '국세청', logoUrl: taxLogoUrl },
  { label: '국민권익위원회', logoUrl: rightsLogoUrl },
]

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles['navigation-area']}>
        <nav className={styles.navigation} aria-label="하단 메뉴">
          {footerNavItems.map((item) => (
            <button className={styles['navigation-button']} type="button" key={item}>
              <PFText typo="bd-md-rg" color="neutral-cool-500">
                {item}
              </PFText>
            </button>
          ))}
        </nav>
      </div>

      <div className={styles['content-area']}>
        <div className={styles['logo-area']}>
          <img className={styles['ja-logo']} src={jaLogoGrayUrl} alt="JA Korea" />

          <div className={styles['partner-logos']}>
            {partnerLogos.map(({ label, logoUrl }) => (
              <img className={styles['partner-logo']} src={logoUrl} alt={label} key={label} />
            ))}
          </div>
        </div>

        <div className={styles['info-area']}>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-500">
            사단법인 제이에이코리아 서울특별시 강서구 마곡중앙로 171 마곡나루역
            프라이빗타워2차 714호
          </PFText>

          <div className={styles['company-info-list']}>
            {companyInfoItems.map((item) => (
              <PFText as="span" typo="bd-sm-rg" color="neutral-cool-500" key={item}>
                {item}
              </PFText>
            ))}
          </div>
        </div>

        <div className={styles['social-area']}>
          <div className={styles['social-links']}>
            {socialLinks.map(({ label, iconUrl }) => (
              <a className={styles['social-link']} href="/" aria-label={label} key={label}>
                <img src={iconUrl} alt="" aria-hidden="true" />
              </a>
            ))}
          </div>

          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-500" className={styles.copyright}>
            ⓒJA Korea,2022
          </PFText>
        </div>
      </div>
    </footer>
  )
}
