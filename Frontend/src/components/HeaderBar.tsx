import { ChevronDown, Clapperboard, LayoutTemplate, Sparkles, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CreateMode = "avatar" | "remotion";

interface HeaderBarProps {
  onCreateVideo?: (mode?: CreateMode) => void;
  primaryLabel?: string;
}

export function HeaderBar({ onCreateVideo, primaryLabel = "Create Video" }: HeaderBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isVideosPage = location.pathname === "/";
  const isCreatePage = location.pathname === "/create";
  const isTemplatesPage = location.pathname === "/templates";

  const launchCreate = (mode: CreateMode) => {
    navigate(`/create?mode=${mode}&fresh=1`);
    onCreateVideo?.(mode);
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className={`bg-primary text-primary-foreground hover:bg-primary/90 glow-purple-sm font-semibold ${
                isCreatePage ? "ring-1 ring-primary/40" : ""
              }`}
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              {primaryLabel}
              <ChevronDown className="ml-1.5 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Choose Creation Flow</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => launchCreate("avatar")} className="items-start gap-3 py-3">
              <Clapperboard className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-foreground">Avatar Flow</p>
                <p className="text-xs text-muted-foreground">Use the existing talking-avatar pipeline.</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => launchCreate("remotion")} className="items-start gap-3 py-3">
              <LayoutTemplate className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-foreground">ScriptMotion Flow</p>
                <p className="text-xs text-muted-foreground">Create the cinematic script-driven render with the ScriptMotion setup.</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
