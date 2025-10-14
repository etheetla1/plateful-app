export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters
  return password.length >= 8;
}

export function isValidQuantity(quantity: number): boolean {
  return quantity > 0 && Number.isFinite(quantity);
}
