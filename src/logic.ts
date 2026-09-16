export const MAX_ITEMS = 100
export const MAX_LABEL = 120
export function parseEntries(raw: string) {
  const lines = raw.split(/\r?\n/).map(line => line.trim().normalize('NFC')).filter(Boolean)
  const seen = new Set<string>(), items: string[] = [], duplicates: string[] = []
  for (const line of lines) {
    const key = line.toLocaleLowerCase('vi')
    if (seen.has(key)) duplicates.push(line)
    else { seen.add(key); items.push(line) }
  }
  const error = items.length > MAX_ITEMS ? `Tối đa ${MAX_ITEMS} lựa chọn cho mỗi danh sách.`
    : items.some(item => item.length > MAX_LABEL) ? `Mỗi lựa chọn tối đa ${MAX_LABEL} ký tự.` : ''
  return { items, duplicates, error }
}
// Rejection sampling avoids modulo bias for any supported pool size.
export function randomIndex(length: number, draw = () => crypto.getRandomValues(new Uint32Array(1))[0]) {
  if (!Number.isInteger(length) || length < 1 || length > MAX_ITEMS) throw new RangeError('Invalid pool size')
  const limit = Math.floor(0x100000000 / length) * length
  let value: number
  do { value = draw() } while (value >= limit)
  return value % length
}
export function availableEntries(items: string[], used: string[], noRepeat: boolean) {
  return noRepeat ? items.filter(item => !used.includes(item)) : items
}
export function centeredEntries(items: string[], center: string, radius = 2) {
  const at = Math.max(0, items.indexOf(center))
  return Array.from({ length: radius * 2 + 1 }, (_, i) => items[((at + i - radius) % items.length + items.length) % items.length])
}
export type Settings = { duration: number; sound: boolean; noRepeat: boolean }
export const defaultSettings: Settings = { duration: 5, sound: true, noRepeat: false }
export const STORAGE_KEY = 'spin-studio:v1'
export function loadSaved(): { raw: string; settings: Settings; used: string[] } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      raw: typeof saved.raw === 'string' ? saved.raw.slice(0, 15000) : '',
      settings: {
        duration: [3, 4, 5].includes(saved.settings?.duration) ? saved.settings.duration : 5,
        sound: typeof saved.settings?.sound === 'boolean' ? saved.settings.sound : defaultSettings.sound,
        noRepeat: saved.settings?.noRepeat === true,
      },
      used: Array.isArray(saved.used) ? saved.used.filter((x: unknown) => typeof x === 'string').slice(0, MAX_ITEMS) : [],
    }
  } catch { return { raw: '', settings: defaultSettings, used: [] } }
}
