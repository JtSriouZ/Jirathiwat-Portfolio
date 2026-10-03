import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  Github,
  ExternalLink,
  Mail,
  Newspaper,
  Award,
  Link as LinkIcon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Code2,
  Rocket,
} from "lucide-react";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../utils";
import StillGrid from "../components/StillGrid";
import { siteLabel } from "../siteCopy";

function actualRecords(value) {
  return Array.isArray(value) ? value.filter((item) => item && item.id) : [];
}

const RandomNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState("00");

  useEffect(() => {
    let frame = 0;
    const maxFrames = 25;
    const timer = setInterval(() => {
      frame++;
      if (frame >= maxFrames) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(String(Math.floor(Math.random() * 99)).padStart(2, "0"));
      }
    }, 45);

    return () => clearInterval(timer);
  }, [value]);

  return <strong>{displayValue}</strong>;
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const SKETCHFAB_SERVER_ROOM_UID = "fe993fa15c254ee88677be6acec6b029";
const SKETCHFAB_VIEWER_API = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";
const SKETCHFAB_SERVER_ROOM_EMBED =
  "https://sketchfab.com/models/fe993fa15c254ee88677be6acec6b029/embed?autostart=1&autospin=0&transparent=1&ui_theme=dark&ui_infos=0&ui_controls=0&ui_stop=0&ui_watermark=0&ui_hint=0&camera=0";

function loadSketchfabViewerApi() {
  if (window.Sketchfab) return Promise.resolve(window.Sketchfab);

  const existingScript = document.querySelector("script[data-sketchfab-viewer-api]");
  if (existingScript) {
    if (existingScript.dataset.loaded === "true" && !window.Sketchfab) {
      existingScript.remove();
      return loadSketchfabViewerApi();
    }

    return new Promise((resolve, reject) => {
      if (existingScript.dataset.loaded === "true" && window.Sketchfab) {
        resolve(window.Sketchfab);
        return;
      }
      existingScript.addEventListener("load", () => resolve(window.Sketchfab), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SKETCHFAB_VIEWER_API;
    script.async = true;
    script.dataset.sketchfabViewerApi = "true";
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve(window.Sketchfab);
      },
      { once: true }
    );
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });
}

function interpolateVector(start, end, amount) {
  return start.map((value, index) => value + (end[index] - value) * amount);
}

function addVector(a, b) {
  return a.map((value, index) => value + b[index]);
}

function subtractVector(a, b) {
  return a.map((value, index) => value - b[index]);
}

function scaleVector(vector, amount) {
  return vector.map((value) => value * amount);
}

function normalizeVector(vector) {
  const length = Math.hypot(...vector) || 1;
  return vector.map((value) => value / length);
}

