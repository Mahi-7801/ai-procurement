import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileCheck, X, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileDropzoneProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  accept?: string;
  label: string;
  subLabel: string;
  id: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  selectedFile,
  accept,
  label,
  subLabel,
  id,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
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
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (accept) {
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      const acceptedExtensions = accept.split(",").map((ext) => ext.trim().toLowerCase());
      
      const isValidExtension = acceptedExtensions.some(ext => {
        if (ext.startsWith('.')) return ext === fileExtension;
        if (ext.includes('/*')) {
          const typeBase = ext.split('/')[0];
          return file.type.startsWith(typeBase);
        }
        return ext === file.type;
      });

      if (!isValidExtension) {
        toast({
          title: "Invalid File Type",
          description: `Please upload a file with format: ${accept}`,
          variant: "destructive",
        });
        return;
      }
    }
    onFileSelect(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
        {label}
      </label>
      <motion.div
        whileHover={{ scale: 0.995 }}
        whileTap={{ scale: 0.98 }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${
          isDragging
            ? "border-gov-blue bg-gov-blue/5 scale-[1.02]"
            : selectedFile
            ? "border-gov-green/50 bg-gov-green/5"
            : "border-slate-200 hover:border-gov-blue/50 hover:bg-slate-50"
        }`}
      >
        <input
          type="file"
          id={id}
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          onChange={handleFileInputChange}
        />

        <AnimatePresence mode="wait">
          {selectedFile ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center gap-2"
            >
              <div className="bg-gov-green/20 p-3 rounded-full mb-1">
                <FileCheck className="w-10 h-10 text-gov-green" />
              </div>
              <p className="text-sm font-bold text-slate-800 line-clamp-1 max-w-full px-4">
                {selectedFile.name}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black uppercase text-gov-green tracking-widest">
                  File Ready
                </p>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <p className="text-[10px] font-medium text-slate-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 mt-2 px-3 rounded-lg"
              >
                <X className="w-3.5 h-3.5 mr-2" />
                Remove
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-2 pointer-events-none"
            >
              <div className="bg-slate-100 group-hover:bg-gov-blue/10 p-4 rounded-full transition-colors mb-2">
                <Upload
                  className={`w-10 h-10 transition-colors ${
                    isDragging ? "text-gov-blue" : "text-slate-400 group-hover:text-gov-blue"
                  }`}
                />
              </div>
              <p className="text-sm font-bold text-slate-600 group-hover:text-gov-blue transition-colors">
                {subLabel}
              </p>
              <p className="text-[10px] font-medium text-slate-400">
                Drag and drop or click to browse
              </p>
              
              {isDragging && (
                <div className="absolute inset-0 border-2 border-gov-blue rounded-xl flex items-center justify-center bg-gov-blue/5 backdrop-blur-[1px] pointer-events-none">
                  <p className="text-sm font-black text-gov-blue uppercase tracking-widest">
                    Drop file here
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
