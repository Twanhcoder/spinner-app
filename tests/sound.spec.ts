import { expect, test } from '@playwright/test'

test('spin generates audible ticks and a result chime; mute stays silent and persists', async ({ page }) => {
  await page.addInitScript(() => {
    const probe = { ticks: 0, chimes: 0, peak: 0 }
    Object.assign(window, { soundProbe: probe })
    const createOscillator = AudioContext.prototype.createOscillator
    AudioContext.prototype.createOscillator = function () {
      const oscillator = createOscillator.call(this)
      const start = oscillator.start.bind(oscillator)
      oscillator.start = (when?: number) => {
        if (oscillator.type === 'triangle') probe.ticks++
        if (oscillator.type === 'sine') probe.chimes++
        start(when)
      }
      return oscillator
    }
    const createGain = AudioContext.prototype.createGain
    AudioContext.prototype.createGain = function () {
      const gain = createGain.call(this), analyser = this.createAnalyser()
      gain.connect(analyser)
      const samples = new Float32Array(analyser.fftSize)
      const timer = setInterval(() => {
        analyser.getFloatTimeDomainData(samples)
        for (const sample of samples) probe.peak = Math.max(probe.peak, Math.abs(sample))
      }, 10)
      setTimeout(() => clearInterval(timer), 2000)
      return gain
    }
  })
  const readProbe = () => page.evaluate(() => (window as unknown as { soundProbe: { ticks: number; chimes: number; peak: number } }).soundProbe)
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Tắt âm thanh', exact: true })).toBeVisible()
  expect((await readProbe()).ticks).toBe(0)
  await page.getByLabel('Danh sách của bạn').fill('Một\nHai\nBa')
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click()
  await page.getByRole('radio', { name: '3s Nhanh' }).check()
  await page.getByRole('button', { name: 'Xong', exact: true }).click()
  await page.getByRole('button', { name: 'Tạo spinner' }).click()
  await page.getByRole('button', { name: 'QUAY', exact: true }).click()
  await expect(page.locator('.winner-label')).toBeVisible({ timeout: 7000 })
  await expect.poll(async () => (await readProbe()).peak).toBeGreaterThan(.01)
  const heard = await readProbe()
  expect(heard.ticks).toBeGreaterThan(5)
  expect(heard.chimes).toBe(3)
  await page.getByRole('button', { name: 'Tắt âm thanh', exact: true }).click()
  await page.getByRole('button', { name: 'QUAY LẠI', exact: true }).click()
  await expect(page.locator('.winner-label')).toBeVisible({ timeout: 7000 })
  const muted = await readProbe()
  expect(muted.ticks).toBe(heard.ticks)
  expect(muted.chimes).toBe(heard.chimes)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Bật âm thanh', exact: true })).toBeVisible()
})

test('unavailable audio does not prevent a result', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', { value: class { constructor() { throw new Error('Audio unavailable') } } })
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByLabel('Danh sách của bạn').fill('Một\nHai')
  await page.getByRole('button', { name: 'Tạo spinner' }).click()
  await page.getByRole('button', { name: 'QUAY', exact: true }).click()
  await expect(page.locator('.winner-label')).toBeVisible()
})
