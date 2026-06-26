import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { getUrlLabel, getYoutubeEmbedUrl, isImageUrl, resolveMediaUrl } from "../utils";

export default function MediaGallery({ urls = [], title = "Media Gallery", itemTitle = "Media" }) {
  if (!urls.length) return null;

  const mediaItems = urls
    .map((url, idx) => {
      const ytEmbed = getYoutubeEmbedUrl(url);
      const isVideo = Boolean(ytEmbed) || /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
      return { url, idx, ytEmbed, isVideo };
    })
    .sort((a, b) => Number(b.isVideo) - Number(a.isVideo) || a.idx - b.idx);

  return (
    <>
      <h3>{title}</h3>
      <div className="media-gallery">
        {mediaItems.map(({ url, idx, ytEmbed, isVideo }) => {
          const resolvedUrl = resolveMediaUrl(url);

          if (ytEmbed) {
            return (
              <div className="media-frame video-media" key={`${url}-${idx}`}>
                <iframe
                  src={ytEmbed}
                  allowFullScreen
                  title={`${itemTitle} video ${idx + 1}`}
                  loading="lazy"
                />
              </div>
            );
          }

          if (isVideo) {
            return (
              <div className="media-frame video-media" key={`${url}-${idx}`}>
                <video src={resolvedUrl} controls />
              </div>
            );
          }

          if (isImageUrl(url)) {
            return (
              <a className="media-frame image-media" key={`${url}-${idx}`} href={resolvedUrl} target="_blank" rel="noreferrer">
                <img src={resolvedUrl} alt={`${itemTitle} ${idx + 1}`} loading="lazy" />
              </a>
            );
          }

          return (
            <a className="media-link-card" key={`${url}-${idx}`} href={url} target="_blank" rel="noreferrer">
              <span className="media-link-icon">
                <LinkIcon size={18} />
              </span>
              <span>
                <strong>{getUrlLabel(url)}</strong>
                <small>{url}</small>
              </span>
              <ExternalLink size={17} />
            </a>
          );
        })}
      </div>
    </>
  );
}
