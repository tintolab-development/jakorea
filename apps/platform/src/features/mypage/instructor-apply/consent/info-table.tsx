import { PFText } from '@/shared/ui'
import styles from './consent-form.module.css'

export function ConsentInfoTable({
  headers,
  rows,
}: {
  headers: readonly string[]
  rows: readonly (readonly string[])[]
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.infoTable}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={`${index}-${header}`}>
                <PFText as="span" typo="bd-sm-md" color="black">
                  {header}
                </PFText>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>
                  <PFText as="span" typo="bd-sm-rg" color="black">
                    {cell || '—'}
                  </PFText>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
