import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

export function TagInput({ value, onChange, placeholder, id, className }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (value.includes(tag)) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft && addTag(draft)}
        placeholder={placeholder ?? "Digite e pressione Enter"}
      />
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="rounded-full p-0.5 hover:bg-background"
                aria-label={`Remover ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
