import { useState, useRef } from "react";
import type { ReactNode, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { successful: Array<{ uploadURL: string }> }) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const successful: Array<{ uploadURL: string }> = [];

    try {
      const filesToUpload = Array.from(files).slice(0, maxNumberOfFiles);

      for (const file of filesToUpload) {
        if (file.size > maxFileSize) {
          console.error(`File ${file.name} exceeds max size of ${maxFileSize} bytes`);
          continue;
        }

        if (!file.type.startsWith('image/')) {
          console.error(`File ${file.name} is not an image`);
          continue;
        }

        const { url } = await onGetUploadParameters();

        const response = await fetch(url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (response.ok) {
          successful.push({ uploadURL: url.split('?')[0] });
        } else {
          console.error(`Failed to upload ${file.name}`);
        }
      }

      if (successful.length > 0 && onComplete) {
        onComplete({ successful });
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple={maxNumberOfFiles > 1}
        style={{ display: 'none' }}
      />
      <Button 
        type="button" 
        variant="outline" 
        onClick={handleClick}
        disabled={isUploading}
        className={buttonClassName}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          children
        )}
      </Button>
    </div>
  );
}
