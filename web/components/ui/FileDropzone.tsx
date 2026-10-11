import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Trash2, Database, Box } from 'lucide-react';
import { ArtifactKind } from '@/lib/types/system';

export interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  kind: ArtifactKind;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  storageKey?: string;
}

interface FileDropzoneProps {
  kind: ArtifactKind;
  title: string;
  description: string;
  acceptedExtensions: string[];
  maxSizeBytes: number;
  maxFiles?: number;
  files: UploadedFileItem[];
  onFilesChange: (files: UploadedFileItem[]) => void;
  required?: boolean;
}

export function FileDropzone({
  kind,
  title,
  description,
  acceptedExtensions,
  maxSizeBytes,
  maxFiles = 1,
  files,
  onFilesChange,
  required = false,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getKindIcon = (k: ArtifactKind) => {
    switch (k) {
      case 'dataset':
        return <Database className="w-5 h-5 text-indigo-600 shrink-0" />;
      case 'model':
        return <Box className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'documentation':
        return <FileText className="w-5 h-5 text-emerald-600 shrink-0" />;
      default:
        return <FileText className="w-5 h-5 text-stone-600 shrink-0" />;
    }
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!acceptedExtensions.includes(ext)) {
      setErrorMsg(`Invalid file type "${ext}". Supported: ${acceptedExtensions.join(', ')}`);
      return;
    }

    if (file.size > maxSizeBytes) {
      setErrorMsg(`File exceeds maximum size of ${formatSize(maxSizeBytes)}`);
      return;
    }

    if (files.length >= maxFiles && maxFiles === 1) {
      // Replace single file
      const newFileItem: UploadedFileItem = {
        id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        size: file.size,
        type: file.type || ext,
        kind,
        progress: 100,
        status: 'completed',
        storageKey: `uploads/${file.name}`,
      };
      onFilesChange([newFileItem]);
      return;
    }

    if (files.length >= maxFiles) {
      setErrorMsg(`Maximum of ${maxFiles} file(s) allowed`);
      return;
    }

    const newFileItem: UploadedFileItem = {
      id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: file.name,
      size: file.size,
      type: file.type || ext,
      kind,
      progress: 100,
      status: 'completed',
      storageKey: `uploads/${file.name}`,
    };

    onFilesChange([...files, newFileItem]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(processFile);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(processFile);
      // Reset input value to allow re-upload of same file name
      e.target.value = '';
    }
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-1.5">
            {title}
            {required && <span className="text-rose-600 font-bold" title="Required">*</span>}
          </h4>
          <p className="text-xs text-stone-500 mt-0.5">{description}</p>
        </div>
        <span className="text-xs font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
          Max {formatSize(maxSizeBytes)}
        </span>
      </div>

      {/* Drop area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${title}. Supported formats: ${acceptedExtensions.join(', ')}`}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-[#5C1A2B] bg-[#5C1A2B]/5 scale-[1.01]'
            : 'border-stone-300 hover:border-[#5C1A2B]/60 bg-stone-50/50 hover:bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedExtensions.join(',')}
          multiple={maxFiles > 1}
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
        />

        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3 text-[#5C1A2B]">
          <UploadCloud className="w-6 h-6 stroke-[1.8]" />
        </div>

        <p className="text-sm font-medium text-stone-800">
          <span className="text-[#5C1A2B] font-semibold underline underline-offset-2">
            Click to upload
          </span>{' '}
          or drag and drop
        </p>

        <p className="text-xs text-stone-500 mt-1">
          {acceptedExtensions.join(', ')} (up to {formatSize(maxSizeBytes)})
        </p>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 text-xs rounded-lg bg-rose-50 text-rose-800 border border-rose-200"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="space-y-2 mt-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 rounded-lg border border-stone-200 bg-white shadow-xs"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {getKindIcon(file.kind)}
                <div className="truncate">
                  <p className="text-sm font-medium text-stone-800 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-stone-400">
                    {formatSize(file.size)} &bull; {file.kind}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {file.status === 'completed' && (
                  <span className="flex items-center text-xs text-emerald-700 font-medium gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Ready
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition"
                  aria-label={`Remove file ${file.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
