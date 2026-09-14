# SignalScout — TinyFish 3-Surface Market Intelligence Agent

SignalScout is a live-web decision engine built for the **Build With TinyFish Plugins** bounty. A user enters a market/product/topic and region; SignalScout discovers relevant sources, extracts evidence, then autonomously verifies the strongest source on the live website.

## Why TinyFish is fundamental
This is not a static demo or a search-and-summarize wrapper. Every successful analysis depends on three distinct TinyFish API surfaces:

1. **Search API** (`api.search.tinyfish.ai`) — live discovery for pricing, competitors and demand signals.
2. **Fetch API** (`api.fetch.tinyfish.ai`) — extracts evidence from URLs discovered at runtime.
3. **Agent API** (`agent.tinyfish.ai`) — autonomously inspects a discovered website for current offer, pricing, target customer, trust signals and a competitive opportunity.

## Run locally
Requires Node 18+ and a TinyFish API key.

```bash
export TINYFISH_API_KEY="your_key_here"
npm start
```

Open `http://localhost:3000`.

## Bounty scoring target
**3+ TinyFish endpoints / API surfaces → 200-point tier target.** Search, Fetch and Agent are functional parts of one user workflow.

## Demo flow
Try: `AI website builders` + `Pakistan`.

SignalScout will discover live sources, extract source-linked evidence, autonomously inspect the strongest source, and return verification findings in the dashboard.

## Safety
The Agent instruction is read-only: it must not purchase, sign in, or submit forms.

## Submission checklist
- [x] Public GitHub repository
- [x] Original end-to-end agentic use case
- [x] Live web interaction
- [x] TinyFish fundamental to workflow
- [x] 3 distinct TinyFish API surfaces
- [x] Responsive demo UI
- [ ] Add `TINYFISH_API_KEY` to deployment environment
- [ ] Deploy public demo URL
- [ ] Record short demo video
