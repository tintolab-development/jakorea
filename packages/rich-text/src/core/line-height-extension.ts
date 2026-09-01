import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType
      unsetLineHeight: () => ReturnType
    }
  }
}

/** paragraph·heading에 `lineHeight` 속성 (FontSize 패턴) */
export const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: element => {
              const value = element.style.lineHeight
              return value ? value.replace(/['"]+/g, '') : null
            },
            renderHTML: attributes => {
              if (!attributes.lineHeight) return {}
              return { style: `line-height: ${attributes.lineHeight}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ commands }) =>
          this.options.types.some((type: string) =>
            commands.updateAttributes(type, { lineHeight })
          ),
      unsetLineHeight:
        () =>
        ({ commands }) =>
          this.options.types.some((type: string) =>
            commands.resetAttributes(type, 'lineHeight')
          ),
    }
  },
})
