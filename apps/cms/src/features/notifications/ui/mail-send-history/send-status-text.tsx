/** Color only: preserve the adapter label and every unknown/default value verbatim. */
export function MailSendStatusText({ status }: { status: string }) {
  return status === '발송 실패' ? (
    <span style={{ color: 'var(--Status-red-main, #c32f4a)' }}>{status}</span>
  ) : (
    status
  )
}
