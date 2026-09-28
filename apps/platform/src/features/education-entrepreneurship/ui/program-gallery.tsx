import type { EntrepreneurshipProgramGalleryVariant, EntrepreneurshipProgramImage } from '../model/types'
import styles from './program-gallery.module.css'

type ProgramGalleryProps = {
  variant: EntrepreneurshipProgramGalleryVariant
  images: EntrepreneurshipProgramImage[]
}

function GalleryImage({
  image,
  className,
  loading,
}: {
  image: EntrepreneurshipProgramImage
  className?: string
  loading: 'lazy' | 'eager'
}) {
  return (
    <div className={[styles.frame, className].filter(Boolean).join(' ')}>
      <img
        className={styles.image}
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={loading}
        style={image.objectPosition ? { objectPosition: image.objectPosition } : undefined}
      />
    </div>
  )
}

export function ProgramGallery({ variant, images }: ProgramGalleryProps) {
  if (variant === 'split') {
    const [wide, narrow] = images
    if (!wide || !narrow) return null

    return (
      <div className={styles.split}>
        <GalleryImage image={wide} loading="lazy" />
        <GalleryImage image={narrow} loading="lazy" />
      </div>
    )
  }

  if (variant === 'full') {
    const [full] = images
    if (!full) return null

    return (
      <div className={styles.full}>
        <GalleryImage image={full} loading="lazy" />
      </div>
    )
  }

  const [main, top, bottom] = images
  if (!main || !top || !bottom) return null

  return (
    <div className={styles.stack}>
      <GalleryImage image={main} className={styles.stackMain} loading="lazy" />
      <div className={styles.stackSide}>
        <GalleryImage image={top} loading="lazy" />
        <GalleryImage image={bottom} loading="lazy" />
      </div>
    </div>
  )
}
