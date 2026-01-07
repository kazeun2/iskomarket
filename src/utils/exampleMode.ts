/**
 * Utility to determine if the current user should see example/mock data
 * Only example.cvsu.edu.ph and example.admin.cvsu.edu.ph accounts see example data
 * All other real CvSU emails see a fresh, empty platform
 */

export const EXAMPLE_ACCOUNTS = {
  normalUser: 'example@cvsu.edu.ph',
  adminUser: 'example.admin@cvsu.edu.ph',
};

export const EXAMPLE_PASSWORDS = {
  normalUser: 'example123',
  adminUser: 'exampleadmin123',
};

/**
 * Check if the user email is an example/testing account
 */
export function isExampleAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  return (
    normalizedEmail === EXAMPLE_ACCOUNTS.normalUser.toLowerCase() ||
    normalizedEmail === EXAMPLE_ACCOUNTS.adminUser.toLowerCase()
  );
}

/**
 * Check if the user should see example data
 * Returns true for example accounts, false for real users
 */
export function isExampleMode(user: any): boolean {
  if (!user || !user.email) return false;
  return isExampleAccount(user.email);
}

/**
 * Filter array data based on example mode
 * Returns data for example accounts, empty array for real users
 */
export function filterExampleData<T>(data: T[], user: any): T[] {
  return isExampleMode(user) ? data : [];
}

/**
 * Get value based on example mode
 * Returns defaultValue for example accounts, emptyValue for real users
 */
export function getExampleModeValue<T>(
  defaultValue: T,
  emptyValue: T,
  user: any
): T {
  return isExampleMode(user) ? defaultValue : emptyValue;
}