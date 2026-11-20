import styles from './HourDial.module.css'

/** A tiny clock face set to the fragrance's hour. Hands sweep in when an ancestor gets `.is-in`. */
export default function HourDial({ time, className = '' }: { time: string; className?: string }) {
  const [h, m] = time.split(':').map(Number)
  const hourDeg = ((h % 12) + m / 60) * 30
  const minDeg = m * 6
  return (
    <svg
      className={`${styles.dial} ${className}`}
      viewBox="0 0 40 40"
      role="img"
      aria-label={`${time}`}
      style={{ '--h': `${hourDeg + 360}deg`, '--m': `${minDeg + 720}deg` } as React.CSSProperties}
    >
      <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeOpacity=".45" />
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1="20"
          y1={i % 3 === 0 ? 3.6 : 4.4}
          x2="20"
          y2="6"
          stroke="currentColor"
          strokeOpacity={i % 3 === 0 ? 0.9 : 0.45}
          strokeWidth={i % 3 === 0 ? 1 : 0.6}
          transform={`rotate(${i * 30} 20 20)`}
        />
      ))}
      <line className={styles.hour} x1="20" y1="20" x2="20" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line className={styles.min} x1="20" y1="20" x2="20" y2="7.5" stroke="currentColor" strokeWidth=".8" strokeLinecap="round" />
      <circle cx="20" cy="20" r="1.4" fill="currentColor" />
    </svg>
  )
}
