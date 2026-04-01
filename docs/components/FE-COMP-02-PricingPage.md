# PricingPage

> **Component ID:** FE-COMP-02
> **Epic:** EPIC-07 — Marketing Site
> **Stories:** STORY-022
> **Type:** Frontend (Marketing Site)

---

## Goal

The Pricing Page converts visitors to paid subscribers. It presents three clear pricing tiers (Free, Pro, Team) with transparent feature differentiation, an annual/monthly toggle showing savings, and a frictionless path to Stripe Checkout. It lives at `/pricing` in the marketing route group (light mode, no auth required).

---

## Product Requirements

1. **Three Pricing Tiers:**
   - **Free:** $0/mo — 500 credits/mo, 10 source uploads, 10 Meta-Docs/mo, 3 profiles, Haiku only
   - **Pro:** $15/mo ($12/mo annual = $144/yr) — 2,000 credits/mo, unlimited uploads/Meta-Docs, 20 profiles, Haiku + Sonnet
   - **Team:** $49/mo ($39/mo annual = $468/yr) — 6,000 shared credits, everything Pro + cross-user graph sharing (3 seats)

2. **Annual/Monthly Toggle:** Switches displayed prices. Annual shows savings: Pro saves $36/yr, Team saves $120/yr.

3. **Feature Comparison Table:** Below the cards: file size limits (50MB free / 200MB pro), credit caps, profile limits, model access (Haiku vs Haiku + Sonnet).

4. **"Get Pro" CTA:** Clicking Pro or Team CTA → Stripe Checkout session. Pre-fills user email from Clerk JWT. For unauthenticated visitors: redirects to `/register?redirect=/pricing` first.

5. **"Current plan" Badge:** Logged-in users see a badge on their active tier.

6. **Mobile Layout:** Cards stack vertically on < 768px.

7. **Stripe Checkout:** Backend creates `checkout.session` via `POST /v1/billing/create-checkout-session`. Returns pre-filled Stripe Checkout URL.

8. **Stripe Webhook:** `POST /webhooks/stripe` handles `checkout.session.completed` → updates `User.tier = "pro"`. Includes Redis idempotency key to prevent duplicate processing.

9. **Settings → Billing:** Pro users see "Manage Subscription" linking to Stripe Customer Portal.

10. **Post-Payment Redirect:** After successful payment → `/dashboard` with "Welcome to Pro!" toast.

---

## Criteria and Tests

| Criterion | Test |
|---|---|
| Pricing page renders 3 tiers | Navigate to /pricing → Free, Pro ($15), Team ($49) cards visible |
| Annual toggle changes prices | Toggle annual → Pro shows $12/mo, Team shows $39/mo |
| Feature table shows limits | File size, profiles, model access correctly listed |
| "Get Pro" creates Stripe session | Click "Get Pro" → backend returns Stripe Checkout URL |
| Webhook updates User.tier | Stripe test event → psql: SELECT tier FROM users WHERE id = X → 'pro' |
| Idempotency prevents double-charge | Same Stripe event ID sent twice → processed once |
| Settings → Billing shows for Pro | Log in as Pro → Settings shows Stripe Portal link |
| Annual savings displayed | Toggle annual → see "Save $36/yr" under Pro |
| Mobile stacks vertically | Resize to 375px → cards stack, no horizontal scroll |

---

## Related Stories

| Story | Title | Type | Description |
|---|---|---|---|
| [STORY-022](../stories/EPIC-07-marketing/STORY-022.md) | Pricing Page + Stripe Checkout | Cross-repo | Tiers, toggle, Stripe Checkout, webhook |

---

## Component Files

```
app/(marketing)/pricing/
  page.tsx             — Full pricing page
  loading.tsx          — Skeleton loading state

components/marketing/
  PricingToggle.tsx    — Monthly/annual toggle switch
  PricingCard.tsx      — Individual tier card
  PricingComparison.tsx — Feature comparison table
  StripeCheckoutButton.tsx — Handles checkout session creation

app/(dashboard)/settings/billing/
  page.tsx             — Stripe Customer Portal link for Pro users
```

## Pricing Display Pattern

```tsx
// PricingCard.tsx
interface PricingCardProps {
  name: string
  monthlyPrice: number
  annualPrice: number | null  // null = no annual option
  credits: number
  features: string[]
  cta: string
  isPopular?: boolean
  isCurrent?: boolean
}

export function PricingCard({ name, monthlyPrice, annualPrice, credits, features, cta, isPopular, isCurrent }: PricingCardProps) {
  const [annual, setAnnual] = useState(false)
  const displayPrice = annual && annualPrice ? annualPrice : monthlyPrice

  return (
    <div className={`
      relative bg-card rounded-2xl border p-8
      ${isPopular ? "border-primary border-2" : "border-border"}
    `}>
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
          Most Popular
        </span>
      )}
      {isCurrent && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-xs font-medium rounded-full">
          Current Plan
        </span>
      )}

      <h3 className="font-serif text-2xl">{name}</h3>
      <div className="mt-4">
        <span className="text-4xl font-bold">${displayPrice}</span>
        <span className="text-muted-foreground">/mo</span>
      </div>
      {annual && annualPrice && (
        <p className="text-xs text-primary mt-1">
          Save ${(monthlyPrice - annualPrice) * 12}/yr with annual
        </p>
      )}

      <p className="text-sm text-muted-foreground mt-2">{credits} credits/mo</p>

      <ul className="space-y-3 mt-6">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <Button
        className="w-full mt-8 rounded-full"
        variant={isPopular ? "default" : "outline"}
        size="lg"
      >
        {cta}
      </Button>
    </div>
  )
}
```

## Stripe Checkout Flow

```tsx
// StripeCheckoutButton.tsx
const handleCheckout = async () => {
  const { checkout_url } = await apiFetch<{ checkout_url: string }>(
    "/v1/billing/create-checkout-session",
    {
      method: "POST",
      body: JSON.stringify({
        tier: selectedTier,
        annual: isAnnual,
        // Clerk email pre-filled by backend using JWT
      }),
    }
  )
  window.location.href = checkout_url
}
```

## Webhook Idempotency

```python
# POST /webhooks/stripe idempotency pattern
idempotency_key = f"stripe:event:{event['id']}"
if await redis.exists(idempotency_key):
    return {"status": "already_processed"}  # 200, not 4xx

# ... process event ...

# Mark processed AFTER DB write succeeds
await redis.setex(idempotency_key, 86400, "1")  # 24h TTL
return {"status": "processed"}
```
