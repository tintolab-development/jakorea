import { Fragment } from 'react'
import styles from './copy-break.module.css'

type CopyBreakProps = {
  pc?: boolean
  mobile?: boolean
}

/** 시안 줄바꿈 — PC/모바일 분기. 둘 다 true면 항상 개행. */
export function CopyBreak({ pc = false, mobile = false }: CopyBreakProps) {
  if (pc && mobile) return <br />
  if (pc) return <br className={styles.pc} />
  if (mobile) return <br className={styles.mobile} />
  return null
}

type CopyLinesProps = {
  pc: readonly string[]
  mobile: readonly string[]
}

function Lines({ lines }: { lines: readonly string[] }) {
  return (
    <>
      {lines.map((line, index) => (
        <Fragment key={`${index}-${line}`}>
          {index > 0 ? <br /> : null}
          {line}
        </Fragment>
      ))}
    </>
  )
}

/** PC/모바일 시안 줄바꿈이 다를 때 한 블록으로 렌더. 빈 문자열은 빈 줄. */
export function CopyLines({ pc, mobile }: CopyLinesProps) {
  const same = pc.length === mobile.length && pc.every((line, index) => line === mobile[index])

  if (same) return <Lines lines={pc} />

  return (
    <>
      <span className={styles.pcBlock}>
        <Lines lines={pc} />
      </span>
      <span className={styles.mobileBlock}>
        <Lines lines={mobile} />
      </span>
    </>
  )
}
