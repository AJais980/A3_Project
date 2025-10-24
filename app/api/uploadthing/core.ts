import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  // define routes for different upload types
  postMedia: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
    pdf: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
    blob: {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      // Simplified middleware for testing
      return { userId: "test-user" };
    })
    .onUploadComplete(async ({ file }) => {
      // Get file extension
      const extension = file.name.split('.').pop()?.toLowerCase() || '';

      // Determine file category
      let fileCategory = 'unknown';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
        fileCategory = 'image';
      } else if (extension === 'pdf') {
        fileCategory = 'pdf';
      } else if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'rb', 'php', 'go', 'rs', 'kt', 'swift', 'html', 'css', 'json', 'xml', 'sql', 'sh', 'bat', 'dart', 'scala', 'r'].includes(extension)) {
        fileCategory = 'code';
      }

      const result = {
        fileUrl: file.ufsUrl,
        fileName: file.name,
        fileType: file.type,
        fileCategory,
        fileExtension: extension
      };

      return result;
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
