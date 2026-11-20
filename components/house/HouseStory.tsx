import Link from 'next/link'
import styles from './HouseStory.module.css'

export default function HouseStory() {
  return (
    <section id="our-story" className={styles.story} data-header="light" aria-labelledby="house-story-heading">
      <div className={`wrap ${styles.layout}`}>
        <header className={styles.heading}>
          <p className={`t-eyebrow ${styles.kicker}`} data-reveal>The story of After Bells</p>
          <h2 id="house-story-heading" className={`t-title ${styles.title}`} data-reveal>
            The hour <span className="gold-text">is yours.</span>
          </h2>
          <span className={styles.rule} aria-hidden="true" />
        </header>
        <div className={styles.copy}>
          <p className={styles.opening} data-reveal>
            A familiar street at dusk. A conversation that runs past midnight. The first breath of a new day.
          </p>
          <p data-reveal>
            After Bells takes its name from the pause after the bells: when the noise settles and a moment begins
            to feel entirely your own. We compose for that change of rhythm.
          </p>
          <p data-reveal>
            Our First Edition gives it three expressions. Amber Hour holds the warmth of evening. Open Sky opens
            onto the clarity of dawn. Iron Crown brings the depth of midnight. Each is universal, made to be chosen
            by feeling.
          </p>
          <Link href="/collection" className={styles.link} data-reveal>
            Explore the First Edition <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
