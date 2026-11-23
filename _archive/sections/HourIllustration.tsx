import styles from './FindYourHour.module.css'

export type HourScene = 'dusk' | 'dawn' | 'midnight'

/** Original celestial engravings for the three hours; the accompanying copy describes each mood. */
export default function HourIllustration({ scene }: { scene: HourScene }) {
  const id = `after-bells-hour-${scene}`
  const night = scene === 'midnight'
  return (
    <svg className={styles.illustration} viewBox="0 0 400 300" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-metal`} x1="105" y1="52" x2="285" y2="244" gradientUnits="userSpaceOnUse">
          <stop stopColor={night ? '#F3E0AF' : scene === 'dawn' ? '#709399' : '#CBA55E'} />
          <stop offset=".5" stopColor={night ? '#C5A466' : scene === 'dawn' ? '#385F68' : '#9D6036'} />
          <stop offset="1" stopColor={night ? '#8F7041' : scene === 'dawn' ? '#8EA7A4' : '#D8B775'} />
        </linearGradient>
        <radialGradient id={`${id}-light`}>
          <stop stopColor={night ? '#D8B775' : scene === 'dawn' ? '#F7E8C4' : '#E8AF65'} stopOpacity=".5" />
          <stop offset="1" stopColor={night ? '#D8B775' : scene === 'dawn' ? '#F7E8C4' : '#E8AF65'} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-upper`}><path d="M48 15h304v156H48z" /></clipPath>
        <clipPath id={`${id}-circle`}><circle cx="200" cy="147" r="107" /></clipPath>
        <mask id={`${id}-moon`}>
          <circle cx="200" cy="144" r="48" fill="white" />
          <circle cx="221" cy="126" r="47" fill="black" />
        </mask>
      </defs>
      <circle cx="200" cy="147" r="116" fill={`url(#${id}-light)`} opacity={night ? '.16' : '.48'} />
      <g stroke="currentColor" className={styles.outerRing}>
        <circle cx="200" cy="147" r="130" strokeOpacity=".2" strokeWidth=".65" />
        <circle cx="200" cy="147" r="121" strokeOpacity=".42" strokeWidth=".65" />
        {Array.from({ length: 60 }, (_, i) => (
          <path key={i} d={`M200 ${i % 5 === 0 ? 18 : 21}v${i % 5 === 0 ? 7 : 3}`} transform={`rotate(${i * 6} 200 147)`} strokeWidth={i % 5 === 0 ? '.9' : '.5'} strokeOpacity={i % 5 === 0 ? '.65' : '.35'} />
        ))}
      </g>
      <circle cx="200" cy="147" r="107" stroke="currentColor" strokeOpacity=".4" strokeWidth=".7" />
      <path d="M48 147h12m280 0h12M200 0v8m0 278v12" stroke="currentColor" strokeOpacity=".45" strokeWidth=".7" />
      {scene === 'dusk' && (
        <g clipPath={`url(#${id}-circle)`}>
          <g className={styles.sun}>
            <circle cx="200" cy="137" r="48" fill={`url(#${id}-metal)`} />
            <circle cx="200" cy="137" r="55" stroke="currentColor" strokeOpacity=".55" strokeWidth=".6" />
            <g className={styles.rays} stroke="currentColor" strokeWidth=".65" strokeOpacity=".65">
              {Array.from({ length: 28 }, (_, i) => <path key={i} d={`M200 ${i % 2 ? 72 : 67}v${i % 2 ? -8 : -15}`} transform={`rotate(${i * (360 / 28)} 200 137)`} />)}
            </g>
          </g>
          <path d="M81 171h238v90H81z" fill="#EDDDC5" />
          <path d="M91 171h218" stroke="currentColor" strokeWidth=".8" />
          <g className={styles.landscape} stroke="currentColor" strokeWidth=".65" strokeOpacity=".63">
            <path d="M77 187c39-13 65-17 96-6s65 29 149-3" />
            <path d="M78 196c48-16 70-12 111 1s78 13 132-7" />
            <path d="M83 207c48-13 73-9 116 3s83 6 116-7" />
            <path d="M91 217c45-9 72-4 114 5s73 3 101-5" />
            <path d="M105 230c39-6 64-1 97 4s66 0 90-6" />
          </g>
        </g>
      )}
      {scene === 'dawn' && (
        <g clipPath={`url(#${id}-circle)`}>
          <g className={styles.sun} clipPath={`url(#${id}-upper)`}>
            <circle cx="200" cy="171" r="44" fill="#EBDDAB" />
            <circle cx="200" cy="171" r="51" stroke="currentColor" strokeOpacity=".48" strokeWidth=".6" />
            <g className={styles.rays} stroke="currentColor" strokeWidth=".75" strokeOpacity=".65">
              {Array.from({ length: 17 }, (_, i) => <path key={i} d={`M200 ${i % 2 ? 111 : 105}v${i % 2 ? -12 : -24}`} transform={`rotate(${-88 + i * 11} 200 171)`} />)}
            </g>
          </g>
          <path d="M90 171h220" stroke="currentColor" strokeWidth=".9" />
          <g className={styles.landscape} stroke="currentColor" strokeWidth=".7" strokeOpacity=".65">
            <path d="M74 189c67 0 88-11 134-6s57 9 121 2" />
            <path d="M79 202c62 0 90-12 132-8s59 9 111 2" />
            <path d="M86 215c54-1 85-12 126-9s56 7 102 2" />
            <path d="M101 228c46-2 74-11 109-9s49 5 90 2" />
          </g>
          <path d="m130 111 10-3 9 5m96-24 9-3 10 4" stroke="currentColor" strokeWidth=".8" strokeLinecap="round" />
        </g>
      )}
      {night && (
        <g clipPath={`url(#${id}-circle)`}>
          <circle className={styles.moon} cx="200" cy="144" r="48" fill={`url(#${id}-metal)`} mask={`url(#${id}-moon)`} />
          <path d="m111 151 25-56 40-17m64 29 34 32-17 53" stroke="currentColor" strokeWidth=".65" strokeOpacity=".35" />
          <g className={styles.stars} fill="currentColor">
            <path d="m136 88 1.7 5.3L143 95l-5.3 1.7-1.7 5.3-1.7-5.3L129 95l5.3-1.7z" />
            <path d="m246 98 1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" />
            <path d="m265 178 1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" />
            {[[175, 78], [111, 151], [274, 139], [146, 192], [222, 211], [194, 67], [286, 171]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" />)}
          </g>
          <g className={styles.landscape} stroke="currentColor" strokeWidth=".65" strokeOpacity=".4">
            <path d="M95 223c24-20 49-24 78-17s51 12 72 1 38-9 63 4" />
            <path d="M106 235c23-17 45-19 71-12s47 9 70 0 34-6 49 1" />
          </g>
        </g>
      )}
      <path d="m200 268 3 5-3 5-3-5z" fill="currentColor" />
      <path d="M164 273h23m26 0h23" stroke="currentColor" strokeWidth=".65" strokeOpacity=".5" />
    </svg>
  )
}
