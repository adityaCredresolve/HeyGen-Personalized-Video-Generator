import { Film, PlayCircle, Sparkles, Clock, CheckCircle, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HeaderBar } from "@/components/HeaderBar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchMyVideos } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const STATS = [
  { label: "Total Videos", key: "total", icon: Film },
  { label: "Processing", key: "processing", icon: Sparkles },
  { label: "Ready", key: "ready", icon: PlayCircle },
];

export default function MyVideos() {
  const navigate = useNavigate();
  const { data: videos, isLoading } = useQuery({
    queryKey: ["my-videos"],
    queryFn: fetchMyVideos,
    refetchInterval: 10000, // Poll every 10 seconds for status updates
  });

  const openCreate = (mode: "avatar" | "remotion") => {
    navigate(`/create?mode=${mode}&fresh=1`);
  };

  const stats = {
    total: videos?.length || 0,
    processing: videos?.filter((v: any) => v.status === "processing").length || 0,
    ready: videos?.filter((v: any) => v.status === "completed" || v.status === "styled").length || 0,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeaderBar primaryLabel="Create Video" />

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <section className="surface-card p-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Workspace</p>
              <div className="space-y-2">
                <h1 className="font-display text-4xl text-foreground">My Videos</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  View and manage all your videos generated across all flows.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[28rem]">
              <button
                type="button"
                onClick={() => openCreate("avatar")}
                className="rounded-2xl border border-primary/25 bg-primary/10 p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/15"
              >
                <p className="text-sm font-semibold text-foreground">Avatar Video flow</p>
                <p className="mt-1 text-xs text-muted-foreground">Create human like avatar video in seconds.</p>
              </button>
              <button
                type="button"
                onClick={() => openCreate("remotion")}
                className="rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:bg-surface-hover"
              >
                <p className="text-sm font-semibold text-foreground">Text to video flow</p>
                <p className="mt-1 text-xs text-muted-foreground">Turn your text into engaging videos in seconds.</p>
              </button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {STATS.map((item) => (
              <div key={item.label} className="surface-card p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-3xl font-display text-foreground">{stats[item.key as keyof typeof stats]}</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            ))}
          </section>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-2xl" />
              ))}
            </div>
          ) : !videos || videos.length === 0 ? (
            <section className="surface-card p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring", delay: 0.1 }}
                className="relative mb-6"
              >
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 flex items-center justify-center shadow-inner"
                >
                  <Film className="h-10 w-10 text-primary opacity-80" />
                </motion.div>
              </motion.div>
              <div className="space-y-3 mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground">Your Canvas is empty</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  No videos yet. Create a video in seconds. Take the credit all day!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={() => openCreate("avatar")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 glow-purple-sm font-semibold"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Avatar Video flow
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => openCreate("remotion")}
                  className="border-border font-semibold"
                >
                  Text to video flow
                </Button>
              </div>
            </section>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {videos.map((video: any) => (
                <motion.div
                  key={video.video_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="surface-card overflow-hidden group hover:border-primary/30 transition-all border border-border"
                >
                  <div className="aspect-video bg-slate-100 dark:bg-slate-900 relative overflow-hidden flex items-center justify-center">
                    {video.status === "completed" || video.status === "styled" ? (
                      video.video_url ? (
                        <video src={video.video_url} className="w-full h-full object-cover" controls />
                      ) : (
                        <PlayCircle className="h-12 w-12 text-primary opacity-50" />
                      )
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="h-10 w-10 text-muted-foreground animate-pulse" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Processing</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground line-clamp-1">{video.title || "Untitled Video"}</h3>
                      {video.status === "completed" || video.status === "styled" ? (
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{video.request_mode}</span>
                      <span>{new Date(video.created_at).toLocaleDateString()}</span>
                    </div>
                    {video.video_url && (
                      <Button variant="link" className="p-0 h-auto text-primary text-xs" onClick={() => window.open(video.video_url, '_blank')}>
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Open Link
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
