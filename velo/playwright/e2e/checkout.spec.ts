import { test, expect } from '../support/fixtures'
import { deleteOrdersByCpf } from '../../docs/database/orderRepository'
import { mockCreditAnalysis } from '../support/mocks/mock.api'
import type { CheckoutCustomer, PaymentMethod, SuccessStatus } from '../support/actions/checkoutActions'
import creditScenarios from '../support/fixtures/checkoutCreditScenarios.json' with { type: 'json' }

type CreditScenario = {
  title: string
  customer: CheckoutCustomer & { paymentMethod: PaymentMethod }
  score: number
  expectedStatus: SuccessStatus
}

const DEFAULT_STORE = 'Velô Paulista'
const DEFAULT_TOTAL = 'R$ 40.000,00'

async function arrangeCheckoutFromLanding(
  app: { configurator: { configureDefaultAndGoToCheckout(totalPrice?: string): Promise<void> }; checkout: { expectLoaded(): Promise<void>; fillCustomerlData(data: Pick<CheckoutCustomer, 'name' | 'lastname' | 'email' | 'phone' | 'document'>): Promise<void>; selectStore(storeName: string): Promise<void> } },
  customer: CheckoutCustomer,
) {
  await deleteOrdersByCpf(customer.document)
  await app.configurator.configureDefaultAndGoToCheckout(customer.totalPrice ?? DEFAULT_TOTAL)
  await app.checkout.expectLoaded()
  await app.checkout.fillCustomerlData(customer)
  await app.checkout.selectStore(customer.store ?? DEFAULT_STORE)
}

test.describe('Checkout', () => {



  test.describe('Validações de campos obrigatórios', () => {

    let alerts: any

    test.beforeEach(async ({ page, app }) => {
      await page.goto('/order')
      await expect(page.getByRole('heading', { name: 'Finalizar Pedido' })).toBeVisible()

      alerts = app.checkout.elements.alerts
    })


    test('deve validar obrigatoriedade de todos os campos em branco', async ({ app }) => {
      // Act
      await app.checkout.submit()

      // Assert
      await expect(alerts.name).toHaveText('Nome deve ter pelo menos 2 caracteres')
      await expect(alerts.lastname).toHaveText('Sobrenome deve ter pelo menos 2 caracteres')
      await expect(alerts.email).toHaveText('Email inválido')
      await expect(alerts.phone).toHaveText('Telefone inválido')
      await expect(alerts.document).toHaveText('CPF inválido')
      await expect(alerts.store).toHaveText('Selecione uma loja')
      await expect(alerts.terms).toHaveText('Aceite os termos')
    })

    test('deve validar limite mínimo de caracteres para Nome e Sobrenome', async ({ app }) => {

      const customer = {
        name: 'A',
        lastname: 'B',
        email: 'papito@teste.com',
        document: '00000014141',
        phone: '(11) 99999-9999'
      }

      // Arrange
      await app.checkout.fillCustomerlData(customer)
      await app.checkout.selectStore('Velô Paulista')
      await app.checkout.acceptTerms()

      // Act
      await app.checkout.submit()

      // Assert
      await expect(alerts.name).toHaveText('Nome deve ter pelo menos 2 caracteres')
      await expect(alerts.lastname).toHaveText('Sobrenome deve ter pelo menos 2 caracteres')
    })

    test('deve exibir erro para e-mail com formato inválido', async ({ app }) => {
      const customer = {
        name: 'Fernando',
        lastname: 'Papito',
        email: 'papito@.com',
        document: '00000014141',
        phone: '(11) 99999-9999'
      }

      // Arrange
      await app.checkout.fillCustomerlData(customer)
      await app.checkout.selectStore('Velô Paulista')
      await app.checkout.acceptTerms()

      // Act
      await app.checkout.submit()

      // Assert
      await expect(alerts.email).toHaveText('Email inválido')
    })

    test('deve exibir erro para CPF inválido', async ({ app }) => {

      const customer = {
        name: 'Fernando',
        lastname: 'Papito',
        email: 'papito@test.com',
        document: '00000014199',
        phone: '(11) 99999-9999'
      }

      // Arrange
      await app.checkout.fillCustomerlData(customer)
      await app.checkout.selectStore('Velô Paulista')
      await app.checkout.acceptTerms()

      // Act
      await app.checkout.submit()

      // Assert
      await expect(alerts.document).toHaveText('CPF inválido')
    })

    test('deve exigir o aceite dos termos ao finalizar com dados válidos', async ({ app }) => {

      const customer = {
        name: 'Fernando',
        lastname: 'Papito',
        email: 'papito@test.com',
        document: '00000014199',
        phone: '(11) 99999-9999'
      }

      // Arrange
      await app.checkout.fillCustomerlData(customer)
      await app.checkout.selectStore('Velô Paulista')

      await expect(app.checkout.elements.terms).not.toBeChecked()

      // Act
      await app.checkout.submit()

      // Assert
      await expect(alerts.terms).toHaveText('Aceite os termos')
    })
  })

  test.describe('Pagamento e Confirmação', () => {

    test('deve criar um pedido com sucesso para pagamento à vista', async ({ app }) => {
      const customer = {
        name: 'Fernando',
        lastname: 'Papito',
        email: 'papito@teste.com',
        document: '05366127068',
        phone: '(11) 99999-9999',
        store: DEFAULT_STORE,
        paymentMethod: 'À Vista' as const,
        totalPrice: DEFAULT_TOTAL,
      }

      await arrangeCheckoutFromLanding(app, customer)
      await app.checkout.completePayment({
        method: customer.paymentMethod,
        expectTotal: customer.totalPrice,
      })
      await app.checkout.expectSuccessStatus('Pedido Aprovado!')
    })

    for (const { title, customer, score, expectedStatus } of creditScenarios as CreditScenario[]) {
      test(title, async ({ page, app }) => {
        await mockCreditAnalysis(page, score)
        await arrangeCheckoutFromLanding(app, customer)
        await app.checkout.completePayment({
          method: customer.paymentMethod,
          downPayment: customer.downPayment,
        })
        await app.checkout.expectSuccessStatus(expectedStatus)
      })
    }
  })
})
