/** HTTP Basic credentials for /admin. Admin is disabled while ADMIN_PASSWORD is empty. */
export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD)
}

export function checkAdmin(authorization: string | null) {
  const password = process.env.ADMIN_PASSWORD
  if (!password || !authorization?.startsWith('Basic ')) return false
  const user = process.env.ADMIN_USER || 'house'
  let decoded = ''
  try {
    decoded = atob(authorization.slice(6))
  } catch {
    return false
  }
  const i = decoded.indexOf(':')
  const u = decoded.slice(0, i)
  const p = decoded.slice(i + 1)
  // constant-time-ish comparison
  const expected = `${user}:${password}`
  const given = `${u}:${p}`
  if (given.length !== expected.length) return false
  let diff = 0
  for (let k = 0; k < expected.length; k++) diff |= expected.charCodeAt(k) ^ given.charCodeAt(k)
  return diff === 0
}
