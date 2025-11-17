import pdfParse from "pdf-parse-new";
import mammoth from "mammoth";

/**
 * Parse document content from PDF or DOCX files
 * @param file - The file to parse (PDF or DOCX)
 * @returns Extracted text content
 */
export async function parseDocument(file: File): Promise<string> {
  const fileType = file.type;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    if (fileType === "application/pdf") {
      return await parsePDF(buffer);
    } else if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return await parseDOCX(buffer);
    } else {
      throw new Error(
        `Unsupported file type: ${fileType}. Only PDF and DOCX are supported.`
      );
    }
  } catch (error) {
    console.error("Error parsing document:", error);
    throw new Error(
      `Failed to parse document: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Parse PDF file
 */
async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    const text = data.text.trim();

    if (!text || text.length < 50) {
      throw new Error(
        "PDF appears to be empty or contains very little text. It might be image-based or corrupted."
      );
    }

    return cleanText(text);
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(
      `Failed to parse PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Parse DOCX file
 */
async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.trim();

    if (!text || text.length < 50) {
      throw new Error("DOCX appears to be empty or contains very little text.");
    }

    if (result.messages.length > 0) {
      console.warn("DOCX parsing warnings:", result.messages);
    }

    return cleanText(text);
  } catch (error) {
    console.error("DOCX parsing error:", error);
    throw new Error(
      `Failed to parse DOCX: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Clean and normalize extracted text
 */
function cleanText(text: string): string {
  return (
    text
      // Remove excessive whitespace
      .replace(/\s+/g, " ")
      // Remove multiple newlines
      .replace(/\n{3,}/g, "\n\n")
      // Remove leading/trailing whitespace
      .trim()
      // Remove special characters that might cause issues
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
  );
}

/**
 * Validate if file is a supported document type
 */
export function isSupportedDocument(file: File): boolean {
  const supportedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  return supportedTypes.includes(file.type);
}

/**
 * Get file extension from File object
 */
export function getFileExtension(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() || "";
}

/**
 * Validate file size (max 10MB)
 */
export function isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Extract metadata from document
 */
export async function extractDocumentMetadata(file: File) {
  const fileType = file.type;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    if (fileType === "application/pdf") {
      const data = await pdfParse(buffer);
      return {
        pageCount: data.numpages,
        info: data.info,
        metadata: data.metadata,
      };
    }
    return null;
  } catch (error) {
    console.error("Error extracting metadata:", error);
    return null;
  }
}
