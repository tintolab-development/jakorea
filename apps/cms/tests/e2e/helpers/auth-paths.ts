import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Playwright setup 이 저장하는 어드민 세션 (localStorage JWT 포함) */
export const E2E_ADMIN_AUTH_FILE = path.join(__dirname, '../.auth/admin.json')
