import { Locator, Page, expect } from '@playwright/test'

export type ExteriorColor = 'Glacier Blue' | 'Midnight Black' | 'Lunar White'
export type WheelOption = 'Aero Wheels' | 'Sport Wheels'
export type OptionalFeature = 'Precision Park' | 'Flux Capacitor'
export type WheelType = 'aero' | 'sport'

function resolveOptional(page: Page, optional: OptionalFeature): Locator {
  const optionals: Record<OptionalFeature, Locator> = {
    'Precision Park': page.getByRole('checkbox', { name: /Precision Park/ }),
    'Flux Capacitor': page.getByRole('checkbox', { name: /Flux Capacitor/ }),
  }

  return optionals[optional]
}

export function createConfiguratorActions(page: Page) {
  const totalPrice = page.getByText('Preço de Venda').locator('..').getByText(/^R\$/)
  const carPreview = page.getByRole('img', { name: /Velô Sprint - .+ with .+ wheels/ })
  const precisionPark = resolveOptional(page, 'Precision Park')
  const fluxCapacitor = resolveOptional(page, 'Flux Capacitor')
  const checkoutButton = page.getByRole('button', { name: 'Monte o Seu' })

  return {
    elements: {
      totalPrice,
      carPreview,
      precisionPark,
      fluxCapacitor,
      checkoutButton,
    },

    async openWithDefaultState() {
      await page.goto('/')
      await page.evaluate(() => localStorage.removeItem('velo-configurator-storage'))
      await page.goto('/configure')

      await expect(page.getByRole('heading', { name: 'Velô Sprint' })).toBeVisible()
      await this.expectDefaultConfiguration()
    },

    async selectExteriorColor(color: ExteriorColor) {
      await page.getByRole('button', { name: color }).click()
    },

    async selectWheels(wheels: WheelOption) {
      await page.getByRole('button', { name: new RegExp(wheels) }).click()
    },

    async toggleOptional(optional: OptionalFeature) {
      await resolveOptional(page, optional).click()
    },

    async selectOptional(optional: OptionalFeature) {
      await resolveOptional(page, optional).check()
    },

    async deselectOptional(optional: OptionalFeature) {
      await resolveOptional(page, optional).uncheck()
    },

    async goToCheckout() {
      await checkoutButton.click()
    },

    async expectTotalPrice(price: string) {
      await expect(totalPrice).toHaveText(price)
    },

    async expectDefaultConfiguration() {
      await expect(totalPrice).toHaveText('R$ 40.000,00')
      await expect(carPreview).toHaveAttribute('alt', /with aero wheels/)
      await expect(precisionPark).not.toBeChecked()
      await expect(fluxCapacitor).not.toBeChecked()
    },

    async expectOptionalChecked(optional: OptionalFeature, checked: boolean) {
      const checkbox = resolveOptional(page, optional)

      if (checked) {
        await expect(checkbox).toBeChecked()
      } else {
        await expect(checkbox).not.toBeChecked()
      }
    },

    async expectCarPreview(colorSlug: string, wheelType: WheelType) {
      await expect(carPreview).toHaveAttribute(
        'alt',
        `Velô Sprint - ${colorSlug} with ${wheelType} wheels`,
      )
    },

    async expectCarPreviewImage(filename: RegExp | string) {
      await expect(carPreview).toHaveAttribute('src', filename)
    },
  }
}
