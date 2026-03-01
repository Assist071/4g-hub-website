/**
 * Device token utility functions
 */

export function generateDeviceToken(): string {
  // Generate a random 64-character token
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getDeviceTokenFromStorage(): string | null {
  return localStorage.getItem('device_token');
}

export function saveDeviceTokenToStorage(token: string): void {
  localStorage.setItem('device_token', token);
}

export function removeDeviceTokenFromStorage(): void {
  localStorage.removeItem('device_token');
}

export function getDeviceNameFromStorage(): string | null {
  return localStorage.getItem('device_name');
}

export function saveDeviceNameToStorage(name: string): void {
  localStorage.setItem('device_name', name);
}
