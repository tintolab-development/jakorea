import { useId } from 'react'
import { RichTextViewer } from '@/shared/rich-text'
import type {
  ParticipantRecruitmentUserViewModel,
  RecruitmentUserSpecRow,
} from './lib/map-program-to-user-view'
import './user-page-content.css'

function BackIcon() {
  return (
    <svg
      className="user-page-content__back-icon"
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="17"
      viewBox="0 0 10 17"
      fill="none"
      aria-hidden
    >
      <path
        d="M8.33333 16.6667L0 8.33333L8.33333 0L9.8125 1.47917L2.95833 8.33333L9.8125 15.1875L8.33333 16.6667Z"
        fill="#285F74"
      />
    </svg>
  )
}

function DownloadIcon() {
  const maskId = useId()

  return (
    <svg
      className="user-page-content__attachment-icon"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <mask
        id={maskId}
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="24"
        height="24"
      >
        <rect width="24" height="24" fill="#D9D9D9" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          d="M12 16L7 11L8.4 9.55L11 12.15V4H13V12.15L15.6 9.55L17 11L12 16ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V15H6V18H18V15H20V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z"
          fill="#9FAFB5"
        />
      </g>
    </svg>
  )
}

function ApplyArrowIcon() {
  return (
    <svg
      className="user-page-content__apply-arrow-icon"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z"
        fill="white"
      />
    </svg>
  )
}

function toneClassName(tone: RecruitmentUserSpecRow['tone']) {
  switch (tone) {
    case 'primary':
      return 'user-page-content__spec-value--primary'
    case 'accent-red':
      return 'user-page-content__spec-value--accent-red'
    case 'accent-blue':
      return 'user-page-content__spec-value--accent-blue'
    default:
      return 'user-page-content__spec-value--default'
  }
}

function PosterPlaceholder() {
  return (
    <div className="user-page-content__poster-placeholder" aria-hidden>
      <div className="user-page-content__poster-placeholder-inner">
        <span className="user-page-content__poster-placeholder-title">FedEx-JA</span>
        <span className="user-page-content__poster-placeholder-sub">
          International Trade Challenge 2026
        </span>
      </div>
    </div>
  )
}

function SpecValue({
  spec,
  variant,
}: {
  spec: RecruitmentUserSpecRow
  variant: 'schedule' | 'detail'
}) {
  if (variant === 'schedule') {
    return (
      <dd className="user-page-content__spec-value user-page-content__spec-value--schedule typo-bd-lg-sb">
        {spec.value.split('\n').map((line, index) => (
          <span key={`${spec.label}-${index}`} className="user-page-content__spec-line">
            {line}
          </span>
        ))}
      </dd>
    )
  }

  return (
    <dd
      className={[
        'user-page-content__spec-value',
        'user-page-content__spec-value--detail',
        'typo-bd-md-rg',
        toneClassName(spec.tone),
        spec.isHtml ? 'user-page-content__spec-value--html' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {spec.isHtml ? (
        <RichTextViewer
          content={spec.value}
          contentFormat="html"
          maxHeight="none"
          className="user-page-content__rich-text"
        />
      ) : (
        spec.value.split('\n').map((line, index) => (
          <span key={`${spec.label}-${index}`} className="user-page-content__spec-line">
            {line}
          </span>
        ))
      )}
    </dd>
  )
}

function SectionDivider() {
  return <div className="user-page-content__divider" aria-hidden="true" />
}

export function ParticipantRecruitmentUserPageContent({
  viewModel,
}: {
  viewModel: ParticipantRecruitmentUserViewModel
}) {
  return (
    <div className="user-page-content">
      <div className="user-page-content__columns">
        <div className="user-page-content__main">
          <button type="button" className="user-page-content__back" tabIndex={-1}>
            <span className="user-page-content__back-icon-wrap">
              <BackIcon />
            </span>
            <span className="user-page-content__back-label typo-bd-lg-sb">목록으로</span>
          </button>

          <div className="user-page-content__heading">
            <p className="user-page-content__category typo-hl-sm">{viewModel.categoryLabel}</p>

            <h1 className="user-page-content__title typo-hd-lg">{viewModel.title}</h1>

            <div className="user-page-content__tags">
              <span className="user-page-content__tag user-page-content__tag--status typo-bd-sm-sb">
                {viewModel.statusTag}
              </span>
              <span className="user-page-content__tag user-page-content__tag--outline typo-bd-sm-sb">
                {viewModel.targetTag}
              </span>
              <span className="user-page-content__tag user-page-content__tag--outline typo-bd-sm-sb">
                {viewModel.formatTag}
              </span>
            </div>
          </div>

          <div className="user-page-content__intro">
            {viewModel.introParagraphs.map(paragraph => (
              <p
                key={paragraph.slice(0, 24)}
                className="user-page-content__intro-paragraph typo-bd-md-rg"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <SectionDivider />

          <dl className="user-page-content__spec-list">
            {viewModel.scheduleSpecs.map(spec => (
              <div key={spec.label} className="user-page-content__spec-row">
                <dt className="user-page-content__spec-label typo-bd-sm-rg">{spec.label}</dt>
                <SpecValue spec={spec} variant="schedule" />
              </div>
            ))}
            {viewModel.detailSpecs.map(spec => (
              <div key={spec.label} className="user-page-content__spec-row">
                <dt className="user-page-content__spec-label typo-bd-sm-rg">{spec.label}</dt>
                <SpecValue spec={spec} variant="detail" />
              </div>
            ))}
          </dl>
        </div>

        <aside className="user-page-content__sidebar">
          <PosterPlaceholder />

          <button type="button" className="user-page-content__apply-btn" tabIndex={-1}>
            <span className="user-page-content__apply-btn-text">
              <span className="user-page-content__apply-label typo-bd-lg-sb">신청하기</span>
              <span className="user-page-content__apply-period typo-bd-sm-rg">
                {viewModel.applicationPeriodLabel}
              </span>
            </span>
            <ApplyArrowIcon />
          </button>

          <ul className="user-page-content__attachments">
            {viewModel.attachmentFileNames.map(fileName => (
              <li key={fileName}>
                <button type="button" className="user-page-content__attachment" tabIndex={-1}>
                  <span className="user-page-content__attachment-name typo-bd-sm-md">
                    {fileName}
                  </span>
                  <DownloadIcon />
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
