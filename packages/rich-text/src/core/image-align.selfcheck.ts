/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/core/image-align.selfcheck.ts
 */
import assert from 'node:assert/strict'
import {
  applyImageAlignToContainerStyle,
  containerStyleHasPersistentLayout,
  mergeImageContainerStyle,
  parseCssDeclarations,
  parseImageAlignFromElement,
  parseImageContainerStyleFromElement,
  readImageAlignFromDeclarations,
} from './image-align.ts'
import { shouldInsertDroppedImageFiles } from './dropped-image-files.ts'

function fakeElement(options: {
  align?: string
  style?: string
  parentAlign?: string
  parentStyle?: string
}): HTMLElement {
  const parent =
    options.parentAlign || options.parentStyle
      ? ({
          getAttribute: (name: string) => {
            if (name === 'align') return options.parentAlign ?? null
            if (name === 'style') return options.parentStyle ?? null
            return null
          },
          style: {
            getPropertyValue: (name: string) =>
              parseCssDeclarations(options.parentStyle)[name] ?? '',
            textAlign: options.parentAlign ?? parseCssDeclarations(options.parentStyle)['text-align'] ?? '',
            float: parseCssDeclarations(options.parentStyle).float ?? '',
          },
          parentElement: null,
        } as unknown as HTMLElement)
      : null

  return {
    getAttribute: (name: string) => {
      if (name === 'align') return options.align ?? null
      if (name === 'style') return options.style ?? null
      return null
    },
    style: {
      getPropertyValue: (name: string) => parseCssDeclarations(options.style)[name] ?? '',
      float: parseCssDeclarations(options.style).float ?? '',
      textAlign: parseCssDeclarations(options.style)['text-align'] ?? '',
    },
    parentElement: parent,
  } as unknown as HTMLElement
}

const centered = applyImageAlignToContainerStyle('width: 240px; cursor: pointer', 'center')
assert.match(centered, /width: 240px/)
assert.equal(readImageAlignFromDeclarations(parseCssDeclarations(centered)), 'center')
assert.equal(containerStyleHasPersistentLayout(centered), true)

const left = applyImageAlignToContainerStyle(centered, 'left')
assert.match(left, /width: 240px/)
assert.equal(readImageAlignFromDeclarations(parseCssDeclarations(left)), 'left')

const floatImg = fakeElement({ style: 'float: left; width: 120px' })
assert.equal(parseImageAlignFromElement(floatImg), 'left')
const floatStyle = parseImageContainerStyleFromElement(floatImg)
assert.ok(floatStyle)
assert.equal(readImageAlignFromDeclarations(parseCssDeclarations(floatStyle)), 'left')
assert.match(floatStyle, /width: 120px/)

assert.equal(
  parseImageAlignFromElement(
    fakeElement({ style: 'margin-left: auto; margin-right: auto; display: block' })
  ),
  'center'
)
assert.equal(parseImageAlignFromElement(fakeElement({ align: 'right' })), 'right')
assert.equal(
  parseImageAlignFromElement(fakeElement({ parentStyle: 'text-align: center' })),
  'center'
)

const merged = mergeImageContainerStyle(
  'width: 80px',
  'margin-left: auto; margin-right: auto; display: block'
)
assert.ok(merged)
assert.match(merged, /width: 80px/)
assert.equal(readImageAlignFromDeclarations(parseCssDeclarations(merged)), 'center')

assert.equal(shouldInsertDroppedImageFiles([]), false)
assert.equal(shouldInsertDroppedImageFiles(null), false)
assert.equal(
  shouldInsertDroppedImageFiles([new File(['x'], 'a.png', { type: 'image/png' })]),
  true
)
assert.equal(
  shouldInsertDroppedImageFiles([new File(['x'], 'a.txt', { type: 'text/plain' })]),
  false
)

console.log('rich-text image-align selfcheck: ok')
