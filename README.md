# Mranmay Shetty

Academic portfolio at [mranmay.github.io](https://mranmay.github.io). Astro generates static pages, including the research index, CV, publications, and blog. Use the existing GitHub Pages workflow to deploy by merging into `main`.

## Develop

Use Node 20.19 or later. Install the locked dependencies with `npm ci`, run `npm run dev` for a local preview, and run `npm run build` to generate `dist/`.

## Add a post on GitHub

1. Under `src/content/blog/`, create `my-post.md`. The filename becomes `/blog/my-post/`.
2. Start with the frontmatter below. Dates use YYYY-MM-DD. Add ordinary Markdown below it.
3. Upload images to `public/images/posts/my-post/`. Reference their public paths and describe each image for readers using a screen reader.
4. Commit the post and its images on a branch, then merge the pull request. The blog index, latest writing, RSS feed, and sitemap are generated automatically.

```md
---
title: "A title for the post"
description: "One sentence about the question the post explores."
pubDate: 2026-11-23
author: "Mranmay Shetty"
tags: [neuroscience]
---

Write the post here.

![Description of the plotted result](/images/posts/my-post/figure.webp)
```

For a caption, use `<figure><img src="/images/posts/my-post/figure.webp" alt="Description of the plot" loading="lazy" /><figcaption>What to notice in the figure.</figcaption></figure>`. Optional frontmatter fields are `updatedDate`, `heroImage`, and `heroImageAlt`. Use `$…$` for inline math and `$$` on its own lines for display equations.

For an interactive figure, use a `.mdx` extension, import an Astro component below the frontmatter, and insert it in the text. The existing dynamical-systems post demonstrates this with `RecoveryFigure.astro`.

## Update the portfolio

Edit project descriptions in `src/data/projects.ts`, the homepage introduction in `src/components/Hero.astro`, the biography in `src/pages/about.astro`, and CV or publication entries in their respective `src/pages/` files.
