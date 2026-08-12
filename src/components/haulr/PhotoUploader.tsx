import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PhotoUploader({
  photos,
  onChange,
  label = "Add photos",
  folder = "requests",
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
  label?: string;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const path = `${folder}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;
        const { error } = await supabase.storage.from("job-photos").upload(path, file);
        if (error) throw error;
        const { data, error: signError } = await supabase.storage
          .from("job-photos")
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        if (signError) throw signError;
        uploaded.push(data.signedUrl);
      }
      onChange([...photos, ...uploaded]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      <div className="flex flex-wrap gap-3">
        {photos.map((url) => (
          <div key={url} className="relative h-20 w-20 overflow-hidden rounded-xl border">
            <img src={url} alt="Uploaded item" className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => onChange(photos.filter((p) => p !== url))}
              className="absolute right-1 top-1 rounded-full bg-background/90 p-1"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="h-20 w-20 flex-col gap-1 rounded-xl border-dashed"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
          <span className="text-[10px]">{label}</span>
        </Button>
      </div>
    </div>
  );
}
