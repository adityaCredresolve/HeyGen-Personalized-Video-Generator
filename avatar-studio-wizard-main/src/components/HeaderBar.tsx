import { Plus, LayoutTemplate, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const handlePrimaryAction = () => {
    navigate("/create");
    onCreateVideo?.();
  };

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <h1 className="font-display text-xl font-bold tracking-tight">
        <span className="text-foreground">Avatar</span>
        <span className="text-primary">Studio</span>
      </h1>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <LayoutTemplate className="mr-2 h-4 w-4" />
          Template Library
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className={isVideosPage ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground"}
        >
          <Video className="mr-2 h-4 w-4" />
          My Videos
        </Button>
        <Button
          size="sm"
          onClick={handlePrimaryAction}
          className={`bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan-sm font-semibold ${
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
