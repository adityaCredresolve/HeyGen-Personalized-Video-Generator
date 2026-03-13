import { Download, Link, MessageCircle, BookmarkPlus, AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardState } from "@/store/wizardStore";
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
  const videoUrl = generatedVideo?.video_url ?? "";
  const avatarName = state.avatarId
    ? state.avatarId.charAt(0).toUpperCase() + state.avatarId.slice(1)
    : "None";
  const statusText =
    state.generationStatus === "completed"
      ? generatedVideo?.status ?? "completed"
      : state.generationStatus === "failed"
      ? "failed"
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

    window.open(videoUrl, "_blank", "noopener,noreferrer");
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
            <p className="text-sm font-semibold text-foreground">Your video is ready.</p>
            <p className="text-xs text-muted-foreground">Use the delivery controls below to share or download it.</p>
          </div>
        </div>
      ) : state.generationStatus === "submitting" ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30">
          <LoaderCircle className="h-6 w-6 text-primary shrink-0 animate-spin" />
          <div>
            <p className="text-sm font-semibold text-foreground">Generating with HeyGen</p>
            <p className="text-xs text-muted-foreground">The job is submitted. The frontend is polling HeyGen status in the background.</p>
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
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/80 border border-border">
          <BookmarkPlus className="h-6 w-6 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Ready to generate</p>
            <p className="text-xs text-muted-foreground">Use the footer button to submit this wizard to `/generate/direct`.</p>
          </div>
        </div>
      )}

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
                      ? "border-primary bg-primary/5 glow-cyan-sm"
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
          <Meta label="Language" value={state.language} />
          <Meta label="Avatar" value={avatarName} />
          <Meta label="Status" value={statusText} />
          <Meta label="Video ID" value={generatedVideo?.video_id ?? "Pending"} />
          <Meta label="Output URL" value={videoUrl || "Pending"} />
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
