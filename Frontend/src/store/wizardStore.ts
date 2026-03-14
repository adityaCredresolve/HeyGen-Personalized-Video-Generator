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
  language: "English",
  llmModel: "Claude 3.5 Sonnet",
  outputLanguage: "Hindi",
  videoTone: "Professional",
  temperature: 50,
  systemPrompt: "",
  avatarId: "",
  avatarFilter: "All",
  transcript: "नमस्ते {{ customer_name }}। मैं {{ client_name }} के कानूनी विभाग से बोल रही हूँ। यह आपके लोन अकाउंट नंबर {{ lan }} के संबंध में है। आपकी कुल बकाया राशि {{ tos }} है। कृपया तुरंत {{ contact_details }} पर संपर्क करें।",
  remotionTranscript: `नमस्ते {{ customer_name }}।
मैं {{ client_name }} के कानूनी विभाग से बात कर रही हूँ। यह आपके {{ product_type }} के संबंध में एक अत्यंत महत्वपूर्ण और औपचारिक सूचना है।
आपके ऋण खाते, जिसकी कुल राशि {{ loan_amount }} है, में पिछले कई महीनों से भुगतान नहीं किया गया है।
वर्तमान में आपकी कुल बकाया राशि {{ tos }} हो चुकी है। बार-बार याद दिलाने के बावजूद, आपकी ओर से कोई सकारात्मक प्रतिक्रिया नहीं मिली है।
इसी कारणवश, बैंक ने अब आपके विरुद्ध 'लोन रिकॉल नोटिस' (Loan Recall Notice) जारी करने का कड़ा निर्णय लिया है।
इसका अर्थ यह है कि अब आपको पूरी ऋण राशि का भुगतान तुरंत एक साथ करना होगा।
यदि आप अगले 48 घंटों के भीतर हमसे संपर्क नहीं करते हैं, तो हमारे पास कानूनी आर्बिट्रेशन (Arbitration) की प्रक्रिया शुरू करने के अलावा कोई विकल्प नहीं बचेगा। 
इस प्रक्रिया में आपकी संपत्ति की कुर्की और नीलामी भी शामिल हो सकती है, जिसका सारा खर्च और कानूनी शुल्क आपको ही वहन करना होगा।
कृपया इस चेतावनी को गंभीरता से लें। हम अभी भी आपसी समझौते के माध्यम से इस मामले को हल करने के इच्छुक हैं। 
भविष्य की कानूनी पेचीदगियों और अपनी क्रेडिट रेटिंग को बचाने के लिए कृपया तुरंत {{ contact_details }} पर कॉल करें।
धन्यवाद।`,
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
      // Skip Avatar step if videoType is remotion
      if (next === 1 && prev.videoType === "remotion") {
        return { ...prev, currentStep: 2 };
      }
      return { ...prev, currentStep: Math.min(next, STEPS.length - 1) };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => {
      const p = prev.currentStep - 1;
      // Skip Avatar step if videoType is remotion
      if (p === 1 && prev.videoType === "remotion") {
        return { ...prev, currentStep: 0 };
      }
      return { ...prev, currentStep: Math.max(p, 0) };
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
      case 1: return s.videoType === "remotion" || !!s.avatarId;
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
