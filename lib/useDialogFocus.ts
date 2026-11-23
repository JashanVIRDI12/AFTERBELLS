'use client'

import { useEffect, useRef, type RefObject } from 'react'

/** Contain keyboard focus, make the background inert, and restore the opener. */
export function useDialogFocus(open: boolean, root: RefObject<HTMLElement | null>, onClose: () => void) {
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    const dialog = root.current
    if (!open || !dialog) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const background: { element: HTMLElement; inert: boolean }[] = []
    let branch: HTMLElement = dialog
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          background.push({ element: sibling, inert: sibling.inert })
          sibling.inert = true
        }
      }
      if (branch.parentElement === document.body) break
      branch = branch.parentElement
    }
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), video[controls], [tabindex="0"]',
    )).filter((el) => !el.closest('[inert]') && el.getClientRects().length > 0)
    const first = () => focusable()[0] ?? dialog
    // a dialog may name where focus starts (e.g. its heading, so a pop-up does not open with a ring on its close button)
    const start = dialog.querySelector<HTMLElement>('[data-autofocus]') ?? first()
    start.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close.current()
      }
      if (e.key !== 'Tab') return
      const elements = focusable()
      const start = elements[0]
      const end = elements.at(-1)
      if (!start || !end) {
        e.preventDefault()
        dialog.focus()
      } else if (e.shiftKey && document.activeElement === start) {
        e.preventDefault()
        end.focus()
      } else if (!e.shiftKey && document.activeElement === end) {
        e.preventDefault()
        start.focus()
      }
    }
    const onFocus = (e: FocusEvent) => {
      if (e.target instanceof Node && !dialog.contains(e.target)) first().focus({ preventScroll: true })
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('focusin', onFocus)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('focusin', onFocus)
      for (const { element, inert } of background) element.inert = inert
      if (opener?.isConnected && !opener.closest('[inert]')) opener.focus({ preventScroll: true })
    }
  }, [open, root])
}
