# 2026–2 Reitaku Engineering

Static course site for Thursdays, 4th period (15:00–16:40), beginning October 1, 2026. It uses plain HTML, CSS, JavaScript, and editable Markdown. No package installation or build step is needed.

## Edit the course

- `content/weeks/01.md` through `13.md` supply the agenda and homepage next-class card. Edit each file's `date`, English/Japanese titles and overviews, and optional sections. `guest_id` connects a week to its speaker profile.
- `content/guests/*.md` supply speaker names, roles, biographies, and optional images. Images live beside the Markdown. Speaker dates come from the corresponding weekly file.
- `assets/site.js` lists the weekly and guest filenames. Add a new file there if the schedule grows. The second final presentation date is still to be confirmed.
- Other pages are root-level HTML. Static Japanese copy uses `data-ja` attributes; English text is the element content.
- Add a verified resource in a week's `## Resources` section as `- [Title](https://example.org)`. It appears in that week. Add general resources to `resources.html`.
- Submission method, deadlines, assessment, and final project requirements are still pending. Add valid links only when these are confirmed.

All supplied Markdown is publicly readable on GitHub Pages. The `?planning=1` parameter on `agenda.html` opens every week for instructor review; it is not access control. Visitors can also open weeks themselves.

## Preview and publish

From this folder run `python3 -m http.server 8000`, then open `http://localhost:8000/`. Opening an HTML file directly with `file://` will not load its Markdown through `fetch`. Test desktop and phone widths. For GitHub Pages, publish the folder contents from the root of the `main` branch.

The included GitHub Actions workflow publishes the static site to GitHub Pages whenever `main` is updated. The `2025/` directory is archived reference material and is excluded from Git; it contains submissions and source files that are not part of the public site. Only the selected Week 1 materials copied into `assets/week01/` are published.
