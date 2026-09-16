import { expect, test } from '@playwright/test'

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`waits the full selected duration with ${reducedMotion}, including the last choice`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion })
    await page.addInitScript(() => {
      localStorage.setItem('spin-studio:v1', JSON.stringify({
        raw: 'Một\nHai', settings: { duration: 3, sound: false, noRepeat: true }, used: [],
      }))
      const timings = { start: 0, elapsed: 0 }
      Object.assign(window, { spinTimings: timings })
      new MutationObserver(() => {
        if (document.querySelector('.is-spinning') && !timings.start) {
          timings.start = performance.now(); timings.elapsed = 0
        }
        if (document.querySelector('.winner-label') && timings.start) {
          timings.elapsed = performance.now() - timings.start; timings.start = 0
        }
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] })
    })
    await page.goto('/')
    await page.getByRole('button', { name: 'Tạo spinner' }).click()
    for (const duration of [3, 5]) {
      if (duration === 5) {
        await page.getByRole('button', { name: 'Cài đặt', exact: true }).click()
        await page.getByRole('radio', { name: '5s Hồi hộp' }).check()
        await page.getByRole('button', { name: 'Xong', exact: true }).click()
      }
      await page.getByRole('button', { name: duration === 3 ? 'QUAY' : 'QUAY LẠI', exact: true }).click()
      // A deliberate timed assertion: the regression returned a result after 200 ms.
      await page.waitForTimeout(1000)
      await expect(page.locator('.winner-label')).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'ĐANG QUAY', exact: true })).toBeDisabled()
      await expect(page.locator('.winner-label')).toBeVisible({ timeout: 6500 })
      const elapsed = await page.evaluate(() => (window as unknown as { spinTimings: { elapsed: number } }).spinTimings.elapsed)
      expect(elapsed).toBeGreaterThanOrEqual(duration * 1000 - 100)
      expect(elapsed).toBeLessThan(duration * 1000 + 1500)
    }
    await expect(page.getByRole('button', { name: 'Đặt lại lượt quay', exact: true })).toBeVisible()
  })
}
