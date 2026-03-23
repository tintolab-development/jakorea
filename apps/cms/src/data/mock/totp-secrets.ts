/**
 * 개발용 고정 TOTP 시크릿 (Base32). 운영에서는 서버에서만 보관해야 함.
 */
/** otplib v13은 Base32 디코드 시 최소 16바이트(128비트) 시크릿을 요구함 */
const TOTP_SECRETS_BY_EMAIL: Record<string, string> = {
  'admin1@jakorea.org': 'YB6USKOPTY3O4XCOM55K26HWAJFCOYAW',
  'admin2@jakorea.org': 'Z3YRM7RBPVNVMFYNQ2WY6RISDI7QLN2D',
  'admin3@jakorea.org': 'PBG2PKAFVVQBTDSBLXVHWTCN56COJN2I',
}

export function getTotpSecretByEmail(email: string): string | undefined {
  return TOTP_SECRETS_BY_EMAIL[email.toLowerCase()]
}
