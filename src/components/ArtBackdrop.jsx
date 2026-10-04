import { useEffect, useRef, useState } from "react";
import { artBrightness, measureArtLuma } from "../europeanArt";

const MOTIONS = ["kb-a", "kb-b", "kb-c", "kb-d"];
const FADE_MS = 2200;

export default function ArtBackdrop({ src }) {
  const [layers, setLayers] = useState([]);
  const countRef = useRef(0);

  useEffect(() => {
    if (!src) return undefined;
    let cancelled = false;
    measureArtLuma(src).then((luma) => {
      if (cancelled) return;
      countRef.current += 1;
      const layer = {
        id: countRef.current,
        src,
        brightness: artBrightness(luma),
        motion: MOTIONS[Math.floor(Math.random() * MOTIONS.length)],
      };
      setLayers((current) => [...current.slice(-1).map((old) => ({ ...old, leaving: true })), layer]);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (!layers.some((layer) => layer.leaving)) return undefined;
    const timer = window.setTimeout(() => {
      setLayers((current) => current.filter((layer) => !layer.leaving));
    }, FADE_MS + 200);
    return () => window.clearTimeout(timer);
  }, [layers]);

  return (
    <div className="page-art-stage">
      {layers.map((layer) => (
        <div
          key={layer.id}
          className={`page-art is-${layer.motion}${layer.leaving ? " is-leaving" : ""}`}
          style={{ backgroundImage: `url("${layer.src}")`, "--art-brightness": layer.brightness }}
        />
      ))}
    </div>
  );
}
