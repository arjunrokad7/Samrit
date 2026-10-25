export type VoiceAction =
  | { type: "filters"; allergens: string[]; preferences: string; area: string }
  | { type: "location" }
  | { type: "check_in" }
  | { type: "back_meals" }
  | { type: "scan" }
  | { type: "finish" }
  | {
      type: "start_review";
      sentiment: "positive" | "negative" | null;
      details: string;
    }
  | { type: "review"; sentiment: "positive" | "negative"; details: string }
  | { type: "submit_review" };
export interface VoiceReply {
  reply: string;
  action: VoiceAction | null;
  correctedTranscript?: string;
  unsupported?: boolean;
}
export function availableVoiceOptions(context: VoiceContext): string[] {
  if (context.page === "meals")
    return [
      "select allergens",
      "set food preferences",
      "choose a neighborhood",
      "find meals near you",
      "open venue check-in",
    ];
  if (context.complete)
    return [
      "return to Find a Meal",
      "start another visit using the page controls",
    ];
  if (!context.checkedIn)
    return ["scan the venue QR to check in", "return to Find a Meal"];
  if (!context.finished) return ["finish your visit", "leave a private review"];
  return [
    "draft or edit your review",
    "choose Good experience or Needs attention",
    "submit your review by asking",
  ];
}
export const unsupportedVoiceReply = (context: VoiceContext) =>
  "Sorry, I can’t help with that. On this page, I can help you " +
  availableVoiceOptions(context).join(", ") +
  ".";
export interface VoiceContext {
  page: "meals" | "visit";
  allergens?: string[];
  preferences?: string;
  area?: string;
  results?: { name: string; meal: string; address: string }[];
  checkedIn?: boolean;
  finished?: boolean;
  complete?: boolean;
  sentiment?: string;
  details?: string;
}
