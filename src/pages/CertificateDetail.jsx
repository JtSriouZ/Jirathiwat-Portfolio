import { useParams, Link } from "react-router-dom";
import { ExternalLink, ArrowLeft, Calendar, Award } from "lucide-react";
import CertificateVisual from "../components/CertificateVisual";
import MediaGallery from "../components/MediaGallery";
import { normalizeList } from "../utils";

export default function CertificateDetail({ content }) {
  const { id } = useParams();
  const { certificates = [] } = content;
  
  const certificate = certificates.find((c) => c.id === id);

  if (!certificate) {
    return (
      <div className="page-content" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <h2>Certificate Not Found</h2>
        <p>The certificate you are looking for does not exist.</p>
        <br />
        <Link to="/certificates" className="primary-button">Back to Certificates</Link>
      </div>
    );
  }

  const skills = normalizeList(certificate.skills);
  const mediaUrls = normalizeList(certificate.mediaUrls);
  
  const descriptionText = certificate.fullDescription || certificate.description;
  const descriptionParagraphs = descriptionText ? descriptionText.split('\n').filter(p => p.trim() !== '') : [];

  return (
    <div className="page-content">
      <section className="section project-detail-section reveal is-visible">
        <div className="project-detail-header">
          <Link to="/certificates" className="ghost-button" style={{ display: "inline-flex", marginBottom: "2rem" }}>
            <ArrowLeft size={16} />
            Back to Certificates
          </Link>
          
          <div className="post-meta" style={{ marginBottom: "1rem" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Award size={14} />
              {certificate.issuer || "Certificate"}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={14} />
              {certificate.date || "Recent"}
            </span>
          </div>
          
          <h1 style={{ fontSize: "2.5rem", marginBottom: "1.5rem" }}>{certificate.title}</h1>
          
          <div className="project-actions" style={{ marginBottom: "2rem" }}>
            {certificate.credentialUrl && (
              <a className="primary-button" href={certificate.credentialUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                View Credential
              </a>
            )}
          </div>
        </div>

        <CertificateVisual certificate={certificate} variant="detail" />

        <div className="project-detail-content" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2>About the Certificate</h2>
          <div style={{ marginBottom: "2rem" }}>
            {descriptionParagraphs.map((para, idx) => (
              <p key={idx} style={{ fontSize: "1.1rem", lineHeight: "1.8", marginBottom: "1rem" }}>{para}</p>
            ))}
          </div>

          <MediaGallery urls={mediaUrls} itemTitle="Certificate media" />

          {skills.length > 0 && (
            <>
              <h3>Skills Acquired</h3>
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
