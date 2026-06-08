import * as pdfjsLib from "pdfjs-dist";
import { createTextPDF } from "./pdf-util.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "./pdf.worker.mjs",
  import.meta.url,
).toString();

const inputPrompt = document.body.querySelector("#input-prompt");
const buttonPrompt = document.body.querySelector("#button-prompt");
const buttonReset = document.body.querySelector("#button-reset");
const buttonCopyResponse = document.body.querySelector("#button-copy-response");
const buttonExportPDF = document.body.querySelector("#button-export-pdf");

const elementResponseContainer = document.body.querySelector("#response-container");
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
  hide(elementResponseContainer);
  reset();

  pdfText = "";
  inputPrompt.value = "";
  fileUpload.value = "";
  fileName.textContent = "";
  elementResponse.value = "";
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
    const response = await runPrompt(prompt, params, showStreamingResponse);
    showEditableResponse(response);
  } catch (e) {
    showError(e);
  }
});

buttonCopyResponse.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(elementResponse.value.trim());

    const originalHTML = buttonCopyResponse.innerHTML;
    
    buttonCopyResponse.textContent = "✓";
    buttonCopyResponse.setAttribute("aria-label", "Copied");
    buttonCopyResponse.setAttribute("title", "Copied");

    setTimeout(() => {
      buttonCopyResponse.innerHTML = originalHTML;
      buttonCopyResponse.setAttribute("aria-label", "Copy response");
      buttonCopyResponse.setAttribute("title", "Copy response");
    }, 1200);
  } catch (error) {
    console.error("Failed to copy response:", error);
    showError("Failed to copy response to clipboard.");
  }
});

buttonExportPDF.addEventListener("click", async () => {
  try {
    const responseText = elementResponse.value.trim();

    if (!responseText) {
      showError("There is no response to export.");
      return;
    }

    const pdfBlob = await createTextPDF(responseText);
    const pdfURL = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");

    link.href = pdfURL;
    link.download = "cover-letter.pdf";
    document.body.append(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(pdfURL), 1000);
  } catch (error) {
    console.error("Failed to export PDF:", error);
    showError("Failed to export response as PDF.");
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
  hide(elementResponseContainer);
  hide(elementError);
  show(elementLoading);
}

function showStreamingResponse(response) {
  hide(elementLoading);
  show(elementResponseContainer);
  hide(buttonCopyResponse);
  hide(buttonExportPDF);
  elementResponse.setAttribute("readonly", "");
  elementResponse.value = response;
}

function showEditableResponse(response) {
  showStreamingResponse(response);
  show(buttonCopyResponse);
  show(buttonExportPDF);
  elementResponse.removeAttribute("readonly");
  elementResponse.focus();
}

function showError(error) {
  show(elementError);
  hide(elementResponseContainer);
  hide(elementLoading);
  elementError.textContent = error;
}

function show(element) {
  element.removeAttribute("hidden");
}

function hide(element) {
  element.setAttribute("hidden", "");
}
