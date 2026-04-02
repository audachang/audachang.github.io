# Hugo Site — Erik Chang (ACL@NCU)

## What this is
This is a customized version of the [Pascal Michaillat Hugo Template](https://pascalmichaillat.org/hugo-website/), pre-filled with your information and sample content.

## Files you need to edit next
| File | What to change |
|------|----------------|
| `config.yml` | Update Google Scholar URL, add your real photo filename |
| `static/picture.jpeg` | Replace with your own photo (keep filename, or update config.yml) |
| `static/cv.pdf` | Replace with your current CV |
| `content/papers/paper1/index.md` | Replace with your real publications |
| `content/courses/course1/index.md` | Update with your actual syllabi |
| `content/location.md` | Verify office address |
| `content/officehours.md` | Update office hour schedule |

## How to launch locally (requires Hugo)
```bash
# Install Hugo: https://gohugo.io/installation/
# Then from this folder:
hugo server
# Open http://localhost:1313
```

## How to deploy on GitHub Pages
1. Create a new GitHub repo named `audachang.github.io`
2. Push this folder to that repo
3. Enable GitHub Pages in repo Settings → Pages → GitHub Actions
4. The included `.github/workflows/hugo.yml` handles automatic deployment

## Key design decisions made for you
- Navigation: Research / Teaching / Data & Tools / Lab Wiki
- Profile mode enabled: shows your photo and bio on the homepage
- Light theme with dark mode toggle enabled
- Lab wiki linked as external menu item (preserves your existing resource)
- Math rendering enabled (KaTeX)
