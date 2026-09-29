"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-field";
import { UPLOAD_LIMITS } from "@/lib/uploads";
import { t } from "@/lib/i18n";

const a = t.guest.audio;

// Records a short voice message via MediaRecorder and hands the finished
// file to `onRecorded` — the caller uploads it through the normal pipeline.
export function AudioRecorder({ onRecorded }: { onRecorded: (file: File) => void }) {
  const [status, setStatus] = useState<"idle" | "recording" | "recorded">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
  }

  // Auto-stop once the max length is hit.
  useEffect(() => {
    if (status === "recording" && seconds >= UPLOAD_LIMITS.maxAudioSeconds) stop();
  }, [status, seconds]);

  async function start() {
    setError(undefined);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        setStatus("recorded");
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setSeconds(0);
      setStatus("recording");
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError(a.micDenied);
    }
  }

  function retake() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    blobRef.current = null;
    setSeconds(0);
    setStatus("idle");
  }

  function send() {
    if (!blobRef.current) return;
    const ext = blobRef.current.type.includes("webm") ? "webm" : "m4a";
    onRecorded(new File([blobRef.current], `voice-message.${ext}`, { type: blobRef.current.type }));
    retake();
  }

  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-3 rounded-[1.5rem] border-2 border-dashed border-primary/50 bg-lilac-soft p-4 text-center">
      <div>
        <p className="font-semibold">{a.title}</p>
        <p className="text-sm text-muted-foreground">{a.hint}</p>
      </div>

      {status === "idle" && (
        <Button type="button" onClick={start} className="gap-2">
          <Mic className="size-4" aria-hidden />
          {a.record}
        </Button>
      )}

      {status === "recording" && (
        <div className="flex flex-col items-center gap-2">
          <span className="flex items-center gap-2 font-semibold text-destructive">
            <span className="size-2 animate-pulse rounded-full bg-destructive" aria-hidden />
            {a.recording} {mm}:{ss}
          </span>
          <Button type="button" variant="outline" onClick={stop} className="gap-2">
            <Square className="size-4" aria-hidden />
            {a.stop}
          </Button>
        </div>
      )}

      {status === "recorded" && previewUrl && (
        <div className="flex w-full flex-col items-center gap-3">
          <audio src={previewUrl} controls className="w-full max-w-xs" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={retake} className="gap-2">
              <RotateCcw className="size-4" aria-hidden />
              {a.retake}
            </Button>
            <Button type="button" onClick={send} className="gap-2">
              <Send className="size-4" aria-hidden />
              {a.send}
            </Button>
          </div>
        </div>
      )}

      <FormError message={error} />
    </div>
  );
}
