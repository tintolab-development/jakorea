import type { CareerProgramGalleryVariant, CareerProgramImage } from '../model/types'
import styles from './program-gallery.module.css'

type ProgramGalleryProps = {
  variant: CareerProgramGalleryVariant
  images: CareerProgramImage[]
}

function GalleryImage({
  image,
  className,
  loading,
}: {
  image: CareerProgramImage
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
  if (variant === 'explore') {
    const [wide, narrow] = images
    if (!wide || !narrow) return null

    return (
      <div className={styles.explore}>
        <GalleryImage image={wide} loading="lazy" />
        <GalleryImage image={narrow} loading="lazy" />
      </div>
    )
  }

  if (variant === 'experience') {
    const [full] = images
    if (!full) return null

    return (
      <div className={styles.experience}>
        <GalleryImage image={full} loading="lazy" />
      </div>
    )
  }

  const [main, top, bottom] = images
  if (!main || !top || !bottom) return null

  return (
    <div className={styles.strengthen}>
      <GalleryImage image={main} className={styles.strengthenMain} loading="lazy" />
      <div className={styles.strengthenSide}>
        <GalleryImage image={top} loading="lazy" />
        <GalleryImage image={bottom} loading="lazy" />
      </div>
    </div>
  )
}
