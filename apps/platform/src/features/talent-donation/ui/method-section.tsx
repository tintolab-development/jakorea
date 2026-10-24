import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { PFButton, PFText, remoteCopyClassName } from '@/shared/ui'
import { usePublicTalentSponsorshipView } from '../api/hooks'
import {
  METHODS_SECTION_TITLE,
  STORIES_SECTION_EYEBROW,
  type MethodCardContent,
  type MethodCardId,
  type StoryContent,
} from '../lib/constants'
import { STORY_IMAGE_URLS } from '../lib/content-images'
import styles from './method-section.module.css'

const METHOD_SURFACE_CLASS: Record<MethodCardId, string> = {
  mentoring: styles.methodSurfaceMentoring,
  advisory: styles.methodSurfaceAdvisory,
  program_support: styles.methodSurfaceSupport,
}

function MethodCard({ card }: { card: MethodCardContent }) {
  return (
    <article className={styles.methodCard}>
      <div className={[styles.methodSurface, METHOD_SURFACE_CLASS[card.id]].join(' ')}>
        <div className={styles.methodBody}>
          <PFText as="h3" typo="hd-lg" color="black" className={styles.methodTitle}>
            {card.title}
          </PFText>
          <PFText
            as="p"
            typo="bd-lg-rg"
            color="neutral-cool-700"
            className={styles.methodDescription}
          >
            {card.descriptionLines.map((line, index) => (
              <Fragment key={`${line}-${index}`}>
                {index > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </PFText>
        </div>
      </div>
    </article>
  )
}

function StoryBlock({
  story,
  href,
}: {
  story: StoryContent
  href: string | null
}) {
  const imageUrl = STORY_IMAGE_URLS[story.id]
  const layoutClass =
    story.layout === 'mediaFirst' ? styles.storyMediaFirst : styles.storyTextFirst

  return (
    <article className={[styles.story, layoutClass].join(' ')}>
      <div className={styles.storyBody}>
        <div className={styles.storyText}>
          <PFText as="h3" typo="page-title-sm" color="black" className={styles.storyTitle}>
            {story.titleLines.map((line, index) => (
              <Fragment key={`${line}-${index}`}>
                {index > 0 ? <br className={styles.pcOnly} /> : null}
                {line}
              </Fragment>
            ))}
          </PFText>

          <PFText
            as="p"
            typo="bd-lg-rg"
            color="neutral-cool-700"
            className={styles.storyDescription}
          >
            {story.descriptionLines.map((line, index) => (
              <Fragment key={`${line}-${index}`}>
                {index === 0 ? '“' : null}
                {index > 0 ? <br /> : null}
                {line}
                {index === story.descriptionLines.length - 1 ? '”' : null}
              </Fragment>
            ))}
          </PFText>
        </div>

        {href ? (
          <Link to={href} className={[styles.storyLink, styles.storyButton, 'typo-bd-lg-sb'].join(' ')}>
            {story.buttonLabel}
          </Link>
        ) : (
          <PFButton type="button" size="xlarge" variant="primary" className={styles.storyButton} disabled>
            {story.buttonLabel}
          </PFButton>
        )}
      </div>

      <div className={styles.storyVisual}>
        <div className={styles.storyImageFrame}>
          <img className={styles.storyImage} src={imageUrl} alt="" />
        </div>
      </div>
    </article>
  )
}

export function MethodSection() {
  const { methodCards, stories, isPending } = usePublicTalentSponsorshipView()
  const copyClass = remoteCopyClassName(isPending)

  return (
    <section
      className={styles.section}
      aria-labelledby="talent-donation-methods-title"
      aria-busy={isPending || undefined}
    >
      <div className={[styles.content, copyClass].join(' ')}>
        <div className={styles.methods}>
          <PFText
            as="h2"
            id="talent-donation-methods-title"
            typo="page-title-sm"
            color="black"
            className={styles.methodsTitle}
          >
            {METHODS_SECTION_TITLE}
          </PFText>

          <div className={styles.methodList}>
            {methodCards.map(card => (
              <MethodCard key={card.id} card={card} />
            ))}
          </div>
        </div>

        <div className={styles.stories} aria-labelledby="talent-donation-stories-eyebrow">
          <PFText
            as="p"
            id="talent-donation-stories-eyebrow"
            typo="hl-lg"
            color="primary-400"
            className={styles.storiesEyebrow}
          >
            {STORIES_SECTION_EYEBROW}
          </PFText>

          <div className={styles.storyList}>
            {stories.map(story => (
              <StoryBlock key={story.id} story={story} href={story.href} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
