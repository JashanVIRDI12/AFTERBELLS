import { deliveryNote } from '@/lib/content'
import styles from './ReserveNote.module.css'

/** The delivery promise, set quietly under every Add to bag button. */
export default function ReserveNote({ className = '', payments = false }: { className?: string; payments?: boolean }) {
  return (
    <p className={`${styles.note} ${className}`}>
      <span>{deliveryNote}</span>
      {payments && <span className={styles.pay}>Secure payment · UPI · RuPay · Visa · Mastercard</span>}
    </p>
  )
}
