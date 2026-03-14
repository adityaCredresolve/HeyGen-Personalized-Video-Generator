import { ChevronDown, Clapperboard, LayoutTemplate, Sparkles, Video, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user, logout } = useAuth();
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
        onClick={() => navigate("/")}
        className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
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
              className={`bg-primary text-primary-foreground hover:bg-primary/90 glow-purple-sm font-semibold ${isCreatePage ? "ring-1 ring-primary/40" : ""
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
                <p className="font-medium text-foreground">Avatar Video flow</p>
                <p className="text-xs text-muted-foreground">Use the talking-avatar pipeline to generate personalized videos.</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => launchCreate("remotion")} className="items-start gap-3 py-3">
              <LayoutTemplate className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-foreground">Text to video flow</p>
                <p className="text-xs text-muted-foreground">Create cinematic videos from scripts using our Text to Video engine.</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.username || 'User'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
