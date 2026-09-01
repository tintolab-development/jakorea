/**
 * Targeted removal/rename of non-toast `message` identifiers.
 * Only touches files that match known patterns.
 */
import fs from 'fs'
import path from 'path'

const SRC = path.resolve('apps/cms/src')

const NEEDLES = [
  /,\s*message:\s*['"`]/,
  /\{\s*required:\s*true,\s*message:/,
  /z\.string\(\{\s*message:/,
  /<Alert[^>]*\bmessage=/,
  /GuideMessage/,
  /\bguideMessage\b/,
  /error\.message/,
  /e\.message|err\.message/,
  /interface ErrorInfo[^}]*\bmessage:/,
  /errorInfo\.message/,
  /Notification[^}]*\bmessage:\s*string/,
  /notification\.message/,
  /ActionResultModal[^}]*\bmessage:/,
  /\bmessage:\s*ReactNode/,
  /DetailInfoForm[^}]*\bmessage\?:/,
  /OtpSendResponse|OtpVerifyResponse/,
  /message:\s*`일일 인증/,
  /Alert\s+type=[^>]*\bmessage=/,
]

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, files)
    else if (/\.(ts|tsx)$/.test(ent.name)) files.push(p)
  }
  return files
}

function shouldProcess(content) {
  return NEEDLES.some(re => re.test(content))
}

function stripRuleMessages(s) {
  s = s.replace(/,?\s*message:\s*'(?:[^'\\]|\\.)*'/g, '')
  s = s.replace(/,?\s*message:\s*"(?:[^"\\]|\\.)*"/g, '')
  s = s.replace(/,?\s*message:\s*`(?:[^`\\]|\\.)*`/g, '')
  s = s.replace(/,?\s*message:\s*MESSAGES\.[a-zA-Z0-9_.()]+\([^)]*\)/g, '')
  s = s.replace(/,?\s*message:\s*MESSAGES\.[a-zA-Z0-9_.]+/g, '')
  s = s.replace(/z\.string\(\{\s*message:\s*'[^']*'\s*\}\)/g, 'z.string()')
  s = s.replace(/\.instanceof\(([^)]+),\s*\{\s*message:\s*'[^']*'\s*\}\)/g, '.instanceof($1)')
  s = s.replace(/,\s*\{\s*message:\s*'[^']*'\s*\}/g, '')
  return s
}

function transform(content, file) {
  let s = content

  s = stripRuleMessages(s)

  s = s.replace(/<Alert\b([^>]*?)\bmessage=/g, '<Alert$1description=')

  s = s.replace(/\bguideMessage\b/g, 'guideText')
  s = s.replace(/GuideMessage/g, 'GuideAlert')
  s = s.replace(/from ['"]@\/shared\/ui['"]/g, m => m) // noop
  s = s.replace(
    /<GuideAlert message=\{([^}]+)\}/g,
    '<GuideAlert text={$1}'
  )

  if (file.includes('notification-service.ts')) {
    s = s.replace(/\bmessage: string\b/g, 'body: string')
    s = s.replace(/(\w+),\s*\n\s*message,/g, '$1,\n    body,')
    s = s.replace(/notification\.message/g, 'notification.body')
  }
  if (/notification-widget|notification-dropdown|notification-modal/.test(file)) {
    s = s.replace(/\.message\b/g, '.body')
  }

  if (file.includes('types/mfa.ts')) {
    s = s.replace(/(Otp\w+Response \{[^}]*?)\bmessage: string/g, '$1detail: string')
  }
  if (file.includes('mfa-service.ts') || file.includes('register-service.ts')) {
    s = s.replace(/^\s+message:/gm, '      detail:')
  }

  if (file.includes('action-result-modal.tsx')) {
    s = s.replace(/\bmessage: ReactNode\b/g, 'body: ReactNode')
    s = s.replace(/\bmessage,\n/g, 'body,\n')
    s = s.replace(/\btypeof message\b/g, 'typeof body')
    s = s.replace(/\bconst match = message\./g, 'const match = body.')
    s = s.replace(/\breturn message\b/g, 'return body')
    s = s.replace(/\bconst rest = message\./g, 'const rest = body.')
    s = s.replace(/\brenderedMessage\b/g, 'renderedBody')
    s = s.replace(/\bmessage\b/g, (m, i) => {
      const line = s.slice(s.lastIndexOf('\n', i) + 1, i)
      if (line.includes('import') || line.includes('//')) return m
      const ctx = s.slice(Math.max(0, i - 40), i + 20)
      if (/ActionResultModal|body:|renderedBody/.test(ctx)) return m
      if (/^\s+message[,:]/.test(s.slice(i))) return 'body'
      return m
    })
  }
  s = s.replace(/<ActionResultModal\b([^>]*)\bmessage=/g, '<ActionResultModal$1body=')

  if (file.includes('detail-info-form.tsx')) {
    s = s.replace(/\bmessage\?: ReactNode\b/g, 'headerNote?: ReactNode')
    s = s.replace(/\bmessage,\n/g, 'headerNote,\n')
    s = s.replace(/\{message &&/g, '{headerNote &&')
    s = s.replace(/\{message\}/g, '{headerNote}')
  }
  s = s.replace(/<DetailInfoForm\b([^>]*)\bmessage=/g, '<DetailInfoForm$1headerNote=')

  if (file.includes('pending-actions-alert.tsx')) {
    s = s.replace(/(\s+)message: string\n(\s+)description:/g, '$1title: string\n$2description:')
    s = s.replace(/(\s+)message: `/g, '$1title: `')
    s = s.replace(/message=\{alert\.message\}/g, 'title={alert.title}')
  }

  if (file.includes('notification-providers.ts')) {
    s = s.replace(/\bmessage: string\b/g, 'body: string')
  }
  if (file.includes('application-notification-service.ts')) {
    s = s.replace(/send\(\{ to: phone, message:/g, 'send({ to: phone, body:')
  }

  if (file.includes('error-handler.ts')) {
    return content // handled separately
  }
  if (file.includes('error-boundary.tsx')) {
    s = s.replace(/error\.message\.includes/g, 'String(error).includes')
    s = s.replace(/errorInfo\.message/g, 'errorInfo.detail')
  }

  if (!file.includes('application-path-form') && !file.includes('react-hook-form')) {
    s = s.replace(
      /(\w+) instanceof Error \? \1\.message :/g,
      'unknownErrorText($1,'
    )
  }

  if (file.includes('admin-login-api.types.ts')) {
    s = s.replace(/\bmessage: string\b/g, 'detail: string')
  }
  if (file.includes('admin-login-fetcher.ts')) {
    s = s.replace(/payload\.error\?\.message/g, 'payload.error?.detail')
    s = s.replace(/constructor\(code: string, message: string\)/, 'constructor(code: string, detail: string)')
    s = s.replace(/super\(message\)/, 'super(detail)')
  }

  s = s.replace(/\{\s+,/g, '{ ')
  s = s.replace(/,\s+\}/g, ' }')

  return s
}

let n = 0
for (const file of walk(SRC)) {
  if (file.endsWith('guide-message.tsx')) continue
  const orig = fs.readFileSync(file, 'utf8')
  if (!shouldProcess(orig)) continue
  const next = transform(orig, file)
  if (next !== orig) {
    fs.writeFileSync(file, next)
    n++
  }
}

console.log('updated', n, 'files')
