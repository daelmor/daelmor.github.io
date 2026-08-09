# Portfolio — David Elizondo

Work showcase archived from [theseusthread.com/showcase](https://theseusthread.com/showcase/),
saved as plain Markdown with all images alongside each article so it can be republished
anywhere (GitHub Pages, a static site generator, or read straight from GitHub).

Seven projects, 2017 → 2024. Each lives in `projects/<slug>/index.md` with its images in the
same folder and a YAML front-matter block carrying title, date, summary, hero image and the
original source URL.

## Projects

| Date | Project | Summary |
|---|---|---|
| 2024-12 | [n1co: FinTech App](projects/n1co-fintech-app/index.md) | Senior Software Architect — KYC, digital wallets, card issuing and cashback for the n1co app. |
| 2022-09 | [Hugo: Delivery Service](projects/hugo-delivery-service/index.md) | Senior Backend Engineer — order management, real-time dispatching and geo-based routing. |
| 2022-03 | [Hugo: FinTech Wallet App](projects/hugo-fintech-wallet-app/index.md) | Senior Backend Engineer — the HugoPay digital wallet for users, drivers and merchants. |
| 2021-09 | [Fegora: Digital Invoicing](projects/fegora-digital-invoicing/index.md) | Co-Founder & Software Architect — electronic invoicing connected to Guatemala's SAT. |
| 2021-05 | [Hugo: Payments Service](projects/hugo-payments-service/index.md) | Senior Backend Engineer — multi-country payments processing across the platform. |
| 2019-11 | [Nicetech: Heyy FinTech ecosystem](projects/nicetech-heyy-fintech-ecosystem/index.md) | Architectural lead — the Heyy/m1nt digital wallet ecosystem. |
| 2017-11 | [Tigo: SelfService Web Portal](projects/tigo-selfservice-web-portal/index.md) | Public website, eCommerce and customer portal for Tigo Guatemala. |

## Layout

```
projects/
  <slug>/
    index.md        article with YAML front matter
    *.png|jpg|webp|gif   images referenced as ./<file>
manifest.json       machine-readable index (slug, title, date, hero, image sources)
```

Image links are relative (`./file.png`) and resolve both on GitHub's Markdown viewer and
under GitHub Pages, so no rewriting is needed to publish.

## Front matter

```yaml
title: "n1co: FinTech App"
slug: n1co-fintech-app
date: 2024-12-30
author: "David Elizondo"
summary: "…"
hero: "./n1co_app_card.png"
source: "https://theseusthread.com/showcase/n1co-fintech-app/"
```

## Provenance

Archived 2026-08-08 from the Ghost site at theseusthread.com. Article bodies are converted
verbatim from the published HTML (headings, emphasis, lists and links preserved); Ghost
bookmark cards became Markdown links, and image URLs point at the full-size originals rather
than Ghost's resized copies. The source site is being retired — this repo is the surviving copy.
