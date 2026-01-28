export function deriveNameFromEmail(email: string): string {
  const [localPart] = (email || '').split('@');
  if (!localPart) return '';

  const base = localPart.split('+')[0];

  // strip .admin or _admin suffix
  const withoutAdmin = base.replace(/(\.admin|_admin)$/i, '');

  // replace separators with space
  const spaced = withoutAdmin.replace(/[._]+/g, ' ').trim();

  // collapse multiple spaces
  const normalized = spaced.replace(/\s+/g, ' ');

  // capitalize each word
  return normalized
    .split(' ')
    .filter(Boolean)
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export function getDisplayName(user: { name?: string | null; username?: string | null; display_name?: string | null; email?: string | null }): string {
  return user.display_name || user.name || user.username || deriveNameFromEmail(user.email || '') || '';
}
