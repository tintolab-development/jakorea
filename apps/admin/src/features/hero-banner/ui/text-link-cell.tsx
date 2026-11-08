import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { HeroBanner } from '@/entities/hero-banner/model/types'
import './text-link-cell.css'

const EMPTY_TEXT_LABEL = '입력된 문구가 없습니다'
const EMPTY_LINK_LABEL = '연결된 링크가 없습니다'

function TextValue({ value }: { value: string }) {
  if (!value.trim()) {
    return <span className="hero-banner-text-link-cell__empty">{EMPTY_TEXT_LABEL}</span>
  }
  return <span className="hero-banner-text-link-cell__value">{value}</span>
}

export function HeroBannerTextLinkCell({ banner }: { banner: HeroBanner }) {
  const link = banner.linkUrl.trim()

  return (
    <DetailInfoForm
      title="배너 텍스트 및 링크"
      hideHeader
      mode="view"
      className="hero-banner-text-link-cell"
    >
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="상단 텍스트"
          view={<TextValue value={banner.topText} />}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="메인 타이틀"
          view={<TextValue value={banner.mainTitle} />}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="하단 텍스트"
          view={<TextValue value={banner.bottomText} />}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="연결 링크"
          view={
            link ? (
              <a
                className="hero-banner-text-link-cell__link"
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={event => event.stopPropagation()}
              >
                {link}
              </a>
            ) : (
              <span className="hero-banner-text-link-cell__empty">{EMPTY_LINK_LABEL}</span>
            )
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
