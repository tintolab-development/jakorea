/**
 * OpenAPI 스냅샷 다운로드
 * `openapi/backend.openapi.json` ← `{VITE_API_SERVER}/v3/api-docs`
 */
import {
    readFileSync,
    writeFileSync,
    statSync
} from 'node:fs'
import {
    dirname,
    join
} from 'node:path'
import {
    fileURLToPath
} from 'node:url'

const __dirname = dirname(fileURLToPath(
    import.meta.url))
const root = join(__dirname, '..')
const outputPath = join(root, 'openapi/backend.openapi.json')

function loadEnvFile(path) {
    try {
        const env = {}
        for (const line of readFileSync(path, 'utf8').split('\n')) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith('#')) continue
            const eq = trimmed.indexOf('=')
            if (eq === -1) continue
            env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
        }
        return env
    } catch {
        return {}
    }
}

const env = {
    ...loadEnvFile(join(root, '.env')),
    ...loadEnvFile(join(root, '.env.local')),
    ...process.env,
}

const base = (env.VITE_API_SERVER ?? 'https://d3r1iaa0sy4tcq.cloudfront.net').replace(
    /\/+$/,
    ''
)
const url = `${base}/v3/api-docs`

console.log(`Fetching ${url}`)

const response = await fetch(url, {
    headers: {
        'ngrok-skip-browser-warning': 'true'
    },
})

if (!response.ok) {
    throw new Error(
        `OpenAPI fetch failed: HTTP ${response.status} ${response.statusText}\n` +
        `URL: ${url}\n` +
        '백엔드 서버/ngrok URL을 확인하거나 git에 커밋된 openapi/backend.openapi.json을 사용하세요.'
    )
}

const text = await response.text()
if (!text.trim()) {
    throw new Error(`OpenAPI response is empty (URL: ${url})`)
}

let spec
try {
    spec = JSON.parse(text)
} catch (error) {
    throw new Error(`OpenAPI response is not valid JSON (URL: ${url}): ${error.message}`)
}

if (!spec.paths || Object.keys(spec.paths).length === 0) {
    throw new Error(`OpenAPI spec has no paths (URL: ${url})`)
}

writeFileSync(outputPath, `${JSON.stringify(spec, null, 2)}\n`)
console.log(
    `Wrote ${outputPath} (${statSync(outputPath).size} bytes, ${Object.keys(spec.paths).length} paths)`
)