/**
 * 보고서 썸네일 미선택 시 시안 empty 아이콘 (86×86)
 */
export function ThumbnailEmptyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="86"
      height="86"
      viewBox="0 0 86 86"
      fill="none"
      aria-hidden
    >
      <g clipPath="url(#rd-thumb-empty-clip)">
        <rect width="86" height="86" rx="8" fill="var(--default-WT, #FFF)" />
        <mask
          id="rd-thumb-empty-mask"
          style={{ maskType: 'alpha' }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="86"
          height="86"
        >
          <rect width="86" height="86" fill="#D9D9D9" />
        </mask>
        <g mask="url(#rd-thumb-empty-mask)">
          <path
            d="M62.2606 61.1855H23.8293C23.3217 61.1855 22.941 60.9466 22.6872 60.4688C22.4333 59.9911 22.4856 59.5133 22.8439 59.0355L30.5481 49.0022C30.8467 48.6438 31.205 48.4647 31.6231 48.4647C32.0412 48.4647 32.3995 48.6438 32.6981 49.0022L39.9543 58.9459L50.7043 45.0605C51.003 44.7022 51.3613 44.523 51.7793 44.523C52.1974 44.523 52.5557 44.7022 52.8543 45.0605L63.3356 59.0355C63.6342 59.5133 63.6566 59.9911 63.4028 60.4688C63.149 60.9466 62.7682 61.1855 62.2606 61.1855Z"
            fill="#E0E0E0"
          />
          <path
            d="M34.9377 30.4477C34.9377 31.6947 34.5047 32.7547 33.6387 33.6279C32.7728 34.501 31.7163 34.9376 30.4693 34.9376C29.2223 34.9376 28.1622 34.5046 27.2891 33.6386C26.4159 32.7727 25.9793 31.7162 25.9793 30.4692C25.9793 29.2222 26.4123 28.1621 27.2783 27.289C28.1443 26.4158 29.2008 25.9792 30.4478 25.9792C31.6948 25.9792 32.7548 26.4122 33.628 27.2782C34.5011 28.1442 34.9377 29.2007 34.9377 30.4477Z"
            fill="#E0E0E0"
          />
        </g>
      </g>
      <rect
        x="0.5"
        y="0.5"
        width="85"
        height="85"
        rx="7.5"
        stroke="var(--table-line, #E0E0E0)"
      />
      <defs>
        <clipPath id="rd-thumb-empty-clip">
          <rect width="86" height="86" rx="8" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
