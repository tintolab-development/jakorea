import styles from './consent-form.module.css'

export function ConsentInfoTable({
  headers,
  rows,
  emphasizedColumns = [],
}: {
  headers: readonly string[]
  rows: readonly (readonly string[])[]
  emphasizedColumns?: readonly number[]
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.infoTable}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={`${index}-${header}`}>
                <span className={styles.headerText}>{header}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} data-label={headers[cellIndex] ?? ''}>
                  <span
                    className={
                      emphasizedColumns.includes(cellIndex)
                        ? styles.cellTextEmphasized
                        : styles.cellText
                    }
                  >
                    {cell || '—'}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
