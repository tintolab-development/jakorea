import { Fragment } from 'react'
import { PFText } from '@/shared/ui'
import { MISSION_LABEL, VISION_LABEL } from '../lib/hero-copy'
import { HERO_ARROW_URL, HERO_BG_URL } from '../lib/hero-image'
import { isHeroPhaseAtLeast, type HeroPhase } from '../lib/hero-phase'
import type { IntroductionHeroContent } from '../model/types'
import styles from './hero-section.module.css'

function Lines({ lines }: { lines: readonly string[] }) {
  if (lines.length === 0) return null
  return (
    <>
      {lines.map((line, index) => (
        <Fragment key={`${index}-${line}`}>
          {index > 0 ? <br className={styles.pcOnly} /> : null}
          {line}
        </Fragment>
      ))}
    </>
  )
}

export type HeroStageProps = {
  hero: IntroductionHeroContent
  activePhase: HeroPhase
  isDesktopMotion: boolean
  showArrow?: boolean
  onScrollArrowClick?: () => void
}

/** Hero Motion 1·2 표현 단위 — 스크롤/phase는 IntroductionScroll이 소유 */
export function HeroStage({
  hero,
  activePhase,
  isDesktopMotion,
  showArrow = false,
  onScrollArrowClick,
}: HeroStageProps) {
  const showHeadline = isHeroPhaseAtLeast(activePhase, 'intro')
  const showMessage = isHeroPhaseAtLeast(activePhase, 'message')
  const showSplit = isHeroPhaseAtLeast(activePhase, 'inspiring')
  const missionActive = activePhase === 'mission' || activePhase === 'exit'

  return (
    <div className={styles.viewport}>
      {/* Motion 1 — 풀스크린 카피 */}
      <div
        className={styles.openingStage}
        aria-hidden={isDesktopMotion && showSplit ? true : undefined}
      >
        <img
          className={styles.openingBackground}
          src={HERO_BG_URL}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
        <div className={styles.openingText}>
          <h1
            className={styles.intro}
            aria-hidden={isDesktopMotion && !showHeadline ? true : undefined}
          >
            <span className={styles.introDesktop}>
              <Lines lines={hero.introLines} />
            </span>
            <span className={styles.introMobile}>{hero.introMobile}</span>
          </h1>
          <p
            className={styles.message}
            aria-hidden={isDesktopMotion && !showMessage ? true : undefined}
          >
            <Lines lines={hero.messageLines} />
          </p>
        </div>
      </div>

      {/* Motion 2 — 좌/우 스플릿 */}
      <div
        className={styles.splitStage}
        aria-hidden={isDesktopMotion && !showSplit ? true : undefined}
      >
        <div className={styles.brandPanel}>
          <img
            className={styles.brandBackground}
            src={HERO_BG_URL}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
          <div className={styles.brandSlides}>
            <div className={styles.brandSlide}>
              <div className={styles.inspiringLead}>
                <p className={styles.inspiringTitle}>
                  <Lines lines={hero.inspiringTitleLines} />
                </p>
                <PFText
                  as="p"
                  typo="bd-lg-rg"
                  color="primary-800"
                  className={styles.inspiringDescription}
                >
                  <Lines lines={hero.inspiringDescriptionLines} />
                </PFText>
              </div>
            </div>
            <div className={styles.brandSlide}>
              <div className={styles.phaseLabels}>
                <p
                  className={[
                    styles.phaseLabel,
                    missionActive ? styles.phaseLabelDimmed : styles.phaseLabelActive,
                  ].join(' ')}
                >
                  <PFText as="span" typo="hl-sm" className={styles.phaseIndex}>
                    01
                  </PFText>
                  <span className={styles.phaseName}>{VISION_LABEL}</span>
                </p>
                <p
                  className={[
                    styles.phaseLabel,
                    missionActive ? styles.phaseLabelActive : styles.phaseLabelDimmed,
                  ].join(' ')}
                >
                  <PFText as="span" typo="hl-sm" className={styles.phaseIndex}>
                    02
                  </PFText>
                  <span className={styles.phaseName}>{MISSION_LABEL}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.contentPanel}>
          <div className={styles.contentSlides}>
            <div className={styles.contentSlide}>
              <div className={styles.inspiringBlocks}>
                <article className={styles.infoBlock}>
                  <PFText as="h2" typo="hd-md" color="black" className={styles.infoTitle}>
                    <Lines lines={hero.networkTitleLines} />
                  </PFText>
                  <PFText
                    as="p"
                    typo="hl-lg-md"
                    color="neutral-cool-700"
                    className={styles.infoDescription}
                  >
                    <Lines lines={hero.networkDescriptionLines} />
                  </PFText>
                </article>
                <article className={styles.infoBlock}>
                  <PFText as="h2" typo="hd-md" color="black" className={styles.infoTitle}>
                    <Lines lines={hero.experienceTitleLines} />
                  </PFText>
                  <PFText
                    as="p"
                    typo="hl-lg-md"
                    color="neutral-cool-700"
                    className={styles.infoDescription}
                  >
                    <Lines lines={hero.experienceDescriptionLines} />
                  </PFText>
                </article>
              </div>
            </div>
            <div className={styles.contentSlide}>
              <div className={styles.statementStack}>
                <article
                  className={[
                    styles.statement,
                    missionActive ? styles.statementDimmed : styles.statementActive,
                  ].join(' ')}
                >
                  <PFText
                    as="p"
                    typo="bd-lg-rg"
                    color="primary-600"
                    className={styles.statementEyebrow}
                  >
                    <Lines lines={hero.visionEyebrowLines} />
                  </PFText>
                  <PFText as="p" typo="hd-lg" color="black" className={styles.statementBody}>
                    <Lines lines={hero.visionBodyLines} />
                  </PFText>
                </article>
                <article
                  className={[
                    styles.statement,
                    missionActive ? styles.statementActive : styles.statementDimmed,
                  ].join(' ')}
                >
                  <PFText
                    as="p"
                    typo="bd-lg-rg"
                    color="primary-600"
                    className={styles.statementEyebrow}
                  >
                    <Lines lines={hero.missionEyebrowLines} />
                  </PFText>
                  <PFText as="p" typo="hd-lg" color="black" className={styles.statementBody}>
                    <Lines lines={hero.missionBodyLines} />
                  </PFText>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showArrow ? (
        <button
          type="button"
          className={styles.scrollArrow}
          onClick={onScrollArrowClick}
          aria-label="다음 화면으로 이동"
        >
          <img
            className={styles.scrollArrowIcon}
            src={HERO_ARROW_URL}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        </button>
      ) : null}
    </div>
  )
}
