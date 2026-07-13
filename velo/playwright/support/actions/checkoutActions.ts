import { Page, expect } from '@playwright/test'

export function createCheckoutActions(page: Page) {

  const terms = page.getByTestId('checkout-terms')

  const alerts = {
    name: page.getByTestId('error-name'),
    lastname: page.getByTestId('error-lastname'),
    email: page.getByTestId('error-email'),
    phone: page.getByTestId('error-phone'),
    document: page.getByTestId('error-document'),
    store: page.getByTestId('error-store'),
    terms: page.getByTestId('error-terms')
  }


  return {

    elements: {
      terms,
      alerts
    },

    async expectLoaded() {
      await expect(page.getByRole('heading', { name: 'Finalizar Pedido' })).toBeVisible()
    },

    async expectSummaryTotal(price: string) {
      await expect(page.getByTestId('summary-total-price')).toHaveText(price)
    },

    async fillCustomerlData(data: {
      name: string
      lastname: string
      email: string
      phone: string
      document: string
    }) {
      await page.getByTestId('checkout-name').fill(data.name)
      await page.getByTestId('checkout-lastname').fill(data.lastname)
      await page.getByTestId('checkout-email').fill(data.email)
      await page.getByTestId('checkout-phone').fill(data.phone)
      await page.getByTestId('checkout-document').fill(data.document)
    },

    async selectStore(storeName: string) {
      await page.getByTestId('checkout-store').click()
      await page.getByRole('option', { name: storeName }).click()
    },

    async acceptTerms() {
      await terms.check()
    },

    async selectPaymentAvista() {
      await page.getByTestId('payment-avista').click()
    },

    async expectPaymentAvistaTotal(price: string) {
      await expect(page.getByTestId('payment-avista')).toContainText(price)
    },

    async submit() {
      await page.getByRole('button', { name: 'Confirmar Pedido' }).click()
    },

    async expectSuccessApproved() {
      await expect(page).toHaveURL(/\/success/)
      await expect(page.getByTestId('success-status')).toHaveText('Pedido Aprovado!')
    },

    async expectOrderCustomer(data: {
      name: string
      lastname: string
      email: string
    }) {
      await expect(page.getByText(`${data.name} ${data.lastname}`)).toBeVisible()
      await expect(page.getByText(data.email)).toBeVisible()
    },

    async getOrderNumber(): Promise<string> {
      return page.getByTestId('order-id').innerText()
    },
  }
}