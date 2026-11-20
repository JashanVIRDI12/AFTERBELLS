'use client'

import { useActionState } from 'react'
import { signIn, type SignInState } from '@/app/account/actions'
import styles from './Account.module.css'

/** Email first, then the six-digit code. One form; the button pressed says which step. */
export default function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, { step: 'email' })

  return (
    <>
      <p className={styles.cardText}>
        {state.step === 'email' ? (
          'Enter your email and we will send you a six-digit code. No password needed.'
        ) : (
          <>
            We sent a code to <b>{state.email}</b>. It works for ten minutes.
          </>
        )}
      </p>

      <form action={action} className={styles.signForm}>
        <input type="hidden" name="next" value={next} />

        {state.step === 'email' ? (
          <>
            <div className="field">
              <label htmlFor="ac-email">Email</label>
              <input
                id="ac-email"
                name="email"
                type="email"
                className="input"
                autoComplete="email"
                defaultValue={state.email}
                aria-invalid={!!state.error}
                aria-describedby={state.error ? 'ac-error' : undefined}
                required
                autoFocus
              />
            </div>
            <button className="btn btn--gold btn--block" name="intent" value="send" disabled={pending}>
              {pending ? 'Sending…' : 'Send my code'}
            </button>
          </>
        ) : (
          <>
            <input type="hidden" name="email" value={state.email ?? ''} />
            {state.devCode && (
              <p className={styles.dev}>
                Development only: email could not be sent to this address, so here is the code: <b>{state.devCode}</b>
              </p>
            )}
            <div className="field">
              <label htmlFor="ac-code">Six-digit code</label>
              <input
                id="ac-code"
                name="code"
                className={`input ${styles.code}`}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                aria-invalid={!!state.error}
                aria-describedby={state.error ? 'ac-error' : undefined}
                required
                autoFocus
              />
            </div>
            <button className="btn btn--gold btn--block" name="intent" value="verify" disabled={pending}>
              {pending ? 'Checking…' : 'Sign in'}
            </button>
            <div className={styles.alt}>
              <button name="intent" value="resend" formNoValidate disabled={pending}>
                Send a new code
              </button>
              <button name="intent" value="restart" formNoValidate disabled={pending}>
                Use another email
              </button>
            </div>
          </>
        )}

        {state.error && (
          <p id="ac-error" className={styles.error} role="alert">
            {state.error}
          </p>
        )}
        {state.resent && !state.error && (
          <p className={styles.muted} role="status">
            A new code is on its way.
          </p>
        )}
      </form>
    </>
  )
}
