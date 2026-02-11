import jsPDF from "jspdf";

// Local font path served from public/assets
const NOTO_SANS_MALAYALAM_URL = "/assets/fonts/NotoSansMalayalam.ttf";

// Cache the font data so we only download once per session
let cachedFont: string | null = null;

/**
 * Fetches a font from URL and returns it as a base64 string.
 */
async function fetchFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font from ${url}: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

/**
 * Registers the Noto Sans Malayalam font (Regular + Bold) with a jsPDF instance.
 * This font supports both Malayalam Unicode text and Latin characters.
 * Uses the same variable font file for both normal and bold styles.
 *
 * Usage:
 * ```ts
 * const doc = new jsPDF();
 * await registerMalayalamFont(doc);
 * doc.setFont("NotoSansMalayalam", "normal");
 * doc.text("മലയാളം Text", 20, 20);
 * ```
 */
export async function registerMalayalamFont(doc: jsPDF): Promise<void> {
  if (!cachedFont) {
    cachedFont = await fetchFontAsBase64(NOTO_SANS_MALAYALAM_URL);
  }

  // Register as both normal and bold (variable font supports both)
  doc.addFileToVFS("NotoSansMalayalam.ttf", cachedFont);
  doc.addFont("NotoSansMalayalam.ttf", "NotoSansMalayalam", "normal");
  doc.addFont("NotoSansMalayalam.ttf", "NotoSansMalayalam", "bold");
}

/**
 * Creates a new jsPDF instance with Malayalam font pre-registered and set as default.
 * This is a convenience wrapper for the most common use case.
 *
 * Usage:
 * ```ts
 * const doc = await createMalayalamPDF();
 * doc.text("മലയാളം Text + English", 20, 20);
 * doc.save("report.pdf");
 * ```
 */
export async function createMalayalamPDF(
  options?: ConstructorParameters<typeof jsPDF>[0]
): Promise<jsPDF> {
  const doc = new jsPDF(options);
  await registerMalayalamFont(doc);
  doc.setFont("NotoSansMalayalam", "normal");
  return doc;
}
