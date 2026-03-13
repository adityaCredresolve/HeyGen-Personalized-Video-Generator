import { useState } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const LANGUAGES = [
  { name: "English", native: "English", flag: "🇺🇸" },
  { name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { name: "Spanish", native: "Español", flag: "🇪🇸" },
  { name: "Arabic", native: "العربية", flag: "🇸🇦" },
  { name: "French", native: "Français", flag: "🇫🇷" },
  { name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { name: "German", native: "Deutsch", flag: "🇩🇪" },
  { name: "Portuguese", native: "Português", flag: "🇧🇷" },
  { name: "Chinese", native: "中文", flag: "🇨🇳" },
  { name: "Japanese", native: "日本語", flag: "🇯🇵" },
  { name: "Bengali", native: "বাংলা", flag: "🇧🇩" },
  { name: "Marathi", native: "मराठी", flag: "🇮🇳" },
];

interface StepLanguageProps {
  selected: string;
  onSelect: (lang: string) => void;
}

export function StepLanguage({ selected, onSelect }: StepLanguageProps) {
  const [search, setSearch] = useState("");
  const filtered = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.native.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search languages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary border-border"
        />
      </div>

      <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((lang) => {
          const isSelected = selected === lang.name;
          return (
            <button
              key={lang.name}
              onClick={() => onSelect(lang.name)}
              className={`relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left ${
                isSelected
                  ? "glow-purple-border border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-surface-hover hover:border-muted-foreground/30"
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{lang.name}</p>
                <p className="text-xs text-muted-foreground">{lang.native}</p>
              </div>
              {isSelected && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
