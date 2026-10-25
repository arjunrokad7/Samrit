import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import VoiceAssistant from "../samrit/VoiceAssistant";

describe("optional voice assistant", () => {
  it("automatically sends a stopped recording and displays Gemini-corrected wording", async () => {
    class Recorder {
      static isTypeSupported() {
        return true;
      }
      state = "inactive";
      mimeType = "audio/webm";
      onstop: null | (() => void) = null;
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
        this.onstop?.();
      }
    }
    vi.stubGlobal("MediaRecorder", Recorder);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi
          .fn()
          .mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }),
      },
    });
    const fetcher = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (url) =>
        ({
          ok: true,
          json: async () => ({
            data: String(url).endsWith("transcribe")
              ? { text: "i cant eat cold fooood" }
              : {
                  ...proposal,
                  correctedTranscript: "I can’t eat cold food.",
                },
          }),
        }) as Response,
    );
    render(<VoiceAssistant context={{ page: "meals" }} onApply={vi.fn()} />);
    await enable();
    fireEvent.click(screen.getByRole("button", { name: "Record" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Stop recording" }),
    );
    await screen.findByText("I can’t eat cold food.", { exact: false });
    expect(fetcher).toHaveBeenCalledTimes(2);
    const body = JSON.parse(String(fetcher.mock.calls[1][1]?.body));
    expect(body.source).toBe("voice");
    expect(body.message).toBe("i cant eat cold fooood");
  });
  it("executes review preparation without asking the user to press Finish first", async () => {
    const action = { type: "start_review", sentiment: null, details: "" };
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { reply: "Opening review.", action } }),
    } as Response);
    const apply = vi.fn().mockResolvedValue("How was your visit?");
    render(
      <VoiceAssistant
        context={{ page: "visit", checkedIn: true, finished: false }}
        onApply={apply}
      />,
    );
    await enable();
    fireEvent.change(screen.getByLabelText("Assistant message"), {
      target: { value: "I want to leave a review" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(apply).toHaveBeenCalledWith(action));
    expect(
      screen.queryByRole("button", { name: "Confirm action" }),
    ).not.toBeInTheDocument();
  });
  const originalMedia = Object.getOwnPropertyDescriptor(
    navigator,
    "mediaDevices",
  );
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (originalMedia)
      Object.defineProperty(navigator, "mediaDevices", originalMedia);
    else Reflect.deleteProperty(navigator, "mediaDevices");
  });
  async function enable() {
    fireEvent.click(
      screen.getByRole("button", { name: "Open meal voice assistant" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Enable assistant" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Mute spoken replies" }),
    );
  }
  async function ask(text = "Avoid peanuts") {
    fireEvent.change(screen.getByLabelText("Assistant message"), {
      target: { value: text },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Review proposed action");
  }
  const proposal = {
    reply: "Please review these filters.",
    action: {
      type: "filters",
      allergens: ["Peanuts"],
      preferences: "Hot meals",
      area: "",
    },
  };
  it("does not request a provider or microphone before opt-in", () => {
    const fetcher = vi.spyOn(globalThis, "fetch");
    render(<VoiceAssistant context={{ page: "meals" }} onApply={vi.fn()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Open meal voice assistant" }),
    );
    expect(
      screen.getByRole("button", { name: "Enable assistant" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Record" }),
    ).not.toBeInTheDocument();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("applies a proposed action only after confirmation, and never submits on a draft", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: proposal }),
    } as Response);
    const apply = vi.fn().mockResolvedValue("Filters updated.");
    render(<VoiceAssistant context={{ page: "meals" }} onApply={apply} />);
    await enable();
    await ask();
    expect(apply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm action" }));
    await waitFor(() => expect(apply).toHaveBeenCalledWith(proposal.action));
  });
  it("does not overwrite manually changed filters with a stale proposal", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: proposal }),
    } as Response);
    const apply = vi.fn();
    const { rerender } = render(
      <VoiceAssistant
        context={{ page: "meals", allergens: [] }}
        onApply={apply}
      />,
    );
    await enable();
    await ask();
    rerender(
      <VoiceAssistant
        context={{ page: "meals", allergens: ["Milk"] }}
        onApply={apply}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm action" }));
    expect(apply).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("page changed");
  });
  it("submits once when asked without requiring a second confirmation button", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { reply: "Ready to submit?", action: { type: "submit_review" } },
      }),
    } as Response);
    const apply = vi.fn().mockResolvedValue("Submitted.");
    render(
      <VoiceAssistant
        context={{ page: "visit", finished: true, sentiment: "positive" }}
        onApply={apply}
      />,
    );
    await enable();
    fireEvent.change(screen.getByLabelText("Assistant message"), {
      target: { value: "Submit my review" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() =>
      expect(apply).toHaveBeenCalledWith({ type: "submit_review" }),
    );
    expect(apply).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "Confirm submission" }),
    ).not.toBeInTheDocument();
  });
  it("keeps typed chat available when microphone access fails", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(Error("Permission denied")),
      },
    });
    render(<VoiceAssistant context={{ page: "meals" }} onApply={vi.fn()} />);
    await enable();
    fireEvent.click(screen.getByRole("button", { name: "Record" }));
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Assistant message")).toBeEnabled();
  });
  it("stops the microphone on close without sending a recording", async () => {
    const stopTrack = vi.fn();
    const fetcher = vi.spyOn(globalThis, "fetch");
    class Recorder {
      static isTypeSupported() {
        return true;
      }
      state = "inactive";
      onstop: null | (() => void) = null;
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
        this.onstop?.();
      }
    }
    vi.stubGlobal("MediaRecorder", Recorder);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi
          .fn()
          .mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }),
      },
    });
    render(<VoiceAssistant context={{ page: "meals" }} onApply={vi.fn()} />);
    await enable();
    fireEvent.click(screen.getByRole("button", { name: "Record" }));
    await screen.findByRole("button", { name: "Stop recording" });
    fireEvent.click(
      screen.getByRole("button", { name: "Close meal assistant" }),
    );
    expect(stopTrack).toHaveBeenCalled();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
