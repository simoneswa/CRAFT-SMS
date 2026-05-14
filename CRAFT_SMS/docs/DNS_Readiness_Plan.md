# CRAFT SMS - DNS Readiness Strategy
**Operational Roadmap for Public Domain Activation**

This document outlines the required DNS configuration for transitioning CRAFT SMS from local development to a live production environment.

## 1. Primary Domain Mapping (Root)
To enable the platform on your primary domain (e.g., `craftsms.com`), the following records must be configured in your DNS provider (e.g., Cloudflare, Namecheap, Route53).

| Record Type | Host | Value | Target |
|:--- |:--- |:--- |:--- |
| **A** | `@` | Vercel IP (76.76.21.21) | Main Platform |
| **CNAME** | `www` | `cname.vercel-dns.com` | Redirect to Root |

## 2. Multi-Tenant Subdomain Routing (Wildcard)
To support institutional tenants (e.g., `monrovia.craftsms.com`), wildcard resolution must be enabled.

| Record Type | Host | Value | Target |
|:--- |:--- |:--- |:--- |
| **CNAME** | `*` | `cname.vercel-dns.com` | Institutional Routing |

> [!IMPORTANT]
> Ensure your Vercel project is configured to accept wildcard domains. In Vercel Project Settings > Domains, add `*.craftsms.com`.

## 3. API & Backend Mapping
The backend services on Railway require a dedicated subdomain.

| Record Type | Host | Value | Target |
|:--- |:--- |:--- |:--- |
| **CNAME** | `api` | Railway App URL (e.g., `craft-backend.up.railway.app`) | API Linkage |

## 4. Security & Authentication (Supabase)
To ensure secure authentication and email delivery, Supabase requires domain verification.

| Record Type | Host | Value | Purpose |
|:--- |:--- |:--- |:--- |
| **TXT** | `supabase-verification` | [Provided by Supabase] | Auth Verification |
| **CNAME** | `auth` | `custom-auth.supabase.co` | Branded Auth URL |

## 5. SSL/TLS Termination
- **Root & Wildcards**: Vercel handles automated Let's Encrypt SSL issuance for the root and all subdomains mapped to the project.
- **Backend**: Railway provides automated TLS termination for the `api` subdomain.

## 6. Pre-Live Verification Checklist
1. [ ] Domain `craftsms.com` ownership verified.
2. [ ] TTL set to 3600 (1 hour) for propagation stability.
3. [ ] DNS provider confirms support for Wildcard CNAME records.
4. [ ] MX records (Email) verified as separate from Vercel/Railway logic.
