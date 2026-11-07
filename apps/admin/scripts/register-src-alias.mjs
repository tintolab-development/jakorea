import { register } from 'node:module'

register(new URL('./src-alias-loader.mjs', import.meta.url).href)
