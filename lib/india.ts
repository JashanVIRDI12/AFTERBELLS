export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const

const norm = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '')

/**
 * City and state for a six-digit PIN code, from the public postal directory at
 * api.postalpincode.in. Only the PIN is sent. Returns null on any failure, so the
 * guest simply types them.
 */
export async function lookupPin(pin: string): Promise<{ city: string; state: (typeof INDIAN_STATES)[number] | '' } | null> {
  if (!/^[1-9]\d{5}$/.test(pin)) return null
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 4000)
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: ctrl.signal })
    if (!res.ok) return null
    const data = (await res.json()) as { Status?: string; PostOffice?: { District?: string; State?: string }[] | null }[]
    const office = data?.[0]?.Status === 'Success' ? data[0].PostOffice?.[0] : undefined
    if (!office) return null
    const state = INDIAN_STATES.find((s) => norm(s) === norm(office.State ?? '')) ?? ''
    return { city: office.District ?? '', state }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
