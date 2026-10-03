import { Award, ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import CertificateVisual from "../components/CertificateVisual";
import { normalizeList } from "../utils";
import { siteLabel } from "../siteCopy";

export default function Certificates({ content }) {
  const { certificates = [], profile = {} } = content;

  return (
    <div className="page-content">
      <section className="section certificates-section reveal" id="certificates">
        <div className="section-heading">
          <div>
            <div className="section-kicker">
              <Award size={18} />
              {siteLabel(profile, "kickerCertificates")}
            </div>
            <h2>{profile.headings?.certificatesTitle || "Certificates"}</h2>
            <p className="section-note">{profile.headings?.certificatesDesc || "A collection of my professional licenses, certificates, and achievements."}</p>
          </div>
        </div>
        <div className="certificate-grid card-masonry">
          {certificates.map((certificate) => (
            <article className="certificate-card" key={certificate.id}>
              <Link to={`/certificates/${certificate.id}`} style={{ display: "block" }} aria-label={`Open ${certificate.title}`}>
                <CertificateVisual certificate={certificate} />
              </Link>
              <div className="certificate-body">
                <div className="post-meta">
                  <span>{certificate.issuer || siteLabel(profile, "certificateFallback")}</span>
                  <span>{certificate.date || siteLabel(profile, "recentFallback")}</span>
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
                    {siteLabel(profile, "viewDetails")}
                    <ArrowRight size={16} style={{ marginLeft: 4 }} />
                  </Link>
                  {certificate.credentialUrl && (
                    <a className="secondary-button" href={certificate.credentialUrl} target="_blank" rel="noreferrer">
                      <ExternalLink size={16} />
                      {siteLabel(profile, "credentialButton")}
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
