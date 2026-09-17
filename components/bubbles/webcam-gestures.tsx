"use client";

import { useEffect, useRef, useState } from "react";

import { detectHand, isPinching, palmCenter, pinchMidpoint, type Hand } from "@/lib/gestures/hand-tracker";

export interface CameraDelta {
  deltaRadius: number;
  deltaTheta: number;
  deltaPhi: number;
}

const ROTATE_SENSITIVITY = 6;
const ZOOM_SENSITIVITY = 12;

export function WebcamGestures({
  onCameraDelta,
}: {
  onCameraDelta: (delta: CameraDelta) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "tracking" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [gesture, setGesture] = useState<"none" | "pinch" | "palm">("none");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevHandRef = useRef<{
    pinchPoint: { x: number; y: number } | null;
    palm: { x: number; y: number } | null;
  }>({
    pinchPoint: null,
    palm: null,
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function start() {
      setStatus("loading");
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 320, height: 240 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("tracking");
        loop();
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("Camera access denied or unavailable.");
          setEnabled(false);
        }
      }
    }

    function loop() {
      rafRef.current = requestAnimationFrame(async () => {
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          const hand: Hand | null = await detectHand(video, performance.now());
          processHand(hand);
        }
        loop();
      });
    }

    function processHand(hand: Hand | null) {
      if (!hand) {
        setGesture("none");
        prevHandRef.current = { pinchPoint: null, palm: null };
        return;
      }

      if (isPinching(hand)) {
        // Pinch is a binary trigger, not the control signal — its own
        // distance range is too narrow (it's defined by a small threshold)
        // to track continuously. Instead, moving the pinched hand up/down
        // while held controls zoom, like sliding a fader.
        setGesture("pinch");
        prevHandRef.current.palm = null;
        const point = pinchMidpoint(hand);
        const prev = prevHandRef.current.pinchPoint;
        if (prev) {
          // Normalized image y grows downward, so moving the hand up
          // (y decreasing) should zoom in (radius decreasing) — same sign.
          onCameraDelta({
            deltaRadius: (point.y - prev.y) * ZOOM_SENSITIVITY * 100,
            deltaTheta: 0,
            deltaPhi: 0,
          });
        }
        prevHandRef.current.pinchPoint = point;
        return;
      }

      setGesture("palm");
      prevHandRef.current.pinchPoint = null;
      const center = palmCenter(hand);
      const prev = prevHandRef.current.palm;
      if (prev) {
        onCameraDelta({
          deltaRadius: 0,
          deltaTheta: (center.x - prev.x) * ROTATE_SENSITIVITY,
          deltaPhi: (center.y - prev.y) * ROTATE_SENSITIVITY,
        });
      }
      prevHandRef.current.palm = center;
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      prevHandRef.current = { pinchPoint: null, palm: null };
    };
  }, [enabled, onCameraDelta]);

  return (
    <div className="absolute left-4 top-6 z-10 px-4 sm:px-0">
      {enabled && (
        <div className="mb-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-black shadow-lg shadow-black/40">
          <div className="relative">
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full scale-x-[-1] bg-black"
              style={{ aspectRatio: "4 / 3" }}
            />
            <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
              <span
                className={`h-1.5 w-1.5 rounded-full ${status === "tracking" ? "bg-emerald-400" : "bg-neutral-400"}`}
              />
              {status === "loading" ? "Starting…" : "Live"}
            </div>
          </div>
          <div className="px-2.5 py-1.5 text-[11px] text-neutral-400">
            {gesture === "pinch"
              ? "Pinched — move up/down to zoom"
              : gesture === "palm"
                ? "Open hand — move to look around"
                : "Show your hand to the camera"}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setEnabled((v) => !v)}
        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 backdrop-blur transition hover:bg-white/10"
      >
        {enabled ? "Disable camera" : "Enable camera controls"}
      </button>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      {enabled && !error && (
        <p className="mt-1.5 max-w-52 text-[11px] text-neutral-500">
          Processed on your device — video is never uploaded.
        </p>
      )}
    </div>
  );
}
