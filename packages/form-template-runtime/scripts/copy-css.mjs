import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { copyCssFiles } from './copy-css-lib.mjs'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
copyCssFiles(join(root, 'src'), join(root, 'dist'), { prune: true })
