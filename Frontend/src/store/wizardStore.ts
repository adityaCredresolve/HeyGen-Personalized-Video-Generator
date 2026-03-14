import { useState, useCallback, useEffect } from "react";
import type { VideoJobResult } from "@/lib/api";

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
  generatedVideo: VideoJobResult | null;
  styledVideoUrl: string;
  styledVideoPath: string;
  subtitleSource: "provider" | "transcript" | "disabled";
  generationStatus: "idle" | "submitting" | "styling" | "completed" | "failed";
  generationError: string;
}

const defaultState: WizardState = {
  currentStep: 0,
  language: "English",
  llmModel: "Claude 3.5 Sonnet",
  outputLanguage: "Hindi",
  videoTone: "Professional",
  temperature: 50,
  systemPrompt: "",
  avatarId: "",
  avatarFilter: "All",
  transcript: `नमस्ते {{ customer_name }}। मैं एडवोकेट अदिति मेहरा बोल रही हूँ, आपके {{ client_name }} के साथ लोन अकाउंट नंबर {{ lan }}{% if loan_amt %}, लोन राशि {{ loan_amt }}{% endif %} के संबंध में। आपने कई ईएमआई भुगतान समय पर नहीं किए हैं, और आपकी कुल बकाया राशि {{ tos }} है। इस कारण, बैंक ने आपके खिलाफ लोन रिकॉल नोटिस जारी किया है, जिसका अर्थ है कि पूरी बकाया राशि तुरंत चुकानी होगी। यदि नोटिस को नज़रअंदाज़ किया गया, तो बैंक आर्बिट्रेशन शुरू कर सकता है, और पूरी लोन राशि, ब्याज व कानूनी खर्च वसूल सकता है। बैंक की मंशा कानूनी कार्रवाई से बचने की है। यदि आप पूरी राशि नहीं चुका सकते, तो जितना संभव हो उतना भुगतान करें या तुरंत बैंक से संपर्क करें। अभी प्रतिक्रिया देने से आप आर्बिट्रेशन और आगे की कानूनी समस्याओं से बच सकते हैं।`,
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
    setState((prev) => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, STEPS.length - 1) }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 0) }));
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
      case 1: return !!s.avatarId;
      case 2:
        return (
          s.transcript.trim().length > 0 &&
          s.customerName.trim().length > 0 &&
          s.lan.trim().length > 0 &&
          s.clientName.trim().length > 0 &&
          s.tos.trim().length > 0
        );
      default: return true;
    }
  }, [state]);

  return { state, update, nextStep, prevStep, goToStep, reset, canProceed };
}
