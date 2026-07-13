import { test } from '../support/fixtures'

test.describe('Configuração do Veículo', () => {
  test.beforeEach(async ({ app }) => {
    await app.configurator.openWithDefaultState()
  })

  test('deve atualizar a imagem e manter o preço base ao trocar a cor do veículo', async ({ app }) => {
    await app.configurator.expectTotalPrice('R$ 40.000,00')

    await app.configurator.selectExteriorColor('Midnight Black')
    await app.configurator.expectTotalPrice('R$ 40.000,00')
    await app.configurator.expectCarPreviewImage('/src/assets/midnight-black-aero-wheels.png')
  })

  test('deve atualizar o preço e a imagem ao alterar as rodas, e restaurar os valores padrão', async ({ app }) => {
    await app.configurator.expectTotalPrice('R$ 40.000,00')

    await app.configurator.selectWheels('Sport Wheels')
    await app.configurator.expectTotalPrice('R$ 42.000,00')
    await app.configurator.expectCarPreviewImage('/src/assets/glacier-blue-sport-wheels.png')

    await app.configurator.selectWheels('Aero Wheels')
    await app.configurator.expectTotalPrice('R$ 40.000,00')
    await app.configurator.expectCarPreviewImage('/src/assets/glacier-blue-aero-wheels.png')
  })

  test('deve atualizar o preço com opcionais e persistir no checkout', async ({ app }) => {
    await app.configurator.expectTotalPrice('R$ 40.000,00')

    await app.configurator.selectOptional('Precision Park')
    await app.configurator.expectTotalPrice('R$ 45.500,00')

    await app.configurator.selectOptional('Flux Capacitor')
    await app.configurator.expectTotalPrice('R$ 50.500,00')

    await app.configurator.deselectOptional('Precision Park')
    await app.configurator.deselectOptional('Flux Capacitor')
    await app.configurator.expectTotalPrice('R$ 40.000,00')

    await app.configurator.goToCheckout()
    await app.checkout.expectLoaded()
    await app.checkout.expectSummaryTotal('R$ 40.000,00')
  })
})
