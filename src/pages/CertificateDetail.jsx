import { useParams, Link } from "react-router-dom";
import { ExternalLink, ArrowLeft, Calendar, Award } from "lucide-react";
import CertificateVisual from "../components/CertificateVisual";
import MediaGallery from "../components/MediaGallery";
import RichContent from "../components/RichContent";
import { normalizeList } from "../utils";
import { siteLabel } from "../siteCopy";

export default function CertificateDetail({ content }) {
  const { id } = useParams();
  const { certificates = [], profile = {} } = content;
  
  const certificate = certificates.find((c) => c.id === id);

  if (!certificate) {
    return (
      <div className="page-content detail-missing">
        <h2>{siteLabel(profile, "certificateMissing")}</h2>
        <p>{siteLabel(profile, "certificateMissingNote")}</p>
        <br />
        <Link to="/certificates" className="primary-button">{siteLabel(profile, "backToCertificates")}</Link>
      </div>
    );
  }

  const skills = normalizeList(certificate.skills);
  const mediaUrls = normalizeList(certificate.mediaUrls);
  
  const descriptionText = certificate.fullDescription || certificate.description;

  return (
    <div className="page-content">
      <section className="section project-detail-section reveal is-visible">
        <div className="project-detail-header">
          <Link to="/certificates" className="ghost-button" style={{ display: "inline-flex", marginBottom: "2rem" }}>
            <ArrowLeft size={16} />
            {siteLabel(profile, "backToCertificates")}
          </Link>
          
          <div className="post-meta" style={{ marginBottom: "1rem" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Award size={14} />
              {certificate.issuer || siteLabel(profile, "certificateFallback")}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={14} />
              {certificate.date || siteLabel(profile, "recentFallback")}
            </span>
          </div>
          
          <h1 style={{ marginBottom: "1.5rem" }}>{certificate.title}</h1>
          
          <div className="project-actions" style={{ marginBottom: "2rem" }}>
            {certificate.credentialUrl && (
              <a className="primary-button" href={certificate.credentialUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                {siteLabel(profile, "viewCredential")}
              </a>
            )}
          </div>
        </div>

        <CertificateVisual certificate={certificate} variant="detail" />

        <div className="project-detail-content">
          <h2>{siteLabel(profile, "aboutCertificate")}</h2>
          <RichContent text={descriptionText} mediaUrls={mediaUrls} itemTitle={certificate.title} />

          <MediaGallery urls={mediaUrls} itemTitle="Certificate media" />

          {skills.length > 0 && (
            <>
              <h3>{siteLabel(profile, "skillsAcquired")}</h3>
              <div className="mini-skill-cloud">
                {skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
