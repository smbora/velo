import { Page } from '@playwright/test'

export async function searchOrder(page: Page, orderNumber: string) {
  await page.getByRole('textbox', { name: 'Número do Pedido' }).fill(orderNumber)
  await page.getByRole('button', { name: 'Buscar Pedido' }).click()
}

export function generateOrderCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    const randomLetters = Array.from(
      { length: 3 },
      () => letters[Math.floor(Math.random() * letters.length)]
    ).join('');
  
    const randomNumbers = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
  
    return `VLO-${randomLetters}${randomNumbers}`;
  }