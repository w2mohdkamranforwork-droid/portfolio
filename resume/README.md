# resume/

The SYS_CHAT assistant answers from whatever resume sits in this folder. It runs
locally with no LLM and no API key: it finds the section of your resume that
matches the question and replies with it, so it never invents anything.

## Swapping your resume

1. Drop your file in here — `resume.pdf`, `resume.docx`, `resume.md`, or `resume.txt`.
2. That's it. The **most recently modified** supported file wins, so you can keep
   old versions alongside the current one without deleting them.

No code change, no restart: the loader re-reads the file whenever its timestamp
changes, so the next question uses the new content. (On Vercel, commit and push
the file — the folder ships with the deployment.)

## Formats

| Format         | Notes                                                              |
|----------------|--------------------------------------------------------------------|
| `.md` / `.txt` | Best results. Plain text, nothing to misparse.                     |
| `.docx`        | Text is extracted from `word/document.xml`.                        |
| `.pdf`         | Works for normal exported PDFs. A **scanned** PDF is just an image  |
|                | with no text layer — export `.md`/`.txt` instead.                  |
| `.json`        | Read as raw text.                                                  |

Headings are how questions get routed, so keep sections like `## Experience`,
`## Skills`, `## Projects` separated rather than one dense wall of text.

## Checking what's loaded

With the dev server running, open:

    http://localhost:3000/api/resume-status

It reports the active file, its timestamp, character count, the sections it
detected, and a short preview. If a section you expect is missing from that
list, give it its own heading line in the resume.
