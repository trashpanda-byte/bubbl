"use client";

import { useEffect, useRef, useState } from "react";

import {
  detectHand,
  isPinching,
  LANDMARK,
  palmCenter,
  pinchMidpoint,
  type Hand,
} from "@/lib/gestures/hand-tracker";

export interface CameraDelta {
  deltaRadius: number;
  deltaTheta: number;
  deltaPhi: number;
}

const ROTATE_SENSITIVITY = 6;
const ZOOM_SENSITIVITY = 12;

// A tap is a pinch that starts and releases quickly without much movement —
// anything slower/further is treated as a deliberate zoom drag instead.
const TAP_MAX_DURATION_MS = 350;
const TAP_MAX_MOVEMENT_PX = 30;

// Only the central portion of the camera frame maps to the full screen, so
// reaching screen edges doesn't require an uncomfortably wide arm movement.
const DEADZONE_MARGIN = 0.15;

function toScreen(point: { x: number; y: number }): { x: number; y: number } {
  const adjust = (v: number) =>
    Math.min(1, Math.max(0, (v - DEADZONE_MARGIN) / (1 - DEADZONE_MARGIN * 2)));
  // x is mirrored to match the mirrored video preview (feels like a mirror:
  // moving your hand right moves the cursor right from your own viewpoint).
  return {
    x: (1 - adjust(point.x)) * window.innerWidth,
    y: adjust(point.y) * window.innerHeight,
  };
}

function fireTapAt(x: number, y: number, onMiss: () => void) {
  const el = document.elementFromPoint(x, y);
  const button = el?.closest("button");
  if (button instanceof HTMLElement) {
    button.click();
    return;
  }
  onMiss();
}

export function WebcamGestures({
  onCameraDelta,
  onTap,
}: {
  onCameraDelta: (delta: CameraDelta) => void;
  onTap: (screenX: number, screenY: number) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "tracking" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [gesture, setGesture] = useState<"none" | "pinch" | "palm">("none");

  const videoRef = useRef<HTMLVideoElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevHandRef = useRef<{
    pinchPoint: { x: number; y: number } | null;
    palm: { x: number; y: number } | null;
  }>({
    pinchPoint: null,
    palm: null,
  });
  const tapStartRef = useRef<{ time: number; screen: { x: number; y: number } } | null>(null);
  const wasPinchingRef = useRef(false);

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

    function updateCursor(hand: Hand | null) {
      const cursor = cursorRef.current;
      if (!cursor) return;
      if (!hand) {
        cursor.style.opacity = "0";
        return;
      }
      const { x, y } = toScreen(hand[LANDMARK.INDEX_TIP]);
      cursor.style.opacity = "1";
      cursor.style.transform = `translate(${x}px, ${y}px)`;
    }

    function processHand(hand: Hand | null) {
      updateCursor(hand);

      if (!hand) {
        setGesture("none");
        prevHandRef.current = { pinchPoint: null, palm: null };
        wasPinchingRef.current = false;
        tapStartRef.current = null;
        return;
      }

      const pinching = isPinching(hand);
      const cursorScreen = toScreen(hand[LANDMARK.INDEX_TIP]);

      if (pinching) {
        // Pinch is a binary trigger, not the control signal — its own
        // distance range is too narrow (it's defined by a small threshold)
        // to track continuously. Instead, moving the pinched hand up/down
        // while held controls zoom, like sliding a fader. A quick pinch
        // with little movement is treated as a tap/click instead.
        setGesture("pinch");
        prevHandRef.current.palm = null;

        if (!wasPinchingRef.current) {
          tapStartRef.current = { time: performance.now(), screen: cursorScreen };
        }

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
        wasPinchingRef.current = true;
        return;
      }

      // Just released a pinch — decide if it was a tap.
      if (wasPinchingRef.current && tapStartRef.current) {
        const elapsed = performance.now() - tapStartRef.current.time;
        const moved = Math.hypot(
          cursorScreen.x - tapStartRef.current.screen.x,
          cursorScreen.y - tapStartRef.current.screen.y,
        );
        if (elapsed < TAP_MAX_DURATION_MS && moved < TAP_MAX_MOVEMENT_PX) {
          fireTapAt(cursorScreen.x, cursorScreen.y, () => onTap(cursorScreen.x, cursorScreen.y));
        }
      }
      tapStartRef.current = null;
      wasPinchingRef.current = false;

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
      tapStartRef.current = null;
      wasPinchingRef.current = false;
    };
  }, [enabled, onCameraDelta, onTap]);

  return (
    <>
      <div
        ref={cursorRef}
        className="pointer-events-none fixed left-0 top-0 z-50 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 opacity-0 shadow-[0_0_12px_rgba(255,255,255,0.5)] transition-opacity"
        style={{
          backgroundColor: gesture === "pinch" ? "rgba(56,189,248,0.5)" : "transparent",
        }}
      />

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
                ? "Pinched — hold + move up/down to zoom, quick tap to select"
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
    </>
  );
}
