/**
 * Password Validation - Ensures strong password requirements
 */

export interface PasswordStrength {
  score: number; // 0-4
  message: string;
  isStrong: boolean;
  requirements: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    specialChars: boolean;
  };
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    specialChars: /[!@#$%^&*()_\-+=\[\]{};:'",.<>?/\\|`]/.test(password),
  };

  const passedRequirements = Object.values(requirements).filter(Boolean).length;
  let score: number;
  let message: string;

  if (passedRequirements === 5) {
    score = 4;
    message = 'Very Strong Password';
  } else if (passedRequirements === 4) {
    score = 3;
    message = 'Strong Password';
  } else if (passedRequirements === 3) {
    score = 2;
    message = 'Moderate Password';
  } else if (passedRequirements >= 1) {
    score = 1;
    message = 'Weak Password';
  } else {
    score = 0;
    message = 'Very Weak Password';
  }

  return {
    score,
    message,
    isStrong: score >= 3, // Require at least 3 requirements
    requirements,
  };
}

/**
 * Get password requirement errors
 */
export function getPasswordRequirementErrors(password: string): string[] {
  const errors: string[] = [];
  const strength = validatePasswordStrength(password);
  const { requirements } = strength;

  if (!requirements.minLength) {
    errors.push('Password must be at least 12 characters long');
  }
  if (!requirements.uppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!requirements.lowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!requirements.numbers) {
    errors.push('Password must contain at least one number');
  }
  if (!requirements.specialChars) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return errors;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if password has been compromised (basic check for common passwords)
 */
const COMMON_PASSWORDS = [
  'password',
  'admin123',
  'password123',
  '12345678',
  'qwerty',
  'admin',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
];

export function isCommonPassword(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  return COMMON_PASSWORDS.some((common) => lowerPassword.includes(common));
}

/**
 * Generate password suggestion
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_-+=[]{}|;:,.<>?';
  const all = uppercase + lowercase + numbers + special;

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
