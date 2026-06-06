import * as pdfjsLib from "pdfjs-dist";
import DOMPurify from "dompurify";
import { marked } from "marked";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "./pdf.worker.mjs",
  import.meta.url,
).toString();

const inputPrompt = document.body.querySelector("#input-prompt");
const buttonPrompt = document.body.querySelector("#button-prompt");
const buttonReset = document.body.querySelector("#button-reset");

const elementResponse = document.body.querySelector("#response");
const elementLoading = document.body.querySelector("#loading");
const elementError = document.body.querySelector("#error");

const fileUpload = document.body.querySelector("#file-upload");
const fileName = document.body.querySelector("#file-name");

let session;
let pdfText;

async function extractPDFText(file) {
  try {
    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let text = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(" ") + "\n";
    }

    return text.trim();
  } catch (error) {
    console.error("Failed to extract PDF text:", error);
    throw new Error("Failed to read text from the uploaded PDF.");
  }
}

async function runPrompt(prompt, params, onUpdate) {
  try {
    if (!session) {
      session = await LanguageModel.create(params);
    }

    let response = "";
    const stream = session.promptStreaming(prompt);

    for await (const chunk of stream) {
      // Some implementations stream deltas, while others stream the full
      // response-so-far. Handle both without duplicating text.
      if (chunk.startsWith(response)) {
        response = chunk;
      } else {
        response += chunk;
      }

      onUpdate?.(response);
    }

    return response;
  } catch (e) {
    console.log("Prompt failed");
    console.error(e);
    console.log("Prompt:", prompt);
    // Reset session
    reset();
    throw e;
  }
}

async function reset() {
  if (session) {
    session.destroy();
  }
  session = null;
}

buttonReset.addEventListener("click", () => {
  hide(elementLoading);
  hide(elementError);
  hide(elementResponse);
  reset();

  pdfText = "";
  inputPrompt.value = "";
  fileUpload.value = "";
  fileName.textContent = "";
  elementResponse.innerHTML = "";
  elementError.textContent = "";

  buttonReset.setAttribute("disabled", "");
  updatePromptButtonState();
});

inputPrompt.addEventListener("input", updatePromptButtonState);

fileUpload.addEventListener("change", async () => {
  reset();
  hide(elementError);

  const file = fileUpload.files?.[0];

  if (!file) {
    fileName.textContent = "";
    updatePromptButtonState();
    return;
  }

  fileName.textContent = file.name;

  if (file.type !== "application/pdf") {
    pdfText = "";
    fileUpload.value = "";
    fileName.textContent = "";
    showError("Please upload a PDF file.");
    updatePromptButtonState();
    return;
  }

  try {
    pdfText = await extractPDFText(file);
  } catch (error) {
    pdfText = "";
    fileUpload.value = "";
    fileName.textContent = "";
    showError(error instanceof Error ? error.message : "Failed to parse PDF.");
  } finally {
    updatePromptButtonState();
  }
});

buttonPrompt.addEventListener("click", async () => {
  const jobDescription = inputPrompt.value.trim();
  const prompt = formatCoverLetterPrompt(
    (pdfText ?? "").trim(),
    jobDescription,
  );

  showLoading();

  try {
    const params = {
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
    };
    const response = await runPrompt(prompt, params, showResponse);
    showResponse(response);
  } catch (e) {
    showError(e);
  }
});

function formatCoverLetterPrompt(resumeText, jobDescription) {
  return `
You are an expert career coach and cover letter writer.

Generate a concise, professional cover letter based only on the resume and job description below.

Requirements:
- Start with "Dear Hiring Manager," unless a specific recipient name is clearly provided in the job description.
- Do not include a date, address block, subject line, or any bracketed placeholders.
- Never output placeholders such as [Company Name], [Your Name], [Date], [Hiring Manager], [Position], or similar.
- If the company name is not clearly provided, refer to it as "your team" or "your organization" instead of using a placeholder.
- If the candidate name is available in the resume, sign off with that name.
- If the candidate name is not available, end with "Sincerely," only.
- Use a natural human tone.
- Do not invent experience that is not supported by the resume.
- Tailor the cover letter directly to the hiring manager and the company's needs.
- Highlight the most relevant projects, skills, and impact.
- Keep it under 400 words.
- Before returning, check the final letter and remove any unresolved placeholders.
- Return only the final cover letter text.

Resume:
${resumeText}

Job Description:
${jobDescription}
`.trim();
}

function updatePromptButtonState() {
  if (inputPrompt.value.trim() && fileUpload.files?.length) {
    buttonPrompt.removeAttribute("disabled");
  } else {
    buttonPrompt.setAttribute("disabled", "");
  }
}

function showLoading() {
  buttonReset.removeAttribute("disabled");
  hide(elementResponse);
  hide(elementError);
  show(elementLoading);
}

function showResponse(response) {
  hide(elementLoading);
  show(elementResponse);
  elementResponse.innerHTML = DOMPurify.sanitize(marked.parse(response));
}

function showError(error) {
  show(elementError);
  hide(elementResponse);
  hide(elementLoading);
  elementError.textContent = error;
}

function show(element) {
  element.removeAttribute("hidden");
}

function hide(element) {
  element.setAttribute("hidden", "");
}
