import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, FileText, ExternalLink } from "lucide-react";
import { resolveMediaUrl, getYoutubeEmbedUrl, normalizeList } from "../utils";
import { siteLabel } from "../siteCopy";
import MediaGallery from "../components/MediaGallery";
import RichContent from "../components/RichContent";

export default function PostDetail({ content }) {
  const { id } = useParams();
  const { posts = [], profile = {} } = content;
  
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return (
      <div className="page-content detail-missing">
        <h2>{siteLabel(profile, "postMissing")}</h2>
        <p>{siteLabel(profile, "postMissingNote")}</p>
        <br />
        <Link to="/blog" className="primary-button">{siteLabel(profile, "backToBlog")}</Link>
      </div>
    );
  }

  const mediaUrls = normalizeList(post.mediaUrls);
  
  const descriptionText = post.fullDescription || post.summary;
  
  // Check if we need to show youtube first
  const mainYoutubeEmbed = post.youtubeUrl ? getYoutubeEmbedUrl(post.youtubeUrl) : null;

  return (
    <div className="page-content">
      <section className="section project-detail-section reveal is-visible">
        <div className="project-detail-header">
          <Link to="/blog" className="ghost-button" style={{ display: "inline-flex", marginBottom: "2rem" }}>
            <ArrowLeft size={16} />
            {siteLabel(profile, "backToBlog")}
          </Link>
          
          <div className="post-meta" style={{ marginBottom: "1rem" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <FileText size={14} />
              {post.category || siteLabel(profile, "postFallback")}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={14} />
              {post.date || siteLabel(profile, "recentFallback")}
            </span>
          </div>
          
          <h1 style={{ marginBottom: "1.5rem" }}>{post.title}</h1>

          {post.externalUrl && (
            <div className="project-actions" style={{ marginBottom: "2rem" }}>
              <a className="primary-button" href={post.externalUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                {siteLabel(profile, "readArticle")}
              </a>
            </div>
          )}
        </div>

        {mainYoutubeEmbed ? (
          <div className="project-detail-image">
            <iframe src={mainYoutubeEmbed} style={{ width: "100%", height: "100%", border: "none", display: "block" }} allowFullScreen title="Post Video" />
          </div>
        ) : post.imageUrl ? (
          <div className="project-detail-image is-natural">
            <img src={resolveMediaUrl(post.imageUrl)} alt={post.title} style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        ) : null}

        <div className="project-detail-content">
          <RichContent text={descriptionText} mediaUrls={mediaUrls} itemTitle={post.title} />

          <MediaGallery urls={mediaUrls} itemTitle="Post media" />
        </div>
      </section>
    </div>
  );
}
