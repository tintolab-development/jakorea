/**
 * `\n`을 줄바꿈으로 그린다.
 * `breakClassName`을 주면 줄바꿈(<br>)에 클래스를 붙이고 뒤에 공백을 둔다 — CSS로 <br>을 숨기면
 * 단어 사이가 붙지 않고 자연 줄바꿈으로 바뀐다(줄 시작 공백은 브라우저가 지우므로 <br>이 보일 때는 영향 없음).
 */
export function renderMultilineText(text: string, breakClassName?: string) {
  return text.split('\n').map((line, index, lines) => (
    <span key={`${line}-${index}`}>
      {line}
      {index < lines.length - 1 ? (
        breakClassName ? (
          <>
            <br className={breakClassName} />{' '}
          </>
        ) : (
          <br />
        )
      ) : null}
    </span>
  ))
}
