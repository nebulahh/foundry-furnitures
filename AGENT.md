# Build Instructions

These instructions apply to the FurniLux product build. Read `style.md`, `taste.md`, `architecture.md`, and `prd.md` before changing product behavior or visual design.

## Product Rules
- Follow the visual and interaction direction in `style.md` and `taste.md`; retain accessible, responsive behavior.
- Implement working storefront, cart, and checkout flows. Do not leave visible controls inert.
- Checkout creates a pending order only after server-side validation and database persistence succeed. Do not represent an order as paid.
- Never return privileged keys or secrets to the browser. Validate all submitted product IDs, quantities, and contact fields on the server.
- If backend environment variables are missing, show a useful setup/error state. Never silently claim persistence or email succeeded.
- Keep documentation and the SQL schema aligned with implemented behavior.

## Engineering Rules
- Use Next.js App Router with TypeScript, React, and CSS Modules or the existing project-wide CSS approach.
- Use Supabase Auth for Google OAuth and Supabase Postgres for catalog, profiles, and orders.
- Use Mailgun only from server-side code for order confirmation emails. Email delivery failure must not undo a persisted order.
- Keep components small and domain-oriented; do not add dependencies for simple UI behavior.
- Prefer semantic HTML, accessible labels, keyboard support, and reduced-motion support.
- Avoid changing unrelated files or adding fake integrations. Document any integration requiring external credentials.

## Completion Checks
- Run the production build and resolve errors introduced by the change.
- Exercise storefront, cart persistence, checkout validation, and success/error feedback when possible.
- Report required Google Cloud, Supabase, and Mailgun setup that cannot be completed without the owner's credentials.
