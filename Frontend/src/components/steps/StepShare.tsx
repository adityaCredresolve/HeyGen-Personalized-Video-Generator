import { Download, Link, MessageCircle, BookmarkPlus, AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardState } from "@/store/wizardStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FORMATS = [
  { id: "MP4", label: "MP4", desc: "Standard video" },
  { id: "Vertical Social", label: "Vertical Social", desc: "9:16 for Reels/Shorts" },
  { id: "Square Social", label: "Square Social", desc: "1:1 for feeds" },
];

const DELIVERY = [
  { icon: Link, label: "Copy Share Link" },
  { icon: Download, label: "Download Video" },
  { icon: MessageCircle, label: "Send to WhatsApp" },
  { icon: BookmarkPlus, label: "Save as Template" },
];

interface StepShareProps {
  state: WizardState;
  update: (partial: Partial<WizardState>) => void;
}

export function StepShare({ state, update }: StepShareProps) {
  const generatedVideo = state.generatedVideo;
  const videoUrl = state.styledVideoUrl || generatedVideo?.video_url || "";
  const avatarName =
    state.videoType === "remotion"
      ? "ScriptMotion"
      : state.avatarId
        ? state.avatarId.charAt(0).toUpperCase() + state.avatarId.slice(1)
        : "None";
  const statusText =
    state.generationStatus === "completed"
      ? generatedVideo?.status ?? "completed"
      : state.generationStatus === "failed"
      ? "failed"
      : state.generationStatus === "styling"
      ? "branding in progress"
      : state.generationStatus === "submitting"
      ? "processing"
      : "not started";

  const handleCopyShareLink = async () => {
    if (!videoUrl) {
      toast.error("Generate a video first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(videoUrl);
      toast.success("Share link copied.");
    } catch {
      toast.error("Clipboard access failed.");
    }
  };

  const handleOpenVideo = () => {
    if (!videoUrl) {
      toast.error("Generate a video first.");
      return;
    }

    window.location.assign(videoUrl);
  };

  const handleShareOnWhatsApp = () => {
    if (!videoUrl) {
      toast.error("Generate a video first.");
      return;
    }

    const shareUrl = `https://wa.me/?text=${encodeURIComponent(videoUrl)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-4xl space-y-8">
      {state.generationStatus === "completed" ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/30">
          <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {state.videoType === "remotion" ? "Your ScriptMotion video is ready." : "Your video is ready."}
            </p>
            <p className="text-xs text-muted-foreground">
              {state.videoType === "remotion"
                ? "Use the link below to open, copy, or download the finished ScriptMotion render."
                : "Use the delivery controls below to share or download it."}
            </p>
          </div>
        </div>
      ) : state.generationStatus === "submitting" ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30">
          <LoaderCircle className="h-6 w-6 text-primary shrink-0 animate-spin" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {state.videoType === "remotion" ? "Rendering ScriptMotion video" : "Generating video"}
            </p>
            <p className="text-xs text-muted-foreground">
              {state.videoType === "remotion"
                ? "We are stitching together a personalized ScriptMotion render for this lead."
                : "Your video is being prepared. We will move you ahead as soon as it is ready."}
            </p>
          </div>
        </div>
      ) : state.generationStatus === "styling" ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30">
          <LoaderCircle className="h-6 w-6 text-primary shrink-0 animate-spin" />
          <div>
            <p className="text-sm font-semibold text-foreground">Applying subtitles and logo</p>
            <p className="text-xs text-muted-foreground">We are adding the final presentation touches to your video now.</p>
          </div>
        </div>
      ) : state.generationStatus === "failed" ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
          <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Generation failed</p>
            <p className="text-xs text-muted-foreground">{state.generationError || "Check backend logs and try again."}</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-8">
        {/* Left */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Export Format</label>
            <div className="grid gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => update({ exportFormat: f.id })}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    state.exportFormat === f.id
                      ? "border-primary bg-primary/5 glow-purple-sm"
                      : "border-border bg-card hover:bg-surface-hover"
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Delivery Options</label>
            <div className="grid grid-cols-2 gap-2">
              {DELIVERY.map((d) => (
                <Button
                  key={d.label}
                  variant="outline"
                  disabled={!videoUrl && d.label !== "Save as Template"}
                  onClick={() => {
                    if (d.label === "Copy Share Link") {
                      void handleCopyShareLink();
                    } else if (d.label === "Download Video") {
                      handleOpenVideo();
                    } else if (d.label === "Send to WhatsApp") {
                      handleShareOnWhatsApp();
                    } else {
                      toast.info("Template saving is not wired yet.");
                    }
                  }}
                  className="justify-start border-border bg-card text-muted-foreground hover:text-foreground hover:bg-surface-hover h-auto py-3"
                >
                  <d.icon className="mr-2 h-4 w-4" />
                  <span className="text-sm">{d.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Right – metadata */}
        <div className="surface-card p-6 space-y-4 h-fit">
          <h3 className="text-sm font-semibold text-foreground mb-4">Video Metadata</h3>
          <Meta label="Video Name" value={generatedVideo?.title ?? `${state.titlePrefix} - Draft`} />
          <Meta label="Created At" value={new Date().toLocaleDateString()} />
          <Meta label="Style" value={state.videoType === "remotion" ? "ScriptMotion" : "Avatar"} />
          <Meta label="Language" value={state.language} />
          {state.videoType === "avatar" ? <Meta label="Avatar" value={avatarName} /> : null}
          <Meta label="Status" value={statusText} />
          <Meta label="Video ID" value={generatedVideo?.video_id ?? "Pending"} />
          <Meta label="Logo" value={state.logoFileName || "None"} />
          <HighlightedOutputLink
            href={videoUrl}
            onCopy={() => void handleCopyShareLink()}
          />
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

function HighlightedOutputLink({
  href,
  onCopy,
}: {
  href: string;
  onCopy: () => void;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 transition-all duration-300",
        href
          ? "border-primary/35 bg-gradient-to-br from-primary/12 via-background to-primary/8 shadow-[0_0_0_1px_rgba(168,85,247,0.08),0_18px_40px_rgba(168,85,247,0.08)]"
          : "border-border bg-secondary/30",
      )}
    >
      {href ? (
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_40%),linear-gradient(90deg,transparent,rgba(168,85,247,0.12),transparent)] motion-safe:animate-pulse" />
      ) : null}
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">Final Output Link</p>
          <p className="text-sm font-medium text-foreground">
            {href ? "Open or copy this link to access the finished video." : "Your video link will appear here once generation completes."}
          </p>
        </div>
        {href ? (
          <span className="inline-flex h-3 w-3 shrink-0 rounded-full bg-primary shadow-[0_0_18px_rgba(168,85,247,0.65)]" />
        ) : null}
      </div>
      {href ? (
        <div className="relative mt-4 space-y-3">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-primary/30 bg-background/80 px-4 py-3 text-left transition-all duration-300 hover:border-primary/50 hover:bg-background hover:shadow-[0_0_24px_rgba(168,85,247,0.14)]"
            title={href}
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Link className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-primary">Open video</span>
              <span className="block truncate text-xs text-muted-foreground">{href}</span>
            </span>
          </a>
          <div className="flex gap-2">
            <Button type="button" asChild className="flex-1">
              <a href={href} target="_blank" rel="noopener noreferrer">
                Open
              </a>
            </Button>
            <Button type="button" variant="outline" onClick={onCopy} className="flex-1 border-primary/30 text-primary hover:bg-primary/5">
              Copy Link
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative mt-4 rounded-xl border border-dashed border-border bg-background/50 px-4 py-3 text-sm font-medium text-muted-foreground">
          Pending
        </div>
      )}
    </div>
  );
}
