import { Film, FolderOpen, PlayCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HeaderBar } from "@/components/HeaderBar";
import { Button } from "@/components/ui/button";

const STATS = [
  { label: "Total Videos", value: "0", icon: Film },
  { label: "Processing", value: "0", icon: Sparkles },
  { label: "Ready", value: "0", icon: PlayCircle },
];

export default function MyVideos() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeaderBar primaryLabel="Avatar Creation" />

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <section className="surface-card p-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Workspace</p>
              <div className="space-y-2">
                <h1 className="font-display text-4xl text-foreground">My Videos</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Start users in the video library, then move them into avatar creation only when they are ready to build a new video.
                </p>
              </div>
            </div>

            <Button
              size="lg"
              onClick={() => navigate("/create")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-purple-sm font-semibold"
            >
              Avatar Creation
            </Button>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {STATS.map((item) => (
              <div key={item.label} className="surface-card p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-3xl font-display text-foreground">{item.value}</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            ))}
          </section>

          <section className="surface-card p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-secondary mx-auto flex items-center justify-center">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl text-foreground">No videos yet</h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Your generated videos will show up here. Create your first avatar video to start building the library.
              </p>
            </div>
            <Button
              onClick={() => navigate("/create")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-purple-sm font-semibold"
            >
              Go to Avatar Creation
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
