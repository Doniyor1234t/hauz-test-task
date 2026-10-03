export function safeRedirect(
  path: string | null | undefined,
  fallback = '/',
): string {
  if (!path) {
    return fallback
  }

  // Must be a path beginning with exactly one slash.
  // Reject:
  //   //evil.example
  //   /\evil.example
  //   ///evil.example
  if (!/^\/(?![\\/])/.test(path)) {
    return fallback
  }

  // Defense in depth: don't allow backslashes anywhere.
  if (path.includes('\\')) {
    return fallback
  }

  // Only return an actual application path.
  return path
}