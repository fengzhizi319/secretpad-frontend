# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| latest  | ✅        |

## Reporting a Vulnerability

If you believe you have found a security vulnerability in SecretPad Frontend, please
report it responsibly.

**Please do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

1. Email the maintainers or use GitHub Security Advisories: **Security → Advisories →
   Report a vulnerability**
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 7 days
- **Fix timeline**: Critical: 7 days, High: 14 days, Medium: 30 days

### Scope

The following are in scope:

- XSS (Cross-Site Scripting) in rendered components
- CSRF token bypass
- Sensitive data exposure in client-side state
- Insecure API communication (missing TLS/auth headers)
- Dependency vulnerabilities (CVE ≥ 7.0)

### Out of Scope

- Social engineering attacks
- Self-XSS requiring user to paste code into console
- Clickjacking on non-sensitive pages
