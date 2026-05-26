export function formatCreditBalance(value: number) {
  if (Number.isInteger(value) || Math.abs(value % 1) < 0.001) {
    return String(Math.round(value))
  }
  return value.toFixed(2)
}
