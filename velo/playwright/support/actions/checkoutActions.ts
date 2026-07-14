import { Page, expect } from '@playwright/test'

export type PaymentMethod = 'À Vista' | 'Financiamento'

export type SuccessStatus = 'Pedido Aprovado!' | 'Pedido em Análise!' | 'Crédito Reprovado'

export type CheckoutCustomer = {
  name: string
  lastname: string
  email: string
  phone: string
  document: string
  store?: string
  paymentMethod?: PaymentMethod
  totalPrice?: string
  downPayment?: string
}

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

    async fillCustomerlData(data: Pick<CheckoutCustomer, 'name' | 'lastname' | 'email' | 'phone' | 'document'>) {
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

    async selectPaymentMethod(method: PaymentMethod | string) {
      await page.getByRole('button', { name: new RegExp(method, 'i') }).click()
    },

    async fillDownPayment(value: string) {
      await page.getByTestId('input-entry-value').fill(value)
    },

    async acceptTerms() {
      await terms.check()
    },

    async submit() {
      await page.getByRole('button', { name: 'Confirmar Pedido' }).click()
    },

    async completePayment(options: {
      method: PaymentMethod
      downPayment?: string
      expectTotal?: string
    }) {
      await this.selectPaymentMethod(options.method)

      if (options.downPayment) {
        await this.fillDownPayment(options.downPayment)
      }

      if (options.expectTotal) {
        await this.expectSummaryTotal(options.expectTotal)
      }

      await this.acceptTerms()
      await this.submit()
    },

    async expectSuccessStatus(status: SuccessStatus) {
      await expect(page).toHaveURL(/\/success/)
      await expect(page.getByTestId('success-status')).toHaveText(status)
    },
  }
}
