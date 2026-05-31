# Documentation System Plan

Objective: Build an enterprise-grade documentation site using the existing CRAFT SMS design language and colors. The docs site will live in the repo under `docs/` and be deployed via the frontend (Next.js + MDX) or a dedicated docs site under `CRAFT_SMS/frontend/docs`.

Features:
- Sticky sidebar
- Search (Algolia or Lunr.js)
- Scrollspy
- Breadcrumbs
- MDX rendering for component-rich docs
- Copy code buttons and syntax highlighting (Shiki or Prism)
- Mobile drawer navigation and collapsible sections
- Smooth animations and scroll progress indicator

Tech choices:
- Use Next.js MDX (recommended) with `next-mdx-remote` or built-in MDX support in Next 15.
- Search: Algolia DocSearch (if public) or local Fuse/Lunr indexed at build time.
- Styling: reuse existing Tailwind + design tokens from the frontend to preserve branding.

Structure (suggested file layout):

- `CRAFT_SMS/frontend/docs/content/` — markdown/MDX content
- `CRAFT_SMS/frontend/docs/components/` — Doc layout components (Sidebar, Search, Breadcrumbs)
- `CRAFT_SMS/frontend/docs/pages/*` — top-level pages

Deployment:
- Serve docs as part of the main frontend under `/docs` path; leverage Firebase Hosting rewrites if separate.

Accessibility & Performance:
- Ensure headings and landmarks are semantic
- Keyboard navigable sidebar and search
- Lazy-load code samples and heavy components
