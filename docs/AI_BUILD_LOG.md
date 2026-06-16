# AI Build Log

## Goal

Build a small, working, Filecoin-powered prototype for FilecoinTLDR Builder Challenge - Cycle 1.

## AI-assisted process

1. Read the challenge page and extracted submission rules: project title, short description, live demo link, repo link, Filecoin usage explanation, AI build log, and public X post.
2. Compared possible directions from the challenge prompt starters. Rejected a fake upload flow because it would require an API key or backend to be honest.
3. Chose a proof-oriented mechanic: turn Filecoin identifiers into a live evidence packet using public Filecoin market data.
4. Implemented a static app with no dependencies so it can deploy easily and run locally.
5. Added live Filecoin Tools API calls, optional Filecoin RPC network context, IPFS gateway checks, status calculation, and copyable report generation.
6. Added README, product/design context, and submission copy.

## Debugging notes

- The WeChat article URL required verification, so the challenge rules were recovered from the public Loops House event page and embedded page data.
- Direct Filecoin RPC chain-head requests can be inconsistent across public gateways, so the app treats RPC network context as optional and relies on Filecoin Tools for stable market data.
- Browser CORS support was checked before choosing `api.filecoin.tools` as the primary source.
