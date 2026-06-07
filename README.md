# Apply Pilot

Apply Pilot is a Chrome extension that generates tailored cover letters from your resume and a job description. Upload a PDF resume, paste a job description, and the extension uses the browser’s built-in language model API to draft a concise, professional cover letter.

## Features

- Upload and parse a PDF resume
- Paste a job description directly into the side panel
- Generate a tailored cover letter in seconds
- Stream generated text as it is produced
- Render Markdown safely with sanitization
- Reset the current session and start over

## Tech Stack

- Chrome Extension Manifest V3
- Chrome Side Panel API
- Built-in browser `LanguageModel` API
- Bun
- `pdfjs-dist` for PDF text extraction
- `marked` for Markdown rendering
- `DOMPurify` for HTML sanitization

## Project Structure

```text
apply-pilot/
├── build.ts                 # Bun build script
├── extension/
│   ├── background.js        # Extension service worker
│   ├── content.js           # Content script placeholder
│   └── manifest.json        # Chrome extension manifest
├── images/                  # Extension icons/assets
├── sidepanel/
│   ├── index.html           # Side panel UI
│   ├── index.css            # Side panel styles
│   └── index.js             # App logic
├── package.json
└── README.md
