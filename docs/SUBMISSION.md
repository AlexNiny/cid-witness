# FilecoinTLDR Submission Pack

## Project title

CID Witness

## Short description

CID Witness turns Filecoin piece CIDs, deal IDs, providers, clients, and IPFS CIDs into live evidence packets. It helps builders and reviewers understand whether a CID has Filecoin storage market records, who stores it, when the term starts, and how to share the proof clearly.

## Main mechanic

The user enters a Filecoin or IPFS identifier. The app queries live Filecoin market data, renders the strongest evidence it can find, and generates a copyable public showcase note.

## How the app uses Filecoin

CID Witness uses the Filecoin stack as the core product loop:

- It queries Filecoin Tools for public storage market records.
- It surfaces Filecoin-native fields: piece CID, claim id, provider, client, term start, max term, and indexed height.
- It uses public Filecoin RPC for network context when available.
- It checks IPFS gateway retrieval for IPFS CIDs and places that beside Filecoin market evidence.

This is not hidden backend storage. The Filecoin data is the thing the user inspects, interprets, and shares.

## Live demo link

TBD after deployment.

## Repo link

TBD after repository creation.

## Public X post draft

Built CID Witness for @FilecoinTLDR Builder Challenge.

It turns a Filecoin piece CID, deal id, provider, client, or IPFS CID into a live evidence packet: storage market records, provider/client context, term status, retrieval links, and a copyable proof note.

Demo: TBD
Repo: TBD

Uses @Filecoin market data via public Filecoin APIs.

## Submission checklist

- [ ] Live demo link
- [ ] Repo link
- [ ] Screenshot or short demo video
- [ ] Public X post with demo link, screenshot/video, `@Filecoin`, and `@FilecoinTLDR`
- [ ] Loops House form submitted
