import type { ImgHTMLAttributes } from 'react'
import addReactionUrl from './add_reaction.svg?url'
import alignHorizontalLeftUrl from './align_horizontal_left.svg?url'
import boldUrl from './Icon-6.svg?url'
import chevronDownUrl from './field.svg?url'
import densityMediumUrl from './density_medium.svg?url'
import gridOnUrl from './grid_on.svg?url'
import horizontalRuleUrl from './Icon.svg?url'
import indentUrl from './Icon-7.svg?url'
import italicUrl from './Icon-3.svg?url'
import listUrl from './Icon-2.svg?url'
import paletteUrl from './Icon-1.svg?url'
import strikeUrl from './Icon-5.svg?url'
import superscriptUrl from './superscript.svg?url'
import underlineUrl from './Icon-4.svg?url'

type RtToolbarIconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  src: string
  size?: number
}

const ICON_CLASS = 'rt-toolbar-icon'
const CHEVRON_CLASS = 'rt-toolbar-chevron'

function RtToolbarIcon({ src, size = 16, className, style, ...rest }: RtToolbarIconProps) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={[ICON_CLASS, className].filter(Boolean).join(' ')}
      style={{ display: 'block', flexShrink: 0, ...style }}
      {...rest}
    />
  )
}

export function RtChevronDownIcon({
  className,
  ...rest
}: Omit<RtToolbarIconProps, 'src' | 'size'>) {
  return (
    <RtToolbarIcon
      src={chevronDownUrl}
      size={16}
      className={[CHEVRON_CLASS, className].filter(Boolean).join(' ')}
      {...rest}
    />
  )
}

export function RtFontFamilyIcon({ className }: { className?: string }) {
  return (
    <span
      className={['rt-toolbar-font-icon', className].filter(Boolean).join(' ')}
      aria-hidden
    >
      T
    </span>
  )
}

export function RtBoldIcon(props: Omit<RtToolbarIconProps, 'src'>) {
  return <RtToolbarIcon src={boldUrl} {...props} />
}

export function RtItalicIcon(props: Omit<RtToolbarIconProps, 'src'>) {
  return <RtToolbarIcon src={italicUrl} {...props} />
}

export function RtUnderlineIcon(props: Omit<RtToolbarIconProps, 'src'>) {
  return <RtToolbarIcon src={underlineUrl} {...props} />
}

export function RtStrikeIcon(props: Omit<RtToolbarIconProps, 'src'>) {
  return <RtToolbarIcon src={strikeUrl} {...props} />
}

export function RtLineHeightIcon(props: Omit<RtToolbarIconProps, 'src'>) {
  return <RtToolbarIcon src={densityMediumUrl} {...props} />
}

export function RtSuperscriptIcon(props: Omit<RtToolbarIconProps, 'src'>) {
  return <RtToolbarIcon src={superscriptUrl} {...props} />
}

export function RtEmojiIcon(props: Omit<RtToolbarIconProps, 'src'>) {
  return <RtToolbarIcon src={addReactionUrl} {...props} />
}

export function RtPaletteIcon(props: Omit<RtToolbarIconProps, 'src'>) {
  return <RtToolbarIcon src={paletteUrl} {...props} />
}

export function RtHighlightIcon(props: Omit<RtToolbarIconProps, 'src'>) {
  return <RtToolbarIcon src={paletteUrl} {...props} />
}

export function RtAlignLeftIcon(props: Omit<RtToolbarIconProps, 'src'>) {
  return <RtToolbarIcon src={alignHorizontalLeftUrl} {...props} />
}

export function RtListIcon(props: Omit<RtToolbarIconProps, 'src'>) {
  return <RtToolbarIcon src={listUrl} {...props} />
}

export function RtIndentIcon(props: Omit<RtToolbarIconProps, 'src'>) {
  return <RtToolbarIcon src={indentUrl} {...props} />
}

export function RtHorizontalRuleIcon(props: Omit<RtToolbarIconProps, 'src'>) {
  return <RtToolbarIcon src={horizontalRuleUrl} {...props} />
}

export function RtTableIcon(props: Omit<RtToolbarIconProps, 'src'>) {
  return <RtToolbarIcon src={gridOnUrl} {...props} />
}
