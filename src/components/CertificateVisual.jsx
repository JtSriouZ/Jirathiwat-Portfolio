import { Award, BadgeCheck, Sparkles } from "lucide-react";
import { resolveMediaUrl } from "../utils";

export default function CertificateVisual({ certificate, variant = "card" }) {
  const hasImage = Boolean(certificate?.imageUrl);
  const issuer = certificate?.issuer || "Verified achievement";
  const title = certificate?.title || "Certificate";

  return (
    <div className={`certificate-visual certificate-visual-${variant}${hasImage ? " has-image" : ""}`}>
      {hasImage ? (
        <img src={resolveMediaUrl(certificate.imageUrl)} alt={title} loading={variant === "detail" ? "eager" : "lazy"} />
      ) : (
        <div className="certificate-placeholder">
          <div className="certificate-orbit" aria-hidden="true" />
          <div className="certificate-sigil">
            <Award size={variant === "detail" ? 54 : 38} strokeWidth={1.35} />
          </div>
          <div className="certificate-placeholder-copy">
            <span>
              <Sparkles size={14} />
              Certificate archive
            </span>
            <strong>{issuer}</strong>
            <small>{title}</small>
          </div>
        </div>
      )}
      <div className="certificate-visual-badge">
        <BadgeCheck size={15} />
        Achievement
      </div>
    </div>
  );
}
