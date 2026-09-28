import { Fragment } from 'react'

/** API 개행을 한 줄로 합치지 않는다. 빈 줄도 유지한다. */
export function PreservedLines({ text }: { text: string }) {
  const lines = text.split('\n')
  return lines.map((line, index) => (
    <Fragment key={index}>
      {index > 0 ? <br /> : null}
      {line}
    </Fragment>
  ))
}
