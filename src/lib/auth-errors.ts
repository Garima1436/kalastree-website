export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Incorrect email or password.'
  if (m.includes('email not confirmed')) return 'Please confirm your email address before signing in.'
  if (m.includes('rate limit') || m.includes('too many requests')) {
    return 'Too many attempts. Please wait a bit before trying again.'
  }
  if (m.includes('user already registered')) return 'An account with this email already exists.'
  if (m.includes('password should be at least')) return message
  return message
}

export function isUnconfirmedEmailError(message: string): boolean {
  return message.toLowerCase().includes('email not confirmed')
}

export function isRateLimitError(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('rate limit') || m.includes('too many requests') || m.includes('security purposes')
}
