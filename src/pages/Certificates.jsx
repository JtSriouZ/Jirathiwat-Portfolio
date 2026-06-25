import { Award, ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { normalizeList, resolveMediaUrl } from "../utils";

export default function Certificates({ content }) {
  const { certificates = [] } = content;

  return (
    <div className="page-content">
      <section className="section certificates-section reveal" id="certificates">
        <div className="section-heading">
          <div>
            <div className="section-kicker">
              <Award size={18} />
              Archive
            </div>
            <h2>Certificates</h2>
          </div>
        </div>
        <div className="certificate-grid">
          {certificates.map((certificate) => (
            <article className="certificate-card" key={certificate.id}>
              {certificate.imageUrl ? (
                <Link to={`/certificates/${certificate.id}`} style={{ display: "block" }}>
                  <img src={resolveMediaUrl(certificate.imageUrl)} alt="" loading="lazy" />
                </Link>
              ) : (
                <Link to={`/certificates/${certificate.id}`} style={{ display: "block" }}>
                  <div style={{
                    width: "100%",
                    height: "200px",
                    background: "linear-gradient(135deg, rgba(0,240,255,0.05) 0%, rgba(0,0,0,0.2) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderBottom: "1px solid var(--line)"
                  }}>
                    <div style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      background: "rgba(0,240,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--cyan)",
                      boxShadow: "0 0 20px rgba(0,240,255,0.15)"
                    }}>
                      <Award size={32} strokeWidth={1.5} />
                    </div>
                  </div>
                </Link>
              )}
              <div className="certificate-body">
                <div className="post-meta">
                  <span>{certificate.issuer || "Certificate"}</span>
                  <span>{certificate.date || "Recent"}</span>
                </div>
                <h3>
                  <Link to={`/certificates/${certificate.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {certificate.title}
                  </Link>
                </h3>
                <p>{certificate.description}</p>
                {normalizeList(certificate.skills).length > 0 && (
                  <div className="mini-skill-cloud">
                    {normalizeList(certificate.skills).map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                )}
                <div className="project-actions" style={{ marginTop: "1.5rem" }}>
                  <Link className="primary-button" to={`/certificates/${certificate.id}`}>
                    View Details
                    <ArrowRight size={16} style={{ marginLeft: 4 }} />
                  </Link>
                  {certificate.credentialUrl && (
                    <a className="secondary-button" href={certificate.credentialUrl} target="_blank" rel="noreferrer">
                      <ExternalLink size={16} />
                      Credential
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
