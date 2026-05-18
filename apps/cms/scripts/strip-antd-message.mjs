/**
 * Remove antd `message` imports and API calls from CMS src (targeted files only).
 */
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve('apps/cms/src')
const ERROR_HANDLER_PATH = path.join(ROOT, 'shared/utils/error-handler.ts')

const NEEDLE =
  /message\.(success|error|warning|info|loading)\(|show(?:Success|Error|Warning|Info)Message\(|import\s*\{[^}]*\bmessage\b[^}]*\}\s*from\s*['"]antd['"]|App\.useApp\(\)[^;]*\bmessage\b|messageApi/

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, files)
    else if (/\.(ts|tsx)$/.test(ent.name)) files.push(p)
  }
  return files
}

function stripAntdMessageFromImportLine(line) {
  if (!/from\s+['"]antd['"]/.test(line) || !/\bmessage\b/.test(line)) return line

  const m = line.match(/^(\s*)import\s*(type\s+)?\{([^}]+)\}\s*from\s*['"]antd['"]\s*;?\s*$/)
  if (!m) return line

  const [, indent, typeKw, inner] = m
  const parts = inner
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .filter(p => p !== 'message' && !/^message\s+as\s/.test(p))

  if (parts.length === 0) return null // delete this line only
  return `${indent}import ${typeKw ? `${typeKw} ` : ''}{ ${parts.join(', ')} } from 'antd'`
}

function removeMessageApiCalls(source) {
  let result = ''
  let i = 0
  const len = source.length

  while (i < len) {
    const rest = source.slice(i)
    const match = rest.match(/^message\.(success|error|warning|info|loading)\s*\(/)
    if (!match) {
      result += source[i]
      i++
      continue
    }

    let j = i + match[0].length
    let depth = 1
    while (j < len && depth > 0) {
      const ch = source[j]
      if (ch === '(') depth++
      else if (ch === ')') depth--
      j++
    }
    while (j < len && /[\s;]/.test(source[j])) j++
    if (source[j] === '\n') j++
    i = j
  }
  return result
}

function stripAppUseAppMessage(source) {
  return source.replace(
    /const\s*\{([^}]+)\}\s*=\s*App\.useApp\(\)/g,
    (full, inner) => {
      const parts = inner
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .filter(p => {
          const name = p.split(':')[0].trim()
          return name !== 'message'
        })
      if (parts.length === 0) return full.replace(/\bmessage\b,?\s*/g, '').replace(/,\s*,/g, ',')
      return `const { ${parts.join(', ')} } = App.useApp()`
    }
  )
}

function cleanErrorHandlerImports(source) {
  return source.replace(
    /import\s*\{([^}]+)\}\s*from\s*['"]@\/shared\/utils\/error-handler['"]/g,
    (full, inner) => {
      const parts = inner
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .filter(p => !/^show(?:Success|Error|Warning|Info)Message$/.test(p))
      if (parts.length === 0) return ''
      return `import { ${parts.join(', ')} } from '@/shared/utils/error-handler'`
    }
  )
}

function processSource(source) {
  let src = source
  src = src
    .replace(/showSuccessMessage\s*\(/g, 'message.success(')
    .replace(/showErrorMessage\s*\(/g, 'message.error(')
    .replace(/showWarningMessage\s*\(/g, 'message.warning(')
    .replace(/showInfoMessage\s*\(/g, 'message.info(')

  const lines = src.split('\n')
  const out = []
  for (const line of lines) {
    const next = stripAntdMessageFromImportLine(line)
    if (next === null) continue
    out.push(next)
  }
  src = out.join('\n')

  src = stripAppUseAppMessage(src)
  src = cleanErrorHandlerImports(src)
  src = removeMessageApiCalls(src)

  // msg.* from MFA (after message import removed)
  src = src.replace(/\bmsg\.(success|error|warning|info|loading)\s*\([^)]*\)\s*;?/g, '')
  src = src.replace(/\bmsg\.(success|error|warning|info|loading)\s*\(\s*[\s\S]*?\)\s*;?/g, m => {
    // multiline - simple: only single-line was in file
    return ''
  })

  // remove showMessage option lines / props
  src = src.replace(/,?\s*showMessage:\s*(?:true|false|!!\w+)/g, '')

  return src
}

const ERROR_HANDLER_CONTENT = `/**
 * 공통 에러 처리 유틸리티
 */

export const ErrorType = {
  NETWORK: 'NETWORK',
  SERVER: 'SERVER',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  UNKNOWN: 'UNKNOWN',
} as const

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType]

export interface ErrorInfo {
  type: ErrorType
  message: string
  originalError?: unknown
}

export function classifyError(error: unknown): ErrorType {
  if (!error) return ErrorType.UNKNOWN as ErrorType

  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()

    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      error.name === 'NetworkError' ||
      error.name === 'TypeError'
    ) {
      return ErrorType.NETWORK as ErrorType
    }

    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return ErrorType.NOT_FOUND as ErrorType
    }

    if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      return ErrorType.UNAUTHORIZED as ErrorType
    }

    if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
      return ErrorType.FORBIDDEN as ErrorType
    }

    if (
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('400') ||
      errorMessage.includes('422')
    ) {
      return ErrorType.VALIDATION as ErrorType
    }

    if (
      errorMessage.includes('server') ||
      errorMessage.includes('internal') ||
      errorMessage.includes('500')
    ) {
      return ErrorType.SERVER as ErrorType
    }
  }

  if (typeof error === 'string') {
    const errorMessage = error.toLowerCase()
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return ErrorType.NETWORK as ErrorType
    }
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return ErrorType.NOT_FOUND as ErrorType
    }
  }

  return ErrorType.UNKNOWN as ErrorType
}

export function getUserFriendlyMessage(errorType: ErrorType, defaultMessage?: string): string {
  if (defaultMessage) return defaultMessage

  switch (errorType) {
    case ErrorType.NETWORK:
      return '네트워크 연결에 문제가 발생했습니다. 인터넷 연결을 확인해주세요.'
    case ErrorType.NOT_FOUND:
      return '요청한 데이터를 찾을 수 없습니다.'
    case ErrorType.UNAUTHORIZED:
      return '인증이 필요합니다. 다시 로그인해주세요.'
    case ErrorType.FORBIDDEN:
      return '접근 권한이 없습니다.'
    case ErrorType.VALIDATION:
      return '입력한 정보를 확인해주세요.'
    case ErrorType.SERVER:
      return '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
    case ErrorType.UNKNOWN:
    default:
      return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
}

export function extractErrorInfo(error: unknown, defaultMessage?: string): ErrorInfo {
  const type = classifyError(error)
  const msg = getUserFriendlyMessage(type, defaultMessage)

  return {
    type,
    message: msg,
    originalError: error,
  }
}

function logError(errorInfo: ErrorInfo, context?: string) {
  if (import.meta.env.DEV) {
    console.error(\`[Error Handler]\${context ? \` [\${context}]\` : ''}\`, {
      type: errorInfo.type,
      message: errorInfo.message,
      originalError: errorInfo.originalError,
    })
  }
}

export function handleError(
  error: unknown,
  options?: {
    defaultMessage?: string
    context?: string
  }
): ErrorInfo {
  const { defaultMessage, context } = options || {}
  const errorInfo = extractErrorInfo(error, defaultMessage)
  logError(errorInfo, context)
  return errorInfo
}

export async function executeWithErrorHandling<T>(
  fn: () => Promise<T>,
  options?: {
    defaultMessage?: string
    context?: string
    onError?: (errorInfo: ErrorInfo) => void
  }
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    const errorInfo = handleError(error, options)
    options?.onError?.(errorInfo)
    return null
  }
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options?: {
    successMessage?: string
    errorMessage?: string
    onSuccess?: (result: T) => void | Promise<void>
    onError?: (error: Error) => void
    context?: string
  }
): Promise<T | undefined> {
  try {
    const result = await operation()

    if (options?.onSuccess) {
      await options.onSuccess(result)
    }

    return result
  } catch (error) {
    const errorInfo = handleError(error, {
      defaultMessage: options?.errorMessage,
      context: options?.context,
    })

    if (options?.onError) {
      const err = error instanceof Error ? error : new Error(errorInfo.message)
      options.onError(err)
    }

    return undefined
  }
}
`

let changed = 0
for (const file of walk(ROOT)) {
  if (file === ERROR_HANDLER_PATH) continue
  const orig = fs.readFileSync(file, 'utf8')
  if (!NEEDLE.test(orig)) continue

  const next = processSource(orig)
  if (next !== orig) {
    fs.writeFileSync(file, next)
    changed++
  }
}

fs.writeFileSync(ERROR_HANDLER_PATH, ERROR_HANDLER_CONTENT + '\n')

// MFA manual cleanup
const mfaPath = path.join(ROOT, 'features/auth/hooks/use-mfa-verification.ts')
let mfa = fs.readFileSync(mfaPath, 'utf8')
mfa = mfa.replace(/import \{ Form, message \} from 'antd'/, "import { Form } from 'antd'")
mfa = mfa.replace(/\n\s*messageApi\?:[^\n]+\n/, '\n')
mfa = mfa.replace(/,\s*messageApi\s*:\s*messageApi/, '')
mfa = mfa.replace(/messageApi,?\s*/g, '')
mfa = mfa.replace(/\n\s*const msg = messageApi \|\| message\n/, '\n')
mfa = mfa.replace(/\bmsg\.(success|error|warning|info)\([^)]*\)\s*\n?/g, '')
mfa = mfa.replace(/, msg\]/g, ']').replace(/, msg\)/g, ')').replace(/, msg,/g, ',')
fs.writeFileSync(mfaPath, mfa)

const mfaModal = path.join(ROOT, 'features/auth/ui/mfa-verification-modal.tsx')
let mfaM = fs.readFileSync(mfaModal, 'utf8')
mfaM = mfaM.replace(/\s*const \{ message \} = App\.useApp\(\)\n/, '\n')
mfaM = mfaM.replace(/messageApi: message,?\s*/, '')
mfaM = mfaM.replace(/useMfaVerification\(\{ open, messageApi: message \}\)/, 'useMfaVerification({ open })')
mfaM = mfaM.replace(/useMfaVerification\(\{ open \}\)/, 'useMfaVerification({ open })')
if (!mfaM.includes('App.useApp')) {
  mfaM = mfaM.replace(/import \{ App, /, 'import { ').replace(/import \{ App \} from 'antd'\n/, '')
}
fs.writeFileSync(mfaModal, mfaM)

console.log('changed:', changed + 2)
