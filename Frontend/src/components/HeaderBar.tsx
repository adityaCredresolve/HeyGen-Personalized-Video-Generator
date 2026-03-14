import { Plus, LayoutTemplate, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

interface HeaderBarProps {
  onCreateVideo?: () => void;
  primaryLabel?: string;
}

export function HeaderBar({ onCreateVideo, primaryLabel = "Create Video" }: HeaderBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isVideosPage = location.pathname === "/";
  const isCreatePage = location.pathname === "/create";
  const isTemplatesPage = location.pathname === "/templates";

  const handlePrimaryAction = () => {
    navigate("/create");
    onCreateVideo?.();
  };

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <motion.h1 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent"
      >
        Vishvarupa
      </motion.h1>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/templates")}
          className={isTemplatesPage ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground"}
        >
          <LayoutTemplate className="md:mr-2 h-4 w-4" />
          <span className="hidden md:inline">Template Library</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className={isVideosPage ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground"}
        >
          <Video className="md:mr-2 h-4 w-4" />
          <span className="hidden md:inline">My Videos</span>
        </Button>
        <Button
          size="sm"
          onClick={handlePrimaryAction}
          className={`bg-primary text-primary-foreground hover:bg-primary/90 glow-purple-sm font-semibold ${
            isCreatePage ? "ring-1 ring-primary/40" : ""
          }`}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {primaryLabel}
        </Button>
      </div>
    </header>
  );
}
