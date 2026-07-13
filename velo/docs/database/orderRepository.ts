import crypto from 'crypto'
import { db } from './database'
import type { OrderTable } from './schema'
import type { OrderDetails } from '../../playwright/support/actions/orderLockupActions'

export function normalizeValue(value: string) {
  if (!value) return ''

  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

function toColorSlug(color: string): OrderTable['color'] {
  return color.trim().toLowerCase().replace(/\s+/g, '-')
}

function toWheelType(wheels: string): OrderTable['wheel_type'] {
  return wheels.split(' ')[0].toLowerCase()
}

export async function insertOrder(order: OrderDetails) {
  const data: OrderTable = {
    id: crypto.randomUUID(),
    order_number: order.number,
    color: toColorSlug(order.color),
    wheel_type: toWheelType(order.wheels),
    customer_name: order.customer.name,
    customer_email: order.customer.email,
    customer_phone: order.customer.phone,
    customer_cpf: order.customer.document,
    payment_method: normalizeValue(order.payment),
    total_price: order.total_price,
    status: order.status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    optionals: [],
  }

  await db.insertInto('orders').values(data).execute()
}

export async function deleteOrderByNumber(orderNumber: string) {
  await db.deleteFrom('orders').where('order_number', '=', orderNumber).execute()
}

function toMaskedCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export async function deleteOrdersByCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, '')
  const masked = toMaskedCpf(digits)

  await db
    .deleteFrom('orders')
    .where((eb) =>
      eb.or([
        eb('customer_cpf', '=', cpf),
        eb('customer_cpf', '=', digits),
        eb('customer_cpf', '=', masked),
      ]),
    )
    .execute()
}
