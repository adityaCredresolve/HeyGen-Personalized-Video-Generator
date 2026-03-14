import { useState, useCallback, useEffect } from "react";
import type { VideoJobResult } from "@/lib/api";
import { AVATAR_TEMPLATES, REMOTION_TEMPLATES } from "@/lib/templates";

export interface WizardState {
  currentStep: number;
  language: string;
  llmModel: string;
  outputLanguage: string;
  videoTone: string;
  temperature: number;
  systemPrompt: string;
  avatarId: string;
  avatarFilter: string;
  transcript: string;
  remotionTranscript: string;
  subtitleColor: string;
  subtitlePosition: string;
  subtitleLanguage: string;
  logoPosition: string;
  logoOpacity: number;
  logoFileName: string;
  aspectRatio: string;
  exportFormat: string;
  customerName: string;
  lan: string;
  clientName: string;
  tos: string;
  loanAmount: string;
  contactDetails: string;
  templateName: string;
  backgroundColor: string;
  includeCaptions: boolean;
  titlePrefix: string;
  productType: string;
  videoType: "avatar" | "remotion";
  generatedVideo: VideoJobResult | null;
  styledVideoUrl: string;
  styledVideoPath: string;
  subtitleSource: "provider" | "transcript" | "disabled";
  generationStatus: "idle" | "submitting" | "styling" | "completed" | "failed";
  generationError: string;
}

const defaultState: WizardState = {
  currentStep: 0,
  language: "Hindi",
  llmModel: "Claude 3.5 Sonnet",
  outputLanguage: "Hindi",
  videoTone: "Professional",
  temperature: 50,
  systemPrompt: "",
  avatarId: "",
  avatarFilter: "All",
  transcript: AVATAR_TEMPLATES.Hindi,
  remotionTranscript: REMOTION_TEMPLATES.Hindi,
  subtitleColor: "White",
  subtitlePosition: "Bottom",
  subtitleLanguage: "Hindi",
  logoPosition: "Top Right",
  logoOpacity: 80,
  logoFileName: "",
  aspectRatio: "16:9",
  exportFormat: "MP4",
  customerName: "",
  lan: "",
  clientName: "",
  tos: "",
  loanAmount: "",
  contactDetails: "1800-XXX-XXXX",
  templateName: "legal_notice_safe_hi.txt",
  backgroundColor: "#F4F4F4",
  includeCaptions: true,
  titlePrefix: "Loan Recall",
  productType: "loan",
  videoType: "avatar",
  generatedVideo: null,
  styledVideoUrl: "",
  styledVideoPath: "",
  subtitleSource: "disabled",
  generationStatus: "idle",
  generationError: "",
};

export const STEPS = [
  { label: "Language", key: "language" },
  { label: "Avatar", key: "avatar" },
  { label: "Transcript", key: "transcript" },
  { label: "Subtitle & Logo", key: "subtitle" },
  { label: "Preview", key: "preview" },
  { label: "Share", key: "share" },
] as const;

export function useWizardStore() {
  const [state, setState] = useState<WizardState>(() => {
    const saved = localStorage.getItem("avatar-wizard-storage");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // File objects are not persisted across refreshes, so clear the stale file name.
        parsed.logoFileName = "";
        // Reset generation state if page was refreshed during an in-flight job.
        if (parsed.generationStatus === "submitting" || parsed.generationStatus === "styling") {
          parsed.generationStatus = "idle";
        }
        return { ...defaultState, ...parsed };
      } catch (e) {
        console.error("Failed to parse wizard state", e);
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem("avatar-wizard-storage", JSON.stringify(state));
  }, [state]);

  const update = useCallback((partial: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => {
      const next = prev.currentStep + 1;
      if (next === 1 && prev.videoType === "remotion") {
        return { ...prev, currentStep: 2 };
      }
      return { ...prev, currentStep: Math.min(next, STEPS.length - 1) };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => {
      const previous = prev.currentStep - 1;
      if (previous === 1 && prev.videoType === "remotion") {
        return { ...prev, currentStep: 0 };
      }
      return { ...prev, currentStep: Math.max(previous, 0) };
    });
  }, []);

  const goToStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, currentStep: Math.max(0, Math.min(step, STEPS.length - 1)) }));
  }, []);

  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  const canProceed = useCallback((): boolean => {
    const s = state;
    switch (s.currentStep) {
      case 1:
        return s.videoType === "remotion" || !!s.avatarId;
      case 2:
      case 3:
        return (
          (s.videoType === "remotion" ? s.remotionTranscript : s.transcript).trim().length > 0 &&
          s.customerName.trim().length > 0 &&
          s.lan.trim().length > 0 &&
          s.clientName.trim().length > 0 &&
          s.tos.trim().length > 0
        );
      case 4:
        return s.generationStatus === "completed";
      default: return true;
    }
  }, [state]);

  return { state, update, nextStep, prevStep, goToStep, reset, canProceed };
}
