/**
 * Copy the published privacy display stylesheet after tsc.
 * Use the Node.js filesystem API so the package builds identically on
 * Windows self-hosted GitHub runners and Linux/macOS CI.
 */
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = fileURLToPath(new URL('../src/privacy/privacy-home-address-display.css', import.meta.url))
const destination = fileURLToPath(new URL('../dist/privacy/privacy-home-address-display.css', import.meta.url))

await mkdir(dirname(destination), { recursive: true })
await copyFile(source, destination)
console.log('UI_PRIVACY_CSS_COPY=PASS')
