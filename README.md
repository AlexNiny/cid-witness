# CID Witness

CID Witness is a static Filecoin evidence composer built for **FilecoinTLDR Builder Challenge - Cycle 1**.

The app turns a Filecoin piece CID, deal id, provider id, client id, or IPFS CID into a readable evidence packet. It queries public Filecoin storage market data, calculates deal timing against the latest indexed height, checks IPFS gateway retrieval when possible, and generates a copyable showcase note.

## Live demo

Open `index.html` directly or serve the folder:

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

## Main mechanic

1. Paste a Filecoin piece CID, deal id, provider, client, or IPFS CID.
2. The app queries live Filecoin market data from `api.filecoin.tools`.
3. It reads network context from public Filecoin RPC when available.
4. It creates a concise report for a README, Loops House submission, or public X post.

## How it uses Filecoin

- Uses Filecoin Tools API to inspect public Filecoin storage market records.
- Shows piece CID, claim id, provider, client, term start, and remaining epochs.
- Uses public Filecoin RPC for network context when available.
- For IPFS CIDs, builds retrievability links through public gateways.

Filecoin is part of the product experience: the user is not just uploading a file to hidden storage. The app helps them understand and communicate the Filecoin evidence attached to a CID or deal.

## Tech

- HTML, CSS, and vanilla JavaScript
- No build step
- No wallet, API key, private key, or backend required

## Useful sample inputs

- Piece CID: `baga6ea4seaqgd4bohelctwubfgfmxsfcajhleg5ldsoat7n64q42ru4wlnrr6ka`
- Deal record: `164167877`
- Provider: `f03623016`
- IPFS CID: `bafybeigdyrzt5sfp7udm7hu76ocqg65gqpd5u7djepd3n5bubgm2esoszi`

## Challenge submission notes

See [docs/SUBMISSION.md](docs/SUBMISSION.md) for title, description, Filecoin usage explanation, and X post copy.
