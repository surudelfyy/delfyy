export function assertProdEnv(): void {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error(
        'NEXT_PUBLIC_APP_URL is required in production (e.g. https://askdelfyy.com)'
      )
    }
  }
}

