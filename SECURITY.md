# Security Policy

## Supported versions

This project is under active development and does not yet provide LTS
releases. Only the latest commit on `master` receives security fixes.

| Version | Supported |
|---------|-----------|
| `master` | Yes       |
| Older tags | No     |

> Note: the repository currently has no tagged releases. Once releases are cut,
> this table will list the supported release lines.

## Reporting a vulnerability

Please do **not** open a public issue for security problems.

To report a vulnerability privately:

1. Open a private vulnerability report on GitHub by navigating to the
   repository's **Security** tab and choosing **Report a vulnerability**, or
2. Email the maintainers at hoce1n@users.noreply.github.com.

When you report, please include:

- The affected file or endpoint and the version you tested
- A description of the vulnerability and its impact
- Steps to reproduce, including any proof-of-concept you have
- Your suggested fix, if you have one

You should receive an acknowledgement within a few days. We will keep you
informed as the issue is triaged and fixed. Please avoid disclosing the issue
publicly until a fix is released.

## Security considerations in this project

- All mutations are server actions that re-check membership and role server-side.
- File uploads are restricted by a MIME allowlist and a 5 MB size cap, and are
  stored outside `public`.
- Session and cookie handling is delegated to Better Auth.
- Environment secrets (`BETTER_AUTH_SECRET`, OAuth credentials) must be
  provided through environment variables; the repo only ships `.env.example`
  placeholders.

If you find a place where any of these guarantees are not upheld, please report
it using the process above.
