import { site } from '@/lib/site'
import HideOn from './HideOn'
import styles from './ServiceBar.module.css'

/** Short enough for one line on a 320px phone */
const PROMISES = ['Complimentary delivery across India', site.delivery.fast, 'Three 2 ml vials with every order']

/**
 * The house's promises, set once above the header: all three in a row on wide screens, one at a
 * time on phones. Scrolls away with the page; the header (Header.tsx) slides up to take its place.
 */
export default function ServiceBar() {
  return (
    <HideOn prefix={['/checkout', '/admin']}>
      <aside id="service-bar" className={styles.bar} aria-label="With every order">
        <ul className={styles.list}>
          {PROMISES.map((t, i) => (
            <li key={t} style={{ '--i': i } as React.CSSProperties}>
              {t}
            </li>
          ))}
        </ul>
      </aside>
    </HideOn>
  )
}
