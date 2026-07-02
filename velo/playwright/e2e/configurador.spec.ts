import { test } from '../support/fixtures'

test.describe('Configurador de Veículo', () => {
  test.beforeEach(async ({ app }) => {
    await app.configurator.openWithDefaultState()
  })

  test('não deve alterar o preço ao trocar a cor do veículo', async ({ app }) => {
    await app.configurator.selectExteriorColor('Midnight Black')
    await app.configurator.expectTotalPrice('R$ 40.000,00')
    await app.configurator.expectCarPreviewImage(/midnight-black-aero-wheels\.png/)
  })

  test('deve atualizar o preço e o preview ao alterar as rodas', async ({ app }) => {
    await app.configurator.selectWheels('Sport Wheels')
    await app.configurator.expectTotalPrice('R$ 42.000,00')
    await app.configurator.expectCarPreviewImage(/glacier-blue-sport-wheels\.png/)

    await app.configurator.selectWheels('Aero Wheels')
    await app.configurator.expectTotalPrice('R$ 40.000,00')
    await app.configurator.expectCarPreviewImage(/glacier-blue-aero-wheels\.png/)
  })

  test('CT03 - deve atualizar o preço ao selecionar opcionais e persistir no checkout', async ({ app }) => {
    await app.configurator.selectOptional('Precision Park')
    await app.configurator.expectTotalPrice('R$ 45.500,00')

    await app.configurator.selectOptional('Flux Capacitor')
    await app.configurator.expectTotalPrice('R$ 50.500,00')

    await app.configurator.deselectOptional('Precision Park')
    await app.configurator.deselectOptional('Flux Capacitor')
    await app.configurator.expectTotalPrice('R$ 40.000,00')

    await app.configurator.goToCheckout()
    await app.checkout.expectOnCheckoutPage()
    await app.checkout.expectSummaryTotal('R$ 40.000,00')
    await app.checkout.expectAvistaPrice('R$ 40.000,00')
  })
})