function HeroCinematicBackdrop({ className = "hero-cinematic" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let targetScroll = 0;
    let smoothScroll = 0;
    let start = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const updateScroll = () => {
      const section = canvas.closest(".hero-section");
      if (!section) {
        targetScroll = clamp(window.scrollY / Math.max(1, window.innerHeight * 2.35), 0, 1);
        return;
      }
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight * 0.22);
      targetScroll = clamp(-rect.top / travel, 0, 1);
    };

    const drawScene = (time) => {
      const t = (time - start) / 1000;
      smoothScroll += (targetScroll - smoothScroll) * 0.075;
      const p = smoothScroll;

      ctx.clearRect(0, 0, width, height);

      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#07060f");
      bg.addColorStop(0.45, "#07060f");
      bg.addColorStop(1, "#05040f");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Chandelier glow drifting with scroll
      const glow = ctx.createRadialGradient(width * (0.68 - p * 0.12), height * (0.4 + p * 0.12), 10, width * 0.66, height * 0.5, width * 0.6);
      glow.addColorStop(0, "rgba(36, 22, 242, 0.45)");
      glow.addColorStop(0.34, "rgba(36, 22, 242, 0.16)");
      glow.addColorStop(0.7, "rgba(36, 22, 242, 0.04)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Palatial checkerboard marble floor in perspective
      const horizon = height * (0.56 - p * 0.1);
      const vanishingX = width * (0.6 + Math.sin(t * 0.12) * 0.04);
      const columns = 14;
      const rows = 16;
      const floorBottom = height + 40;
      const spread = width * 1.7;
      const rowY = (index) => horizon + Math.pow(index / rows, 2.1) * (floorBottom - horizon);
      const colX = (index, y) => {
        const depth = (y - horizon) / (floorBottom - horizon);
        return vanishingX + (index / columns) * spread * depth;
      };
      const drift = (t * 0.35) % 1;

      for (let r = 0; r < rows; r += 1) {
        const yTop = rowY(r + drift);
        const yBottom = rowY(r + 1 + drift);
        if (yTop > height) break;
        const depthAlpha = Math.pow((r + drift) / rows, 1.3);
        for (let c = -columns; c < columns; c += 1) {
          const dark = (c + r) % 2 === 0;
          ctx.beginPath();
          ctx.moveTo(colX(c, yTop), yTop);
          ctx.lineTo(colX(c + 1, yTop), yTop);
          ctx.lineTo(colX(c + 1, yBottom), yBottom);
          ctx.lineTo(colX(c, yBottom), yBottom);
          ctx.closePath();
          ctx.fillStyle = dark
            ? `rgba(7, 6, 15, ${0.55 * depthAlpha})`
            : `rgba(183, 192, 255, ${0.045 * depthAlpha})`;
          ctx.fill();
        }
      }

      ctx.lineWidth = 1;
      for (let r = 0; r <= rows; r += 1) {
        const y = rowY(r + drift);
        if (y > height + 2) break;
        const alpha = 0.04 + Math.pow(r / rows, 1.4) * 0.22;
        ctx.beginPath();
        ctx.moveTo(colX(-columns, y), y);
        ctx.lineTo(colX(columns, y), y);
        ctx.strokeStyle = `rgba(183, 192, 255, ${alpha * 0.45})`;
        ctx.stroke();
      }
      for (let c = -columns; c <= columns; c += 1) {
        ctx.beginPath();
        ctx.moveTo(vanishingX, horizon);
        ctx.lineTo(colX(c, floorBottom), floorBottom);
        ctx.strokeStyle = c % 2 === 0 ? "rgba(183, 192, 255, 0.08)" : "rgba(183, 192, 255, 0.035)";
        ctx.stroke();
      }

      // Horizon haze so the floor dissolves into the hall
      const haze = ctx.createLinearGradient(0, horizon - 60, 0, horizon + height * 0.22);
      haze.addColorStop(0, "rgba(8, 8, 18, 0.95)");
      haze.addColorStop(1, "rgba(8, 8, 18, 0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, horizon - 60, width, height * 0.22 + 60);

      // Concentric ivory arc grid (Nous-style) with a slow sweeping hand
      const arcX = width * (0.7 - p * 0.05);
      const arcY = height * (0.44 + p * 0.08);
      const ringCount = 9;
      for (let i = 0; i < ringCount; i += 1) {
        const radius = 60 + i * 58 + p * 40;
        ctx.beginPath();
        ctx.arc(arcX, arcY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = i % 3 === 1 ? "rgba(36, 22, 242, 0.85)" : "rgba(36, 22, 242, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      const sweep = t * 0.22;
      ctx.beginPath();
      ctx.moveTo(arcX, arcY);
      ctx.lineTo(arcX + Math.cos(sweep) * (60 + ringCount * 58), arcY + Math.sin(sweep) * (60 + ringCount * 58));
      ctx.strokeStyle = "rgba(183, 192, 255, 0.9)";
      ctx.stroke();
      for (let i = 0; i < 12; i += 1) {
        const angle = (i / 12) * Math.PI * 2;
        const r = 60 + 2 * 58 + p * 40;
        ctx.fillStyle = "rgba(183, 192, 255, 0.5)";
        ctx.fillRect(Math.round(arcX + Math.cos(angle) * r) - 2, Math.round(arcY + Math.sin(angle) * r) - 2, 4, 4);
      }

      // Rising pixel motes
      for (let i = 0; i < 36; i += 1) {
        const x = width * (0.4 + ((i * 97) % 520) / 1000) + Math.sin(t * 0.3 + i) * 26;
        const y = height * (0.12 + ((i * 53 + t * 9) % 720) / 1000) + Math.cos(t * 0.26 + i) * 16 + p * 80;
        const size = 1 + ((i * 11) % 3);
        const twinkle = 0.3 + Math.abs(Math.sin(t * 1.6 + i)) * 0.5;
        ctx.fillStyle = `rgba(183, 192, 255, ${twinkle * 0.55})`;
        ctx.fillRect(Math.round(x), Math.round(y), size, size);
      }

      if (!media.matches) {
        frameId = requestAnimationFrame(drawScene);
      }
    };

    resize();
    updateScroll();
    drawScene(performance.now());

    const animate = () => {
      updateScroll();
    };

    window.addEventListener("resize", resize);
    window.addEventListener("scroll", animate, { passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", animate);
    };
  }, []);

  return <canvas className={className} ref={canvasRef} aria-hidden="true" />;
}

function HeroSignalField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.closest(".hero-editorial");
    if (!canvas || !section) return undefined;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return undefined;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let running = true;
    let width = 0;
    let height = 0;
    const pointer = { x: 0.74, y: 0.48, tx: 0.74, ty: 0.48, active: false };
    const started = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const nextWidth = Math.max(1, rect.width);
      const nextHeight = Math.max(1, rect.height);
      const nextBitmapWidth = Math.max(1, Math.round(nextWidth * dpr));
      const nextBitmapHeight = Math.max(1, Math.round(nextHeight * dpr));
      width = nextWidth;
      height = nextHeight;
      if (canvas.width !== nextBitmapWidth || canvas.height !== nextBitmapHeight) {
        canvas.width = nextBitmapWidth;
        canvas.height = nextBitmapHeight;
      }
      ctx.setTransform(nextBitmapWidth / nextWidth, 0, 0, nextBitmapHeight / nextHeight, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };

    const onPointer = (event) => {
      const rect = section.getBoundingClientRect();
      pointer.tx = (event.clientX - rect.left) / Math.max(1, rect.width);
      pointer.ty = (event.clientY - rect.top) / Math.max(1, rect.height);
      pointer.active = true;
    };

    const onLeave = () => {
      pointer.active = false;
    };

    const draw = (now) => {
      const t = motion.matches ? 1.2 : (now - started) / 1000;
      const compact = width < 840;
      const restX = compact ? 0.5 : 0.73;
      const restY = compact ? 0.3 : 0.48;
      const aimX = pointer.active ? Math.min(0.9, Math.max(compact ? 0.2 : 0.46, pointer.tx)) : restX;
      const aimY = pointer.active ? Math.min(0.84, Math.max(0.14, pointer.ty)) : restY;
      pointer.x += (aimX - pointer.x) * 0.05;
      pointer.y += (aimY - pointer.y) * 0.05;

      const ox = width * pointer.x;
      const oy = height * pointer.y;
      const reach = Math.hypot(width, height) * 0.78;

      ctx.fillStyle = "#07060f";
      ctx.fillRect(0, 0, width, height);

      const wash = ctx.createRadialGradient(ox, oy, 10, ox, oy, reach);
      wash.addColorStop(0, "rgba(183, 192, 255, 0.07)");
      wash.addColorStop(0.4, "rgba(183, 192, 255, 0.02)");
      wash.addColorStop(1, "rgba(12, 11, 10, 0)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(ox, oy);
      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      ctx.setLineDash([]);
      const rings = compact ? 8 : 12;
      for (let i = 1; i <= rings; i += 1) {
        const radius = 36 + i * (reach / (rings + 2));
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = i % 3 === 0 ? "rgba(36, 22, 242, 0.95)" : "rgba(36, 22, 242, 0.5)";
        ctx.stroke();
      }

      const tickRadius = 36 + 4 * (reach / (rings + 2));
      ctx.strokeStyle = "rgba(36, 22, 242, 0.9)";
      for (let i = 0; i < 56; i += 1) {
        const angle = (i / 56) * Math.PI * 2 + t * 0.18;
        const inner = tickRadius - (i % 4 === 0 ? 14 : 6);
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
        ctx.lineTo(Math.cos(angle) * tickRadius, Math.sin(angle) * tickRadius);
        ctx.stroke();
      }

      ctx.save();
      ctx.rotate(t * 0.08);
      ctx.strokeStyle = "rgba(183, 192, 255, 0.2)";
      ctx.beginPath();
      ctx.moveTo(-reach, 0);
      ctx.lineTo(reach, 0);
      ctx.moveTo(0, -reach);
      ctx.lineTo(0, reach);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.rotate(t * 0.45);
      const fan = Math.min(reach, Math.max(width, height) * 0.42);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, fan, -0.55, 0);
      ctx.closePath();
      const wedge = ctx.createRadialGradient(0, 0, 0, 0, 0, fan);
      wedge.addColorStop(0, "rgba(183, 192, 255, 0.16)");
      wedge.addColorStop(1, "rgba(183, 192, 255, 0)");
      ctx.fillStyle = wedge;
      ctx.fill();
      ctx.strokeStyle = "rgba(183, 192, 255, 0.95)";
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(fan, 0);
      ctx.stroke();
      ctx.restore();

      const cometRadius = 36 + 7 * (reach / (rings + 2));
      const cometAngle = t * 0.85;
      for (let i = 0; i < 12; i += 1) {
        const angle = cometAngle - i * 0.07;
        const size = Math.max(1.25, 3.2 - i * 0.16);
        ctx.beginPath();
        ctx.fillStyle = `rgba(36, 22, 242, ${1 - i / 12})`;
        ctx.arc(Math.cos(angle) * cometRadius, Math.sin(angle) * cometRadius, size, 0, Math.PI * 2);
        ctx.fill();
      }

      const beads = compact ? 6 : 9;
      for (let i = 0; i < beads; i += 1) {
        const ring = 2 + (i % 5);
        const radius = 36 + ring * (reach / (rings + 2));
        const angle = t * (0.28 + (i % 3) * 0.07) * (i % 2 === 0 ? 1 : -1) + i * 0.9;
        ctx.beginPath();
        ctx.fillStyle = "rgba(183, 192, 255, 1)";
        ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      for (let i = 0; i < 3; i += 1) {
        const cycle = (t * 0.15 + i / 3) % 1;
        ctx.beginPath();
        ctx.arc(ox, oy, 18 + cycle * reach, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(183, 192, 255, ${(1 - cycle) * 0.32})`;
        ctx.stroke();
      }

      const motes = compact ? 16 : 32;
      for (let i = 0; i < motes; i += 1) {
        const seed = i * 97.13;
        const x = (seed * 17) % width + Math.sin(t * 0.32 + i) * 16;
        const y = (seed * 9) % height + Math.cos(t * 0.24 + i * 0.6) * 12;
        const twinkle = 0.2 + Math.abs(Math.sin(t * 1.5 + i)) * 0.8;
        ctx.beginPath();
        ctx.fillStyle = `rgba(183, 192, 255, ${twinkle * 0.55})`;
        ctx.arc(x, y, i % 4 === 0 ? 1.6 : 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      const scanY = ((t * 36) % (height + 80)) - 40;
      const scan = ctx.createLinearGradient(0, scanY - 36, 0, scanY + 36);
      scan.addColorStop(0, "rgba(183, 192, 255, 0)");
      scan.addColorStop(0.5, "rgba(183, 192, 255, 0.07)");
      scan.addColorStop(1, "rgba(183, 192, 255, 0)");
      ctx.fillStyle = scan;
      ctx.fillRect(0, scanY - 36, width, 72);

      const veil = ctx.createLinearGradient(0, 0, width * (compact ? 0.2 : 0.62), 0);
      veil.addColorStop(0, "rgba(7, 6, 15, 0.42)");
      veil.addColorStop(0.55, "rgba(7, 6, 15, 0.12)");
      veil.addColorStop(1, "rgba(7, 6, 15, 0)");
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, width, height);

      if (running && !motion.matches) frameId = requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver(([entry]) => {
      const visible = Boolean(entry?.isIntersecting);
      if (visible === running) return;
      running = visible;
      if (running && !motion.matches) {
        cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(draw);
      }
    }, { threshold: 0.08 });

    const onScreenResize = () => resize();
    const boxObserver = new ResizeObserver(onScreenResize);
    resize();
    observer.observe(section);
    boxObserver.observe(section);
    draw(performance.now());
    window.addEventListener("resize", onScreenResize);
    section.addEventListener("pointermove", onPointer);
    section.addEventListener("pointerleave", onLeave);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      observer.disconnect();
      boxObserver.disconnect();
      window.removeEventListener("resize", onScreenResize);
      section.removeEventListener("pointermove", onPointer);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas className="hero-field" ref={canvasRef} aria-hidden="true" />;
}

function HomeServerRoomModel() {
  const roomRef = useRef(null);
  const frameRef = useRef(null);
  const apiRef = useRef(null);
  const baseCameraRef = useRef(null);
  const baseFovRef = useRef(54);
  const lastCameraStateRef = useRef({ progress: -1, sway: -1, lift: -1 });

  useEffect(() => {
    const room = roomRef.current;
    const frame = frameRef.current;
    if (!room || !frame) return undefined;

    let frameId = 0;
    let cancelled = false;
    let readyFallbackId = 0;

    const syncViewerToScroll = (progress, time = performance.now()) => {
      const api = apiRef.current;
      const baseCamera = baseCameraRef.current;
      if (!api || !baseCamera) return;

      const roundedProgress = Math.round(progress * 100) / 100;
      const sway = Math.sin(time * 0.00082 + roundedProgress * Math.PI * 2.7) * 1.85;
      const lift = Math.cos(time * 0.00062 + roundedProgress * Math.PI * 2.1) * 0.62;
      const lookAhead = Math.sin(time * 0.00038 + roundedProgress * Math.PI * 3.4) * 0.42;
      if (
        Math.abs(roundedProgress - lastCameraStateRef.current.progress) < 0.015 &&
        Math.abs(sway - lastCameraStateRef.current.sway) < 0.028 &&
        Math.abs(lift - lastCameraStateRef.current.lift) < 0.018
      ) {
        return;
      }
      lastCameraStateRef.current = { progress: roundedProgress, sway, lift };

      const forward = normalizeVector(subtractVector(baseCamera.target, baseCamera.position));
      const right = normalizeVector([forward[2], 0, -forward[0]]);
      const up = [0, 1, 0];
      const eased = roundedProgress * roundedProgress * (3 - 2 * roundedProgress);
      const push = scaleVector(forward, eased * 3.15);
      const lateralEye = scaleVector(right, sway);
      const lateralTarget = scaleVector(right, sway * -0.58 + lookAhead);
      const verticalEye = scaleVector(up, lift + eased * 0.26);
      const verticalTarget = scaleVector(up, lift * -0.92 - eased * 0.5);
      const targetPush = scaleVector(forward, eased * 1.18);
      const eye = addVector(addVector(addVector(baseCamera.position, push), lateralEye), verticalEye);
      const target = addVector(addVector(addVector(baseCamera.target, targetPush), lateralTarget), verticalTarget);
      const fov = clamp(baseFovRef.current - eased * 19, 30, 58);

      api.setCameraLookAt(eye, target, 0.12);
      api.setFov(fov);
    };

    const update = () => {
      const progress = clamp(window.scrollY / Math.max(1, window.innerHeight * 2.5), 0, 1);
      const cssSway = Math.sin(progress * Math.PI * 2.6);
      const cssLift = Math.cos(progress * Math.PI * 2.1);
      room.style.setProperty("--room-progress", progress.toFixed(3));
      room.style.setProperty("--room-sway", cssSway.toFixed(3));
      room.style.setProperty("--room-lift", cssLift.toFixed(3));
      syncViewerToScroll(progress);
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    loadSketchfabViewerApi()
      .then((Sketchfab) => {
        if (cancelled || !Sketchfab) return;

        const client = new Sketchfab("1.12.1", frame);
        client.init(SKETCHFAB_SERVER_ROOM_UID, {
          autostart: 1,
          preload: 1,
          transparent: 1,
          autospin: 0,
          ui_controls: 0,
          ui_infos: 0,
          ui_inspector: 0,
          ui_settings: 0,
          ui_stop: 0,
          ui_watermark: 0,
          ui_watermark_link: 0,
          ui_hint: 0,
          camera: 0,
          success(api) {
            if (cancelled) return;
            apiRef.current = api;
            api.start();
            api.addEventListener("viewerready", () => {
              if (cancelled) return;

              room.classList.add("is-ready");
              api.setUserInteraction(false);
              api.setCameraEasing("easeLinear");
              api.getFov((fovError, fov) => {
                if (!fovError && typeof fov === "number") baseFovRef.current = clamp(fov, 44, 58);
              });
              api.getCameraLookAt((cameraError, camera) => {
                if (!cameraError && camera?.position && camera?.target) {
                  baseCameraRef.current = {
                    position: camera.position,
                    target: camera.target,
                  };
                  syncViewerToScroll(clamp(window.scrollY / Math.max(1, window.innerHeight * 2.5), 0, 1));
                }
              });
            });
          },
          error() {
            room.classList.add("is-fallback", "is-ready");
          },
        });
      })
      .catch(() => {
        if (!cancelled) room.classList.add("is-fallback", "is-ready");
      });

    readyFallbackId = window.setTimeout(() => {
      if (!cancelled) room.classList.add("is-ready");
    }, 6500);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(readyFallbackId);
      apiRef.current = null;
      baseCameraRef.current = null;
    };
  }, []);

  return (
    <div className="home-server-room" ref={roomRef} aria-hidden="true">
      <iframe
        ref={frameRef}
        title="Decorative 3D server room"
        src={SKETCHFAB_SERVER_ROOM_EMBED}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        tabIndex="-1"
      />
    </div>
  );
}

export default function Home({ content, language }) {
  const { profile, experiences, certificates, projects, posts } = content;

  const safeExperiences = actualRecords(experiences);
  const safeCerts = actualRecords(certificates);
  const safeProjects = actualRecords(projects);
  const safePosts = actualRecords(posts);
  const [typedText, setTypedText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [isDeletingRole, setIsDeletingRole] = useState(false);
  const [activeProject, setActiveProject] = useState(0);
  const [isPreviewPaused, setIsPreviewPaused] = useState(false);
  const previewDelay = 4200;

  const typingPhrases = useMemo(
    () => {
      if (profile.roles && profile.roles.length > 0) {
        return [profile.role, ...profile.roles].filter(Boolean);
      }
      return [
        profile.role,
        "Real-time AI systems builder",
        "Full-stack web application developer",
        "Computer vision and data science creator",
      ].filter(Boolean);
    },
    [profile.role, profile.roles]
  );
  const currentTypingPhrase = typingPhrases[typingIndex % Math.max(typingPhrases.length, 1)] || "";

  const featuredProjects = useMemo(
    () =>
      [...safeProjects]
        .sort((a, b) => (a.featuredRank || 999) - (b.featuredRank || 999))
        .slice(0, 5),
    [safeProjects]
  );

  const activeProjectData = featuredProjects[activeProject % Math.max(featuredProjects.length, 1)];
  const nextProjectData = featuredProjects.length > 1
    ? featuredProjects[(activeProject + 1) % featuredProjects.length]
    : null;

  useEffect(() => {
    if (!currentTypingPhrase) return undefined;

    if (!isDeletingRole && typedText.length < currentTypingPhrase.length) {
      const timer = setTimeout(() => {
        setTypedText(currentTypingPhrase.slice(0, typedText.length + 1));
      }, 42);
      return () => clearTimeout(timer);
    }

    if (!isDeletingRole) {
      const timer = setTimeout(() => setIsDeletingRole(true), 1300);
      return () => clearTimeout(timer);
    }

    if (typedText.length > 0) {
      const timer = setTimeout(() => {
        setTypedText(currentTypingPhrase.slice(0, typedText.length - 1));
      }, 24);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setTypingIndex((index) => (index + 1) % typingPhrases.length);
      setIsDeletingRole(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [currentTypingPhrase, isDeletingRole, typedText, typingPhrases.length]);

  useEffect(() => {
    if (featuredProjects.length < 2 || isPreviewPaused) return undefined;
    const timer = setTimeout(() => {
      setActiveProject((index) => (index + 1) % featuredProjects.length);
    }, previewDelay);
    return () => clearTimeout(timer);
  }, [activeProject, featuredProjects.length, isPreviewPaused]);

  const changeProject = (direction) => {
    if (!featuredProjects.length) return;
    setActiveProject((index) => (index + direction + featuredProjects.length) % featuredProjects.length);
  };

  const stats = [
    { label: siteLabel(profile, "statProjects"), value: String(safeProjects.length).padStart(2, "0") },
    { label: siteLabel(profile, "statExperience"), value: String(safeExperiences.length).padStart(2, "0") },
    { label: siteLabel(profile, "statCertificates"), value: String(safeCerts.length).padStart(2, "0") }
  ];

  const latestPosts = useMemo(
    () =>
      [...safePosts]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 3),
    [safePosts]
  );

  const internalLinks = [
    { label: siteLabel(profile, "linkProjects"), to: "/projects", icon: <Github size={18} /> },
    { label: siteLabel(profile, "linkCertificates"), to: "/certificates", icon: <Award size={18} /> },
    { label: siteLabel(profile, "linkAcademic"), to: "/about", icon: <GraduationCap size={18} /> },
    { label: siteLabel(profile, "linkExperience"), to: "/about", icon: <BriefcaseBusiness size={18} /> },
    { label: siteLabel(profile, "linkBlog"), to: "/blog", icon: <Mail size={18} /> }
  ];

  const externalLinks = [
    { label: siteLabel(profile, "githubButton"), href: profile.github, icon: <ExternalLink size={18} /> },
    profile.instagram
      ? { label: siteLabel(profile, "instagramButton"), href: profile.instagram, icon: <ExternalLink size={18} /> }
      : null,
  ].filter(Boolean);

  const nameParts = (profile.name || "Jirathiwat Suntipreedatham").split(" ");
  const givenName = nameParts.slice(0, -1).join(" ") || nameParts[0];
  const familyName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  const personaMarks = Array.isArray(profile.persona) && profile.persona.length
    ? profile.persona
    : [
        "CEO — Snail.aes",
        "President — MU Shooting",
        "MUICT · ICT22",
        "MU 135",
        profile.location || "Bangkok, Thailand",
        "Vol. MMXXVI"
      ];
  const tickerMarks = [...personaMarks, ...personaMarks];

  return (
    <div className="home-cinematic-page">
      <HeroCinematicBackdrop className="home-cinematic-background" />
      <HomeServerRoomModel />
      <section className="hero-section hero-editorial">
        <HeroSignalField />
        <div className="hero-split reveal is-visible">
          <div className="hero-copy-col">
            <p className="hero-greeting">
              {language === "th"
                ? siteLabel(profile, "heroGreetingTh")
                : language === "zh-CN"
                ? siteLabel(profile, "heroGreetingZh")
                : siteLabel(profile, "heroGreeting")}
            </p>
            <h1 className="hero-title">
              <span>{givenName}</span>
              {familyName ? <span>{familyName}</span> : null}
            </h1>
            <p className="hero-copy">{profile.headline}</p>
            <div className="hero-actions">
              <Link className="primary-button" to="/about">
                {siteLabel(profile, "heroContact")}
                <ArrowRight size={18} />
              </Link>
              <Link className="secondary-button" to="/projects">
                {siteLabel(profile, "heroWork")}
              </Link>
            </div>
            <div className="command-bar" aria-label="Current role">
              <Sparkles size={14} />
              <span>{typedText || currentTypingPhrase || profile.role}</span>
            </div>
            <div className="signal-panel">
              {stats.map((stat) => (
                <div className="stat" key={stat.label}>
                  <RandomNumber value={stat.value} />
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          {profile.avatar && (
            <div className="hero-seal-col">
              <div className="hero-seal" tabIndex={0} aria-label={`${profile.name} portrait`}>
                <img src={resolveMediaUrl(profile.avatar)} alt="" />
              </div>
              <p className="hero-seal-caption" aria-hidden="true">
                <span>{siteLabel(profile, "portraitIndex")}</span>
                <span>{siteLabel(profile, "portraitCaption")}</span>
              </p>
            </div>
          )}
        </div>
        <div className="hero-ticker" aria-hidden="true">
          <div className="hero-ticker-track">
            {tickerMarks.map((mark, index) => (
              <span key={`${mark}-${index}`}>
                <i />
                {mark}
              </span>
            ))}
          </div>
        </div>
      </section>

      <StillGrid profile={profile} />

      {activeProjectData && (
        <section
          className="section project-showcase-section reveal"
          onMouseEnter={() => setIsPreviewPaused(true)}
          onMouseLeave={() => setIsPreviewPaused(false)}
          onFocus={() => setIsPreviewPaused(true)}
          onBlur={() => setIsPreviewPaused(false)}
        >
          <div className="section-kicker">
            <Rocket size={16} />
            {siteLabel(profile, "kickerWorks")}
          </div>
          <div className="section-heading">
            <h2>{profile.headings?.homeProjectsTitle || "Featured Projects"}</h2>
            <p className="section-note">{profile.headings?.homeProjectsDesc || "A showcase of my recent work in software engineering, AI, and full-stack development."}</p>
          </div>

          <div className={isPreviewPaused ? "project-autoplay is-paused" : "project-autoplay"}>
            <span
              key={activeProject}
              style={{ "--preview-delay": `${previewDelay}ms` }}
            />
          </div>

          <div className="project-showcase">
            <div className="project-preview-column">
              <Link className="project-preview-stage" to={`/projects/${activeProjectData.id}`}>
                {activeProjectData.imageUrl && (
                  <>
                    <img className="thumb-fill" src={resolveMediaUrl(activeProjectData.imageUrl)} alt="" aria-hidden="true" />
                    <img className="thumb-subject" src={resolveMediaUrl(activeProjectData.imageUrl)} alt={activeProjectData.name} />
                  </>
                )}
                <div className="project-scanline" />
                <div className="project-preview-badge">
                  <Code2 size={16} />
                  {activeProjectData.language || siteLabel(profile, "projectFallback")}
                </div>
              </Link>

              <div className="project-stepper" aria-label="Project stream control">
                <div>
                  <span>
                    {String(activeProject + 1).padStart(2, "0")} / {String(featuredProjects.length).padStart(2, "0")}
                  </span>
                  <strong>{nextProjectData ? `${siteLabel(profile, "nextPrefix")} ${nextProjectData.name}` : activeProjectData.name}</strong>
                </div>
                {nextProjectData && (
                  <button className="icon-button" onClick={() => changeProject(1)} aria-label="Move to next project">
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="project-preview-copy">
              <span className="project-count">
                {String(activeProject + 1).padStart(2, "0")} / {String(featuredProjects.length).padStart(2, "0")}
              </span>
              <h3>{activeProjectData.name}</h3>
              <p>{activeProjectData.description}</p>
              <div className="project-highlights mini">
                {(activeProjectData.highlights || []).slice(0, 3).map((highlight) => (
                  <span key={highlight}>{highlight}</span>
                ))}
              </div>
              <div className="project-slider-actions">
                <button className="icon-button" onClick={() => changeProject(-1)} aria-label="Previous project">
                  <ChevronLeft size={18} />
                </button>
                <button className="icon-button" onClick={() => changeProject(1)} aria-label="Next project">
                  <ChevronRight size={18} />
                </button>
                <Link className="primary-button" to={`/projects/${activeProjectData.id}`}>
                  {siteLabel(profile, "viewPiece")}
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {latestPosts.length > 0 && (
        <section className="section home-blog-section reveal">
          <div className="section-kicker">
            <Newspaper size={16} />
            {siteLabel(profile, "kickerJournal")}
          </div>
          <div className="section-heading">
            <h2>{profile.headings?.blogTitle || "Latest posts"}</h2>
            <p className="section-note">{profile.headings?.blogDesc || "Thoughts, news, and technical articles."}</p>
          </div>
          <div className="home-post-grid">
            {latestPosts.map((post) => (
              <Link className="home-post-card" key={post.id} to={`/blog/${post.id}`}>
                {post.imageUrl && (
                  <span className="home-post-media thumb">
                    <img
                      src={resolveMediaUrl(post.imageUrl)}
                      alt=""
                      loading="lazy"
                      onError={(event) => {
                        const frame = event.currentTarget.closest(".thumb");
                        if (frame) frame.hidden = true;
                      }}
                    />
                  </span>
                )}
                <div className="home-post-copy">
                  <div className="post-meta">
                    <span>{post.category || siteLabel(profile, "postFallback")}</span>
                    <span>
                      <CalendarDays size={14} />
                      {post.date || siteLabel(profile, "recentFallback")}
                    </span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.summary}</p>
                  <span className="read-more-link">
                    {siteLabel(profile, "readPost")}
                    <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section quick-section reveal">
        <div className="section-kicker">
          <LinkIcon size={16} />
          {siteLabel(profile, "kickerGallery")}
        </div>
        <div className="section-heading">
          <h2>{profile.headings?.homeUpdatesTitle || "Quick shortcuts"}</h2>
          <p className="section-note">{profile.headings?.homeUpdatesDesc || "Jump directly into the parts of the portfolio people usually want first."}</p>
        </div>
        <div className="feature-grid">
          {internalLinks.map((link, index) => (
            <Link className="feature-card" key={link.label} to={link.to}>
              <em>#{String(index + 1).padStart(2, "0")}</em>
              {link.icon}
              <strong>{link.label}</strong>
              <ArrowRight size={16} />
            </Link>
          ))}
          {externalLinks.map((link, index) => (
            <a className="feature-card" key={link.label} href={link.href} target="_blank" rel="noreferrer">
              <em>#{String(internalLinks.length + index + 1).padStart(2, "0")}</em>
              {link.icon}
              <strong>{link.label}</strong>
              <ArrowRight size={16} />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
