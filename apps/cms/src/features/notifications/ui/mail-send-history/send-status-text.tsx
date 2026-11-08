import type { CSSProperties } from 'react'

/**
 * 메일 발송 형태 Text 색 (Figma Status / Text / 메일 발송 형태 14804:19688).
 * 라벨은 adapter 결과를 그대로 쓰고, 시안 대응이 없는 값(발송 요청·예약·확인불가·unknown)은 기본색으로 둔다.
 */
const MAIL_SEND_STATUS_TEXT_STYLE: Record<string, CSSProperties> = {
  '발송 대기': { color: 'var(--Status-green-main, #1e8c29)' },
  '발송 중': { color: 'var(--Status-blue-main, #017eaf)' },
  '발송 실패': { color: 'var(--Status-red-main, #c32f4a)' },
  '발송 완료': { color: 'var(--Netural-black, #3d3d3d)' },
  '발송 취소': { color: 'var(--Netural-black, #3d3d3d)', opacity: 0.5 },
}

export function MailSendStatusText({ status }: { status: string }) {
  const style = MAIL_SEND_STATUS_TEXT_STYLE[status]
  return style ? <span style={style}>{status}</span> : status
}
