export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Pre-warm Clerk TCP+TLS connection for sign-up clicks */}
      <link rel="preconnect" href="https://clerk.ravenbase.app" />
      <link rel="preconnect" href="https://img.clerk.com" />
      {/* DNS-only prefetch for API (only hit after auth) */}
      <link rel="dns-prefetch" href="https://api.ravenbase.app" />
      {children}
    </>
  )
}
