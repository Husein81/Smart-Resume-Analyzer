import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import pdfParse from "pdf-parse-new";
import mammoth from "mammoth";
import { z } from "zod";

// ============================================
// Zod Schemas for Validation
// ============================================

const AllowedFileTypesSchema = z.enum([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
]);

const FileUploadResultSchema = z.object({
  fileUrl: z.string(),
  fileName: z.string(),
  parsedText: z.string().min(1),
  fileSize: z.number().positive(),
});

export const FileValidationResultSchema = z.object({
  valid: z.boolean(),
  error: z.string().optional(),
});

// ============================================
// Constants
// ============================================

export const ALLOWED_FILE_TYPES = AllowedFileTypesSchema.options;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ============================================
// Types
// ============================================

export type FileUploadResult = z.infer<typeof FileUploadResultSchema>;
export type FileValidationResult = z.infer<typeof FileValidationResultSchema>;

/**
 * Validates file type and size using Zod
 */
export function validateFile(file: File): FileValidationResult {
  try {
    // Validate file type
    const fileTypeResult = AllowedFileTypesSchema.safeParse(file.type);
    if (!fileTypeResult.success) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: PDF, DOCX, DOC, TXT`,
      };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${
          MAX_FILE_SIZE / 1024 / 1024
        }MB`,
      };
    }

    // Validate file name exists
    if (!file.name || file.name.trim().length === 0) {
      return {
        valid: false,
        error: "File must have a valid name",
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: "Invalid file",
    };
  }
}

/**
 * Parse text from different file types
 */
async function parseFileContent(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  // Validate file type is allowed
  const validatedType = AllowedFileTypesSchema.parse(fileType);

  try {
    switch (validatedType) {
      case "application/pdf": {
        const data = await pdfParse(buffer);
        return data.text;
      }

      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      case "application/msword": {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      }

      case "text/plain": {
        return buffer.toString("utf-8");
      }
    }
  } catch (error) {
    console.error("Error parsing file content:", error);
    throw new Error("Failed to parse file content");
  }
}

/**
 * Save uploaded file to the public/uploads directory
 */
async function saveFile(
  buffer: Buffer,
  originalFileName: string
): Promise<{ filePath: string; fileName: string }> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "resumes");

  // Create directory if it doesn't exist
  await fs.mkdir(uploadsDir, { recursive: true });

  // Generate unique filename
  const fileExtension = path.extname(originalFileName);
  const uniqueFileName = `${randomUUID()}${fileExtension}`;
  const filePath = path.join(uploadsDir, uniqueFileName);

  // Save file
  await fs.writeFile(filePath, buffer);

  return {
    filePath: `/uploads/resumes/${uniqueFileName}`,
    fileName: originalFileName,
  };
}

/**
 * Handle file upload - save file and extract text
 */
export async function handleFileUpload(file: File): Promise<FileUploadResult> {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file
    const { filePath, fileName } = await saveFile(buffer, file.name);

    // Parse text content
    const parsedText = await parseFileContent(buffer, file.type);

    if (!parsedText || parsedText.trim().length === 0) {
      throw new Error("No text content could be extracted from the file");
    }

    // Validate result with Zod
    const result: FileUploadResult = {
      fileUrl: filePath,
      fileName,
      parsedText,
      fileSize: file.size,
    };

    return FileUploadResultSchema.parse(result);
  } catch (error) {
    console.error("Error handling file upload:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to process file upload");
  }
}

/**
 * Delete uploaded file
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const filePath = path.join(process.cwd(), "public", fileUrl);
    await fs.unlink(filePath);
  } catch (error) {
    console.error("Error deleting file:", error);
    // Don't throw - file might already be deleted
  }
}
