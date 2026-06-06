import { cp, rm } from "node:fs/promises";

const root = import.meta.dir;
const dist = `${root}/dist`;

const { name: packageName } = await Bun.file(`${root}/package.json`).json();
const projectName = packageName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const buildDir = `${dist}/${projectName}`;

await rm(dist, { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: [`${root}/sidepanel/index.js`],
  outdir: `${buildDir}/sidepanel`,
  target: "browser",
  format: "esm",
  splitting: false,
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}

await cp(`${root}/sidepanel/index.html`, `${buildDir}/sidepanel/index.html`);
await cp(`${root}/sidepanel/index.css`, `${buildDir}/sidepanel/index.css`);
await cp(`${root}/extension`, buildDir, { recursive: true });
await cp(`${root}/images`, `${buildDir}/images`, { recursive: true });

await cp(
  `${root}/node_modules/pdfjs-dist/build/pdf.worker.mjs`,
  `${buildDir}/sidepanel/pdf.worker.mjs`,
);

const zipPath = `${dist}/${projectName}.zip`;

await rm(zipPath, { force: true });
await Bun.$`zip -r ${zipPath} .`.cwd(buildDir);

console.log(`Built unpacked extension: ${buildDir}`);
console.log(`Built Chrome Web Store zip: ${zipPath}`);
