import Image from 'next/image'
import type { Product } from '@/lib/catalog'
import styles from './ProductImage.module.css'

/** A set keeps its three actual bottle photographs together, including in the bag. */
export default function ProductImage({ product, sizes = '120px' }: { product: Product; sizes?: string }) {
  const images = product.images ?? [product.image]
  return (
    <span className={`${styles.images} ${images.length > 1 ? styles.set : ''}`} role="img" aria-label={product.name}>
      {images.map((src) => (
        <span key={src} className={styles.frame}>
          <Image src={src} alt="" fill sizes={sizes} className={styles.photo} />
        </span>
      ))}
    </span>
  )
}
