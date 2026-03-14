import { AlertCircle, Check, Crown, LoaderCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { AvatarOption } from "@/lib/api";

interface StepAvatarProps {
  avatars: AvatarOption[];
  isLoading: boolean;
  errorMessage: string | null;
  selectedId: string;
  filter: string;
  onSelect: (id: string) => void;
  onFilterChange: (f: string) => void;
}

export function StepAvatar({
  avatars,
  isLoading,
  errorMessage,
  selectedId,
  filter,
  onSelect,
  onFilterChange,
}: StepAvatarProps) {
  const filters = ["All", ...new Set(avatars.map((avatar) => avatar.category).filter(Boolean))];
  const filtered = filter === "All" ? avatars : avatars.filter((avatar) => avatar.category === filter);

  return (
    <div>
      <div className="rounded-xl border border-border bg-card p-4 mb-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Avatar library</p>
            <p className="text-xs text-muted-foreground">
              Select a live avatar from the backend or paste an `avatar_id` manually below.
            </p>
          </div>
          {isLoading ? (
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading avatars...
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{avatars.length} avatars available</p>
          )}
        </div>
        {errorMessage ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}
      </div>

      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {filtered.length === 0 && !isLoading ? (
          <div className="col-span-full rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            No avatars matched this filter. Paste an avatar ID manually to keep going.
          </div>
        ) : null}

        {filtered.map((avatar) => {
          const isSelected = selectedId === avatar.id;
          return (
            <button
              key={avatar.id}
              onClick={() => onSelect(avatar.id)}
              className={`relative group p-6 rounded-xl border text-center transition-all duration-200 hover:scale-[1.02] ${
                isSelected
                  ? "glow-purple-border border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-surface-hover"
              }`}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-secondary mx-auto mb-3 overflow-hidden flex items-center justify-center">
                {avatar.previewImageUrl ? (
                  <img src={avatar.previewImageUrl} alt={avatar.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-semibold text-foreground">
                    {avatar.name
                      .split(" ")
                      .map((part) => part.charAt(0))
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground">{avatar.name}</p>
              <p className="text-xs text-muted-foreground">{avatar.category}</p>
              {avatar.isPremium ? (
                <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                  <Crown className="h-3 w-3" /> Premium
                </span>
              ) : null}
              {isSelected && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 max-w-lg space-y-2">
        <label className="block text-sm font-medium text-foreground">Manual Avatar ID</label>
        <Input
          value={selectedId}
          onChange={(event) => onSelect(event.target.value)}
          placeholder="Paste an avatar_id"
          className="bg-secondary border-border"
        />
        <p className="text-xs text-muted-foreground">
          Useful when your account has a known avatar ID but metadata loading is restricted.
        </p>
      </div>
    </div>
  );
}
