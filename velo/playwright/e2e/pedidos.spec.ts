import { expect, test } from '../support/fixtures'
import { generateOrderCode } from '../support/helpers'
import type { OrderDetails } from '../support/actions/orderLockupActions'
import { insertOrder, deleteOrderByNumber } from '../../docs/database/orderRepository'
import pedidosScenarios from '../support/fixtures/pedidos.json' with { type: 'json' }

test.describe('Consulta de Pedido', () => {

  test.beforeEach(async ({ app }) => {
    await app.orderLockup.open()
  })

  for (const { title, order } of pedidosScenarios) {
    test(title, { tag: '@db' }, async ({ app }) => {
      const orderDetails = order as OrderDetails

      await deleteOrderByNumber(orderDetails.number)
      await insertOrder(orderDetails)

      await app.orderLockup.searchOrder(orderDetails.number)
      await app.orderLockup.validateOrderDetails(orderDetails)
      await app.orderLockup.validateStatusBadge(orderDetails.status)
    })
  }

  test('deve exibir mensagem quando o pedido não é encontrado', async ({ app }) => {
    const order = generateOrderCode()

    await app.orderLockup.searchOrder(order)
    await app.orderLockup.validateOrderNotFound()
  })

  test('deve exibir mensagem quando o código do pedido está fora do padrão', async ({ app }) => {
    const orderCode = 'XYZ-999-INVALIDO'

    await app.orderLockup.searchOrder(orderCode)
    await app.orderLockup.validateOrderNotFound()
  })

  test('deve manter o botão de busca desabilitado com campo vazio ou apenas espaços', async ({ app }) => {
    const button = app.orderLockup.elements.searchButton
    await expect(button).toBeDisabled()

    await app.orderLockup.elements.orderInput.fill('    ')
    await expect(button).toBeDisabled()
  })
})
