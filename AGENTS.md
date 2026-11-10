<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep AI fidelity instructions and the summary instruction constant in the server-only AI helper so transcription, translation, and summary requests remain testable without exposing prompts in browser code.
- Select Nitro's Netlify preset only in the Netlify build environment; preserve the managed Lovable target and let Nitro generate server-function routing rather than adding a static SPA fallback.
- Use visible pending and retry states for public content requests, keeping server-rendering error HTML independent of JavaScript so failures do not leave an empty page.
