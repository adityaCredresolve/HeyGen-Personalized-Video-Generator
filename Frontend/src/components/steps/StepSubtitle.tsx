import { Upload } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { WizardState } from "@/store/wizardStore";

const RESET_GENERATION_STATE = {
  generatedVideo: null,
  generationStatus: "idle" as const,
  generationError: "",
};

const COLORS = [
  { name: "White", color: "bg-foreground" },
  { name: "Yellow", color: "bg-accent" },
  { name: "Teal", color: "bg-primary" },
];
const POSITIONS = ["Top", "Center", "Bottom"];
const LOGO_POSITIONS = ["Top Left", "Top Right", "Bottom Left", "Bottom Right"];

interface StepSubtitleProps {
  state: WizardState;
  update: (partial: Partial<WizardState>) => void;
}

export function StepSubtitle({ state, update }: StepSubtitleProps) {
  return (
    <div className="grid grid-cols-2 gap-8 max-w-5xl">
      {/* Left – preview + subtitle controls */}
      <div className="space-y-6">
        <div className="rounded-xl bg-background border border-border aspect-video flex items-end justify-center p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/60" />
          {state.includeCaptions ? (
            <p
              className={`relative text-sm font-semibold px-4 py-2 rounded-lg ${
                state.subtitleColor === "White"
                  ? "text-foreground bg-background/70"
                  : state.subtitleColor === "Yellow"
                  ? "text-accent bg-background/70"
                  : "text-primary bg-background/70"
              }`}
            >
              Your payment is overdue.
            </p>
          ) : (
            <p className="relative text-xs font-medium text-muted-foreground">Captions disabled</p>
          )}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Enable Captions</p>
            <p className="text-xs text-muted-foreground">Maps to the backend `include_captions` flag.</p>
          </div>
          <Switch
            checked={state.includeCaptions}
            onCheckedChange={(checked) => update({ includeCaptions: checked, ...RESET_GENERATION_STATE })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Subtitle Color</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => update({ subtitleColor: c.name })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  state.subtitleColor === c.name
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${c.color}`} />
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Subtitle Position</label>
          <div className="flex gap-2">
            {POSITIONS.map((p) => (
              <button
                key={p}
                onClick={() => update({ subtitlePosition: p })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  state.subtitlePosition === p
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right – logo */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Company Logo</label>
          <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center bg-secondary/50 hover:bg-surface-hover transition-colors cursor-pointer">
            <Upload className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Click to upload PNG or SVG</p>
            <p className="text-xs text-muted-foreground mt-1">Max 2MB</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Logo Position</label>
          <div className="grid grid-cols-2 gap-2">
            {LOGO_POSITIONS.map((p) => (
              <button
                key={p}
                onClick={() => update({ logoPosition: p })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  state.logoPosition === p
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Logo Opacity — {state.logoOpacity}%
          </label>
          <Slider
            value={[state.logoOpacity]}
            onValueChange={([v]) => update({ logoOpacity: v })}
            max={100}
            step={1}
          />
        </div>
      </div>
    </div>
  );
}
