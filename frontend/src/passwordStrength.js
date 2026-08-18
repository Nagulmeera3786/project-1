export function getPasswordRequirements(password) {
  const value = String(password || '');
  return {
    minLength: value.length >= 8,
    hasNumber: /\d/.test(value),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{}|;:'",.<>/?`~\\]/.test(value),
  };
}

export function isPasswordStrong(password) {
  const requirements = getPasswordRequirements(password);
  return requirements.minLength && requirements.hasNumber && requirements.hasSpecial;
}

export function getPasswordStrengthMessage(password) {
  const requirements = getPasswordRequirements(password);
  const missing = [];
  if (!requirements.minLength) {
    missing.push('at least 8 characters');
  }
  if (!requirements.hasNumber) {
    missing.push('one number');
  }
  if (!requirements.hasSpecial) {
    missing.push('one special character');
  }
  return missing.length ? `Password must contain ${missing.join(', ')}.` : '';
}
