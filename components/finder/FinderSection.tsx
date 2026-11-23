import Corners from '@/components/ui/Corners'
import Finder from './Finder'
import styles from './FinderSection.module.css'

/** "Which one is yours?" on a page: the questions start at once, no click to begin. */
export default function FinderSection() {
  return (
    <section id="find-your-hour" className={styles.section} data-header="light" data-own-cta aria-labelledby="fyh-title">
      <div className={`wrap ${styles.inner}`}>
        <header className={styles.head}>
          <p className="t-eyebrow">Find your hour</p>
          <h2 id="fyh-title" className={`t-title ${styles.title}`}>
            Which one is <span className="gold-text">yours?</span>
          </h2>
          <p className={styles.lede}>Three questions. We match you to one of the three perfumes.</p>
        </header>
        <div className={`heritage ${styles.card}`}>
          <Corners />
          <Finder titleId="fyh-step" />
        </div>
      </div>
    </section>
  )
}
