import { Page, expect } from '@playwright/test'

export function createCheckoutActions(page: Page) {
  const heading = page.getByRole('heading', { name: 'Finalizar Pedido' })
  const summaryTotal = page.getByText('Total', { exact: true }).locator('..').getByText(/^R\$/)
  const avistaButton = page.getByRole('button', { name: /À Vista R\$/ })

  return {
    elements: {
      heading,
      summaryTotal,
      avistaButton,
    },

    async expectOnCheckoutPage() {
      await expect(page).toHaveURL('/order')
      await expect(heading).toBeVisible()
    },

    async expectSummaryTotal(price: string) {
      await expect(summaryTotal).toHaveText(price)
    },

    async expectAvistaPrice(price: string) {
      await expect(avistaButton).toBeVisible()
      await expect(avistaButton).toContainText('À Vista')
      await expect(avistaButton).toContainText(price)
    },
  }
}
