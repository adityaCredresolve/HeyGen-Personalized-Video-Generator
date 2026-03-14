import { Film, FolderOpen, PlayCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
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
      <HeaderBar primaryLabel="Create Video" />

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <section className="surface-card p-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Workspace</p>
              <div className="space-y-2">
                <h1 className="font-display text-4xl text-foreground">My Videos</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  View and manage all your generated avatar videos here.
                </p>
              </div>
            </div>

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
              <h2 className="font-display text-2xl font-semibold text-foreground">Your canvas is empty</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                You haven't generated any AI avatar videos yet. Head over to the studio to cast your first digital twin and bring your script to life.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => navigate("/create")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-purple-sm font-semibold"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Create First Video
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
