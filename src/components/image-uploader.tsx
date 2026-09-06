import { motion, AnimatePresence } from "framer-motion";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { SafeImage } from "@/components/media";
import { uploadFile, validateImage } from "@/lib/storage";
import { cn } from "@/lib/utils";

/**
 * Camera + gallery photo picker. Uses plain file inputs with `capture`,
 * which works inside a Capacitor Android WebView and in the browser.
 */
export function ImageUploader({
  userId,
  bucket = "listing-photos",
  paths,
  onChange,
  max = 10,
  min = 3,
}: {
  userId: string;
  bucket?: string;
  paths: string[];
  onChange: (paths: string[]) => void;
  max?: number;
  min?: number;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = max - paths.length;
    if (room <= 0) {
      toast.error(`You can add up to ${max} photos.`);
      return;
    }
    setBusy(true);
    const next: string[] = [];
    for (const file of Array.from(files).slice(0, room)) {
      const problem = validateImage(file);
      if (problem) {
        toast.error(problem);
        continue;
      }
      try {
        next.push(await uploadFile(bucket, userId, file));
      } catch {
        toast.error("Upload failed. Please try again.");
      }
    }
    onChange([...paths, ...next]);
    setBusy(false);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= paths.length) return;
    const copy = [...paths];
    const [item] = copy.splice(from, 1);
    if (item === undefined) return;
    copy.splice(to, 0, item);
    onChange(copy);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        <AnimatePresence initial={false}>
          {paths.map((path, index) => (
            <motion.div
              key={path}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative aspect-square overflow-hidden rounded-2xl bg-muted"
            >
              <SafeImage path={path} bucket={bucket} alt={`Photo ${index + 1}`} className="h-full w-full" />
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Cover
                </span>
              )}
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => onChange(paths.filter((p) => p !== path))}
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-card/90"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute inset-x-1 top-9 flex justify-between">
                <button
                  type="button"
                  aria-label="Move left"
                  onClick={() => move(index, index - 1)}
                  className={cn("rounded-full bg-card/85 px-1.5 text-xs", index === 0 && "invisible")}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Move right"
                  onClick={() => move(index, index + 1)}
                  className={cn("rounded-full bg-card/85 px-1.5 text-xs", index === paths.length - 1 && "invisible")}
                >
                  ›
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {paths.length < max && (
          <div className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border bg-secondary/50">
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <>
                <button type="button" onClick={() => cameraRef.current?.click()} className="grid place-items-center text-primary">
                  <Camera className="h-5 w-5" />
                  <span className="text-[10px] font-medium">Camera</span>
                </button>
                <button type="button" onClick={() => galleryRef.current?.click()} className="grid place-items-center text-primary">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px] font-medium">Gallery</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {paths.length}/{max} photos added{min ? ` • minimum ${min}` : ""}. The first photo is used as the cover.
      </p>

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
