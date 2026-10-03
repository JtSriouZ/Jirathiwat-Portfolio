import { useEffect, useMemo, useRef, useState } from "react";
import { resolveMediaUrl } from "../utils";

const HOLD_MS = 5200;

const CROP = {
  "profile-photo.png": "50% 24%",
  "instagram/07.jpg": "50% 18%",
  "instagram/05.jpg": "40% 12%"
};

export function hasPortrait(profile) {
  return portraitList(profile).length > 0;
}

function portraitList(profile) {
  const listed = Array.isArray(profile?.avatars) ? profile.avatars : [];
  const source = listed.length
    ? listed
    : [profile?.avatar, "instagram/07.jpg", "instagram/05.jpg"];
  return source
    .map((item) => {
      if (typeof item === "string") return { src: item, crop: CROP[item] || "50% 20%" };
      return {
        src: item?.image || "",
        crop: item?.crop || CROP[item?.image] || "50% 20%"
      };
    })
    .filter((item) => item.src);
}

export default function PortraitReel({ profile, alt = "", onIndex }) {
  const portraits = useMemo(() => portraitList(profile), [profile]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const rootRef = useRef(null);
  const onIndexRef = useRef(onIndex);
  onIndexRef.current = onIndex;

  useEffect(() => {
    onIndexRef.current?.(index);
  }, [index]);

  useEffect(() => {
    const host = rootRef.current?.closest(".hero-seal, .about-portrait-wrap");
    if (!host || portraits.length < 2) return undefined;

    const enter = () => setPaused(true);
    const leave = () => setPaused(false);
    const advance = (event) => {
      if (event.target.closest("a, button")) return;
      setIndex((current) => (current + 1) % portraits.length);
    };

    host.addEventListener("mouseenter", enter);
    host.addEventListener("mouseleave", leave);
    host.addEventListener("click", advance);
    return () => {
      host.removeEventListener("mouseenter", enter);
      host.removeEventListener("mouseleave", leave);
      host.removeEventListener("click", advance);
    };
  }, [portraits.length]);

  useEffect(() => {
    if (paused || portraits.length < 2) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % portraits.length);
    }, HOLD_MS);
    return () => window.clearInterval(timer);
  }, [paused, portraits.length, index]);

  if (!portraits.length) return null;

  return portraits.map((item, itemIndex) => (
    <img
      key={item.src}
      ref={itemIndex === 0 ? rootRef : undefined}
      className={itemIndex === index ? "is-current" : ""}
      src={resolveMediaUrl(item.src)}
      alt={itemIndex === index ? alt : ""}
      style={{ objectPosition: item.crop }}
      draggable="false"
    />
  ));
}
