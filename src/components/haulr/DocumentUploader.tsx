import { useRef, useState } from "react";
import { Check, FileText, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function DocumentUploader({
  url,
  onChange,
  label,
}: {
  url: string | null;
  onChange: (url: string) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `compliance/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;
      const { error: uploadError } = await supabase.storage.from("job-photos").upload(path, file);
      if (uploadError) throw uploadError;
      const { data, error: signError } = await supabase.storage
        .from("job-photos")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signError) throw signError;
      onChange(data.signedUrl);
      toast.success(`${label} uploaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start rounded-xl"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : url ? (
          <Check className="mr-2 h-4 w-4 text-success" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        {url ? `${label} uploaded — replace` : `Upload ${label.toLowerCase()}`}
      </Button>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2"
        >
          <FileText className="h-3 w-3" />
          View uploaded document
        </a>
      )}
    </div>
  );
}
