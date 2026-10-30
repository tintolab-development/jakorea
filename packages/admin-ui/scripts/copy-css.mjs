import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { copyCssFiles } from '../../form-template-runtime/scripts/copy-css-lib.mjs'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const ASSET_EXTS = ['.css', '.svg']
copyCssFiles(join(root, 'src'), join(root, 'dist'), { prune: true, extensions: ASSET_EXTS })
