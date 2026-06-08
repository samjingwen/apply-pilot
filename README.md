# Apply Pilot

Apply Pilot is a Chrome extension that generates tailored cover letters from a resume PDF and a job description. 

Upload your resume, paste a job description, and the extension uses Chrome’s built-in `LanguageModel` API to draft a concise, professional cover letter.

The generated letter streams into the side panel, can be edited after generation, copied to the clipboard, or exported as a PDF.

## Features

- Upload and parse a PDF resume
- Paste a job description directly into the Chrome side panel
- Generate a tailored cover letter using the browser’s built-in AI API
- Stream generated text as it is produced
- Edit the generated cover letter before using it
- Copy the response to the clipboard
- Export the response as `cover-letter.pdf`
- Reset the current session and start over

## Tech Stack

- Chrome Extension Manifest V3
- Chrome Side Panel API
- Chrome built-in `LanguageModel` API
- Bun
- `pdfjs-dist` for PDF text extraction
- `pdf-lib` for PDF export

## Project Structure

```text
apply-pilot/
├── build.ts                 # Bun build script
├── extension/
│   ├── background.js        # Extension service worker
│   ├── content.js           # Empty content script placeholder
│   └── manifest.json        # Chrome extension manifest
├── images/                  # Extension icons/assets
├── sidepanel/
│   ├── index.html           # Side panel UI
│   ├── index.css            # Side panel styles
│   ├── index.js             # App logic
│   └── pdf-util.js          # PDF export helper
├── package.json
└── README.md
```

## Requirements

- [Bun](https://bun.sh/)
- A Chromium-based browser that supports:
  - Chrome Extension Manifest V3
  - Chrome Side Panel API
  - The built-in `LanguageModel` API

> The `LanguageModel` API is browser-provided and may require a compatible Chrome version, origin trial, flag, or local AI availability depending on your environment.

## Installation

Install dependencies:

```sh
bun install
```

## Development

Build the extension:

```sh
bun run build
```

This creates:

```text
dist/
├── apply-pilot/      # Unpacked extension directory
└── apply-pilot.zip   # Chrome Web Store-ready zip
```

## Loading the Extension in Chrome

1. Run the build command:

   ```sh
   bun run build
   ```

2. Open Chrome and go to:

   ```text
   chrome://extensions
   ```

3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select:

   ```text
   dist/apply-pilot
   ```

6. Click the Apply Pilot extension icon to open the side panel.

## Usage

1. Click **Upload resume** and select a PDF resume.
2. Paste the job description into the text area.
3. Click **Run**.
4. Wait for the generated cover letter to stream into the response box.
5. Edit the response if needed.
6. Use the copy button to copy the letter, or the export button to download it as `cover-letter.pdf`.

## Build Output

The build script:

1. Removes the existing `dist/` directory.
2. Bundles `sidepanel/index.js` for the browser.
3. Copies side panel HTML and CSS.
4. Copies extension manifest and service worker files.
5. Copies image assets.
6. Copies the PDF.js worker file.
7. Creates an unpacked extension at `dist/apply-pilot`.
8. Creates a Chrome Web Store zip at `dist/apply-pilot.zip`.

## Permissions

The extension currently requests:

- `sidePanel` — opens the app in Chrome’s side panel.
- `clipboardWrite` — allows copying the generated cover letter to the clipboard.

## Privacy Notes

Apply Pilot reads the uploaded resume PDF locally in the browser and sends the extracted resume text and pasted job description to the browser’s built-in `LanguageModel` API.

No external API keys are used in this project. Data handling depends on the browser’s implementation of the built-in language model API.

## Scripts

```sh
bun run build
```

Builds the unpacked extension and zip package.
