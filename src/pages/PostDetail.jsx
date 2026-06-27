import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, FileText, ExternalLink } from "lucide-react";
import { resolveMediaUrl, getYoutubeEmbedUrl, normalizeList } from "../utils";
import MediaGallery from "../components/MediaGallery";
import RichContent from "../components/RichContent";

export default function PostDetail({ content }) {
  const { id } = useParams();
  const { posts = [] } = content;
  
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return (
      <div className="page-content" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <h2>Post Not Found</h2>
        <p>The blog post you are looking for does not exist.</p>
        <br />
        <Link to="/blog" className="primary-button">Back to Blog</Link>
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
            Back to Blog
          </Link>
          
          <div className="post-meta" style={{ marginBottom: "1rem" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <FileText size={14} />
              {post.category || "Post"}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={14} />
              {post.date || "Recent"}
            </span>
          </div>
          
          <h1 style={{ marginBottom: "1.5rem" }}>{post.title}</h1>

          {post.externalUrl && (
            <div className="project-actions" style={{ marginBottom: "2rem" }}>
              <a className="primary-button" href={post.externalUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                Read Full Article
              </a>
            </div>
          )}
        </div>

        {mainYoutubeEmbed ? (
          <div className="project-detail-image" style={{ marginBottom: "3rem", borderRadius: "12px", overflow: "hidden", aspectRatio: "16/9", border: "1px solid var(--line)" }}>
            <iframe src={mainYoutubeEmbed} style={{ width: "100%", height: "100%", border: "none", display: "block" }} allowFullScreen title="Post Video" />
          </div>
        ) : post.imageUrl ? (
          <div className="project-detail-image" style={{ marginBottom: "3rem", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--line)" }}>
            <img src={resolveMediaUrl(post.imageUrl)} alt={post.title} style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        ) : null}

        <div className="project-detail-content" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <RichContent text={descriptionText} mediaUrls={mediaUrls} itemTitle={post.title} />

          <MediaGallery urls={mediaUrls} itemTitle="Post media" />
        </div>
      </section>
    </div>
  );
}
