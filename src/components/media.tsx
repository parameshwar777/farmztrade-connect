import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";

import { signedUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

/**
 * Image that lazy-loads, resolves private-bucket paths to signed URLs
 * and degrades gracefully when a photo is missing.
 */
export function SafeImage({
  path,
  bucket = "listing-photos",
  alt,
  className,
  eager = false,
}: {
  path?: string | null;
  bucket?: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(path && path.startsWith("http") ? path : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    if (!path) {
      setUrl(null);
      return;
    }
    if (path.startsWith("http")) {
      setUrl(path);
      return;
    }
    signedUrl(bucket, path)
      .then((u) => active && setUrl(u))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [path, bucket]);

  if (!url || failed) {
    return (
      <div className={cn("grid place-items-center bg-muted text-muted-foreground", className)}>
        <ImageOff className="h-6 w-6 opacity-50" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
