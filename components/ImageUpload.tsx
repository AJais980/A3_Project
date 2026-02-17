"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { XIcon } from "lucide-react";

interface ImageUploadProps {
  onChange: (url: string, fileType?: string, fileName?: string, fileExtension?: string, fileCategory?: string) => void;
  value: string;
  endpoint: "postImage" | "postMedia";
}

function ImageUpload({ endpoint, onChange, value }: ImageUploadProps) {
  if (value) {
    return (
      <div className="relative size-40">
        <img src={value} alt="Upload" className="rounded-md size-40 object-cover" />
        <button
          onClick={() => onChange("", "", "", "", "")}
          className="absolute top-0 right-0 p-1 bg-red-500 rounded-full shadow-sm"
          type="button"
        >
          <XIcon className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }
  return (
    <UploadDropzone
      className="border-none custom-upload-dropzone"
      endpoint={endpoint as any}
      onClientUploadComplete={(res: any) => {
        if (res?.[0]) {
          const response = res[0];

          // Extract file info from the response
          const fileName = response.name || response.fileName || 'unknown';
          const fileType = response.type || response.fileType || '';
          const fileUrl = response.url || response.fileUrl || '';

          // Extract extension from filename
          const extension = fileName.split('.').pop()?.toLowerCase() || '';

          // Determine category based on extension
          let category = 'unknown';
          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
            category = 'image';
          } else if (extension === 'pdf') {
            category = 'pdf';
          } else if ([
            'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 
            'json', 'md', 'php', 'go', 'rs', 'kt', 'swift', 'rb', 'dart', 'scala', 
            'r', 'xml', 'sql', 'sh', 'bat', 'cs', 'yaml', 'yml', 'toml', 'ini', 
            'cfg', 'txt', 'log', 'env', 'gitignore', 'dockerfile', 'makefile'
          ].includes(extension)) {
            category = 'code';
          }

          onChange(
            fileUrl,
            fileType,
            fileName,
            extension,
            category
          );
        }
      }}
      onUploadError={(error: Error) => {
        console.error("Upload error:", error);
      }}
      onUploadBegin={(name: string) => {
        // Upload started
      }}
    />
  );
}
export default ImageUpload;
