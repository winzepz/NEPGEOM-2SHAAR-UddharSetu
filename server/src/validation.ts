export function parseString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required.`)
  }

  return value.trim()
}

export function parseOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

export function parseNumber(value: unknown, field: string) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    throw new Error(`${field} must be a number.`)
  }

  return numberValue
}

export function parsePositiveInteger(value: unknown, field: string) {
  const numberValue = Number(value)

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${field} must be a positive integer.`)
  }

  return numberValue
}

export function parsePositiveNumber(value: unknown, field: string) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new Error(`${field} must be a positive number.`)
  }

  return numberValue
}

export function parseDate(value: unknown, field: string) {
  const dateString = parseString(value, field)
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} must be a valid date.`)
  }

  return dateString
}

export function parseOption<T extends string>(value: unknown, options: readonly T[], field = 'option') {
  if (typeof value !== 'string' || !options.includes(value as T)) {
    throw new Error(`${field} is invalid.`)
  }

  return value as T
}
