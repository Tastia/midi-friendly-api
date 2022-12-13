import * as bcrypt from 'bcrypt';

/**
 * Hash password or any string
 * @param password
 */
export function hashPassword(password: string) {
  const hash = bcrypt.hashSync(password, 10);
  return hash;
}

export function comparePassword(password: string, encrypted: string): boolean {
  return bcrypt.compareSync(password, encrypted);
}
