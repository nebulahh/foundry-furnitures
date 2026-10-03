# Product Taste

## The Bar
The shop should feel curated rather than crowded. Every screen earns its space: useful discovery, convincing product detail, clear price, and an easy next step. Keep the visual warmth of the supplied reference, but give it more breathing room and a stronger editorial point of view.

## What Good Looks Like
- The first viewport signals the furniture brand immediately and shows a real room, a distinct headline, and one obvious shopping action.
- Product photography is the largest element in each product tile. Titles and prices are easy to scan; badges are rare and truthful.
- Category browsing, search, cart, and checkout work as actual flows, not decorative controls.
- Empty cart, unavailable configuration, submission errors, and success states are designed intentionally.
- Desktop feels like browsing a small design studio; mobile feels like the same shop, not a squeezed desktop.

## Avoid
- Generic ecommerce gradients, giant rounded cards, excessive pills, and an all-neutral page without a useful accent.
- Overloaded navigation, faux filters, dead buttons, fabricated reviews, and made-up payment assurances.
- Showing an order as confirmed before the database accepts it.
- Exposing Supabase service credentials, Mailgun keys, or OAuth secrets to browser code.
- Claiming payment has been collected: this product records an order request and does not integrate a payment processor.

## Quality Checks
- Test the storefront at desktop and narrow mobile widths.
- Verify add/remove/update cart behavior and persistence across refresh.
- Verify checkout validation and a clear failure path when backend configuration is absent.
- Verify that server-only credentials stay server-side and that customer order access is protected.
