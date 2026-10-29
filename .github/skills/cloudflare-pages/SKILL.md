---
name: cloudflare-pages
description: "Prepare and publish a static website on Cloudflare Pages. Use for GitHub integration, Pages build settings, Wrangler deployments, or troubleshooting a Pages deploy."
---

# Deploy a static site to Cloudflare Pages

Use this workflow for the FORCA hangman game and similar static HTML/CSS/JavaScript sites.

## 1. Check the project

1. Inspect the repository status and preserve unrelated user changes.
2. Confirm that the deploy directory contains a top-level `index.html`.
3. Check that the HTML references existing CSS, JavaScript, and other local assets.
4. Identify whether the project uses a framework or build tool. Do not introduce one for a plain static site.
5. Run relevant syntax checks and tests before publishing.

## 2. Prefer Git integration

For this repository, prefer connecting the existing GitHub repository to Cloudflare Pages. The user must sign in to Cloudflare, authorize repository access, and select the repository in the dashboard.

For a static site whose `index.html` is in the repository root, use:

- Production branch: `main`
- Framework preset: `None` / no framework
- Build command: `exit 0`
- Build output directory: `.`

Cloudflare Pages then deploys the production branch and can automatically deploy later pushes. Do not push commits unless the user asks or confirms.

**Choose the deployment method carefully:** Cloudflare documents that a project created with Git integration cannot later be switched to Direct Upload. Keep the Git integration method if the project is being connected to GitHub.

## 3. Wrangler deployment

Use Wrangler only when the user explicitly requests a CLI deployment or the Git integration is unsuitable. Confirm the Cloudflare project and deployment method before publishing. Check the official Wrangler documentation for current commands, verify authentication without displaying secrets, and never request or expose API tokens. Do not create a Cloudflare project, upload files, or change account settings without approval.

## 4. Verify and report

After an approved deployment, verify the command or dashboard result and provide the deployed URL if available. If the user needs to finish a step in the Cloudflare dashboard, give the exact navigation and settings. Do not describe a pending deployment as successful.

## Official references

- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Cloudflare Pages for static HTML](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)
