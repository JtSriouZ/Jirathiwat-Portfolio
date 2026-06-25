import { Newspaper, CalendarDays, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { resolveMediaUrl, getYoutubeEmbedUrl } from "../utils";

export default function Blog({ content }) {
  const { posts = [], profile = {} } = content;

  return (
    <div className="page-content">
      <section className="section news-section reveal" id="news">
        <div className="section-heading">
          <div>
            <div className="section-kicker">
              <Newspaper size={18} />
              News
            </div>
            <h2>{profile.headings?.blogTitle || "Latest posts"}</h2>
            <p className="section-note">{profile.headings?.blogDesc || "Thoughts, news, and technical articles."}</p>
          </div>
        </div>
        <div className="post-grid">
          {posts.map((post) => (
            <article className="post-card" key={post.id}>
              {post.imageUrl && (
                <Link to={`/blog/${post.id}`} style={{ display: "block" }}>
                  <img className="post-image" src={resolveMediaUrl(post.imageUrl)} alt="" loading="lazy" />
                </Link>
              )}
              <div className="post-meta">
                <span>{post.category}</span>
                <span>
                  <CalendarDays size={14} />
                  {post.date}
                </span>
              </div>
              <h3>
                <Link to={`/blog/${post.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                  {post.title}
                </Link>
              </h3>
              <p>{post.summary}</p>
              {getYoutubeEmbedUrl(post.youtubeUrl) && (
                <div className="video-frame">
                  <iframe
                    src={getYoutubeEmbedUrl(post.youtubeUrl)}
                    title={`${post.title} video`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              )}
              <div className="project-actions" style={{ marginTop: "1.5rem" }}>
                <Link className="primary-button" to={`/blog/${post.id}`}>
                  Read More
                  <ArrowRight size={16} style={{ marginLeft: 4 }} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
