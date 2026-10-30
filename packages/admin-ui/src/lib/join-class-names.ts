import type { ReactNode } from 'react'

export function joinClassNames(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ')
}

export function hasFieldNode(node: ReactNode): boolean {
  return node != null && node !== '' && node !== false
}

export function shouldRenderFieldFrame(props: object, label: ReactNode): boolean {
  return hasFieldNode(label) || Object.prototype.hasOwnProperty.call(props, 'message')
}
