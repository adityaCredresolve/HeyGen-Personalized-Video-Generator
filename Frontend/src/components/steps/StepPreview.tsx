import { Play } from "lucide-react";
import { WizardState } from "@/store/wizardStore";
import { ProcessingScreen } from "@/components/ProcessingScreen";

const RESET_GENERATION_STATE = {
  generatedVideo: null,
  styledVideoUrl: "",
  styledVideoPath: "",
  subtitleSource: "disabled" as const,
  generationStatus: "idle" as const,
  generationError: "",
};

const RATIOS = ["16:9", "9:16", "1:1"];

interface StepPreviewProps {
  state: WizardState;
  update: (partial: Partial<WizardState>) => void;
}

export function StepPreview({ state, update }: StepPreviewProps) {
  const avatarName = state.videoType === "remotion" ? "N/A (Template)" : (state.avatarId
    ? state.avatarId.charAt(0).toUpperCase() + state.avatarId.slice(1)
    : "None");
  const wordCount = state.transcript.trim() ? state.transcript.trim().split(/\s+/).length : 0;
  const duration = `~${Math.max(1, Math.round(wordCount / 130))} min`;
  const generatedVideo = state.generatedVideo;
  const previewUrl = state.styledVideoUrl || generatedVideo?.video_url || "";

  // Resolve video URL for local Remotion files
  const videoUrl = generatedVideo?.video_url 
    ? (generatedVideo.request_mode === "remotion" 
        ? `http://127.0.0.1:8000/output/remotion/${generatedVideo.video_url.split(/[/\\]/).pop()}`
        : generatedVideo.video_url)
    : null;

  return (
    <div className="flex gap-8 max-w-5xl">
      {/* Main preview */}
      <div className="flex-1 space-y-4">
        <div className="flex gap-2">
          {RATIOS.map((r) => (
            <button
              key={r}
              onClick={() => update({ aspectRatio: r, ...RESET_GENERATION_STATE })}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                state.aspectRatio === r
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div
          className={`relative rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden ${
            state.aspectRatio === "16:9"
              ? "aspect-video"
              : state.aspectRatio === "9:16"
              ? "aspect-[9/16] max-h-[420px]"
              : "aspect-square max-h-[420px]"
          }`}
        >
<<<<<<< Updated upstream
          {state.generationStatus === "submitting" || state.generationStatus === "styling" ? (
            <ProcessingScreen 
              status={state.generationStatus} 
              estimatedTime={Math.max(2, Math.round(wordCount / 130) * 2).toString()} 
              isLongVideo={wordCount > 300} 
            />
          ) : previewUrl ? (
            <video
              controls
              src={previewUrl}
=======
          {videoUrl ? (
            <video
              controls
              src={videoUrl}
>>>>>>> Stashed changes
              poster={generatedVideo?.thumbnail_url ?? undefined}
              className="w-full h-full object-cover"
            />
          ) : generatedVideo?.thumbnail_url ? (
            <img
              src={generatedVideo.thumbnail_url}
              alt={generatedVideo.title ?? "Generated video preview"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-30">
                {state.videoType === "remotion" ? "🎬" : "🧑‍💻"}
              </div>
              <button
                type="button"
                className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto animate-pulse-glow mb-4"
              >
                <Play className="h-7 w-7 text-primary ml-1" />
              </button>
              <p className="text-sm text-muted-foreground">
                {state.videoType === "remotion" 
                  ? "Generate the template video to preview it here."
                  : state.avatarId 
                    ? "Generate the video on the final step to preview it here." 
                    : "No avatar selected"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="w-64 shrink-0">
        <div className="surface-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Video Summary</h3>
          <SummaryRow label="Style" value={state.videoType === "remotion" ? "Template" : "Avatar"} />
          <SummaryRow label="Language" value={state.language} />
          {state.videoType === "avatar" && <SummaryRow label="Avatar" value={avatarName} />}
          <SummaryRow label="Duration" value={duration} />
          <SummaryRow
            label="Subtitles"
            value={state.includeCaptions ? `${state.subtitleColor} · ${state.subtitlePosition}` : "Disabled"}
          />
          <SummaryRow label="Logo" value={state.logoFileName || "None"} />
          <SummaryRow label="Aspect Ratio" value={state.aspectRatio} />
          <SummaryRow label="Status" value={state.generationStatus} />
          {state.styledVideoUrl ? <SummaryRow label="Styled Output" value={state.subtitleSource} /> : null}
          {generatedVideo?.video_id ? <SummaryRow label="Video ID" value={generatedVideo.video_id} /> : null}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-3 text-sm">
      <span className="text-muted-foreground whitespace-nowrap shrink-0">{label}</span>
      <span className="text-foreground font-medium text-right break-all">{value}</span>
    </div>
  );
}
