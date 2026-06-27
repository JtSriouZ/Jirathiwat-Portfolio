import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { getUrlLabel, getYoutubeEmbedUrl, isImageUrl, resolveMediaUrl } from "../utils";

function splitValueAndCaption(value = "") {
  const [urlPart, ...captionParts] = String(value).split("|");
  return {
    url: urlPart.trim(),
    caption: captionParts.join("|").trim()
  };
}

function normalizeMediaReference(value, mediaUrls = []) {
  const { url, caption } = splitValueAndCaption(value);
  const indexMatch = url.match(/^\d+$/);
  if (indexMatch) {
    const index = Number(url) - 1;
    return { url: mediaUrls[index] || "", caption, mediaIndex: index };
  }
  return { url, caption, mediaIndex: null };
}

function parseInlineMediaLine(line, mediaUrls = []) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const markdownImage = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (markdownImage) {
    return {
      type: "media",
      mediaType: "image",
      url: markdownImage[2].trim(),
      caption: markdownImage[1].trim(),
      mediaIndex: null
    };
  }

  const directive = trimmed.match(/^\[(media|image|video|youtube|link):\s*(.+)\]$/i);
  if (directive) {
    const kind = directive[1].toLowerCase();
    const media = normalizeMediaReference(directive[2], mediaUrls);
    return {
      type: kind === "link" ? "link" : "media",
      mediaType: kind,
      ...media
    };
  }

  const directMedia = getYoutubeEmbedUrl(trimmed) || /\.(mp4|webm|ogg|avif|bmp|gif|ico|jpe?g|png|svg|webp)(\?.*)?$/i.test(trimmed);
  if (directMedia) {
    return { type: "media", mediaType: "media", url: trimmed, caption: "", mediaIndex: null };
  }

  return null;
}

export function getInlineMediaUsage(text = "", mediaUrls = []) {
  const usedIndexes = new Set();
  const usedUrls = new Set();

  String(text || "").split(/\r?\n/).forEach((line) => {
    const block = parseInlineMediaLine(line, mediaUrls);
    if (!block) return;
    if (typeof block.mediaIndex === "number" && block.mediaIndex >= 0) {
      usedIndexes.add(block.mediaIndex);
    }
    if (block.url) {
      usedUrls.add(block.url);
    }
  });

  return { usedIndexes, usedUrls };
}

function renderInlineText(text) {
  const parts = [];
  const pattern = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\*([^*]+)\*)|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      parts.push(<strong key={`strong-${match.index}`}>{match[2]}</strong>);
    } else if (match[4]) {
      parts.push(<code key={`code-${match.index}`}>{match[4]}</code>);
    } else if (match[6]) {
      parts.push(<em key={`em-${match.index}`}>{match[6]}</em>);
    } else if (match[7] && match[8]) {
      parts.push(
        <a key={`${match[8]}-${match.index}`} href={match[8]} target="_blank" rel="noreferrer">
          {match[7]}
        </a>
      );
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function InlineMediaBlock({ block, itemTitle }) {
  const resolvedUrl = resolveMediaUrl(block.url);
  const youtubeEmbed = getYoutubeEmbedUrl(block.url);
  const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(block.url || "");
  const caption = block.caption;

  if (!block.url) return null;

  if (block.type === "link") {
    return (
      <a className="rich-link-card" href={block.url} target="_blank" rel="noreferrer">
        <span className="media-link-icon">
          <LinkIcon size={18} />
        </span>
        <span>
          <strong>{caption || getUrlLabel(block.url)}</strong>
          <small>{block.url}</small>
        </span>
        <ExternalLink size={17} />
      </a>
    );
  }

  if (youtubeEmbed) {
    return (
      <figure className="rich-media-block rich-media-video">
        <iframe src={youtubeEmbed} title={caption || `${itemTitle} video`} allowFullScreen loading="lazy" />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    );
  }

  if (isVideo) {
    return (
      <figure className="rich-media-block rich-media-video">
        <video src={resolvedUrl} controls />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    );
  }

  if (isImageUrl(block.url)) {
    return (
      <figure className="rich-media-block">
        <a href={resolvedUrl} target="_blank" rel="noreferrer">
          <img src={resolvedUrl} alt={caption || itemTitle} loading="lazy" />
        </a>
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    );
  }

  return (
    <a className="rich-link-card" href={block.url} target="_blank" rel="noreferrer">
      <span className="media-link-icon">
        <LinkIcon size={18} />
      </span>
      <span>
        <strong>{caption || getUrlLabel(block.url)}</strong>
        <small>{block.url}</small>
      </span>
      <ExternalLink size={17} />
    </a>
  );
}

export default function RichContent({ text = "", mediaUrls = [], itemTitle = "Content media" }) {
  const blocks = [];
  let paragraphLines = [];
  let listBlock = null;

  const flushParagraph = () => {
    const paragraph = paragraphLines.join(" ").trim();
    if (paragraph) {
      blocks.push({ type: "paragraph", text: paragraph });
    }
    paragraphLines = [];
  };

  const flushList = () => {
    if (listBlock?.items?.length) {
      blocks.push(listBlock);
    }
    listBlock = null;
  };

  const pushListItem = (ordered, textValue) => {
    flushParagraph();
    if (!listBlock || listBlock.ordered !== ordered) {
      flushList();
      listBlock = { type: "list", ordered, items: [] };
    }
    listBlock.items.push(textValue.trim());
  };

  String(text || "").split(/\r?\n/).forEach((line) => {
    const inlineMedia = parseInlineMediaLine(line, mediaUrls);
    if (inlineMedia) {
      flushParagraph();
      flushList();
      blocks.push(inlineMedia);
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }

    const headingMatch = line.match(/^(#{2,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", level: headingMatch[1].length, text: headingMatch[2].trim() });
      return;
    }

    const quoteMatch = line.match(/^>\s+(.+)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: "quote", text: quoteMatch[1].trim() });
      return;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      pushListItem(false, bulletMatch[1]);
      return;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      pushListItem(true, orderedMatch[1]);
      return;
    }

    flushList();
    paragraphLines.push(line.trim());
  });

  flushParagraph();
  flushList();

  if (!blocks.length) return null;

  return (
    <div className="rich-content">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return <p key={`paragraph-${index}`}>{renderInlineText(block.text)}</p>;
        }
        if (block.type === "heading") {
          const HeadingTag = block.level <= 2 ? "h2" : block.level === 3 ? "h3" : "h4";
          return <HeadingTag key={`heading-${index}`}>{renderInlineText(block.text)}</HeadingTag>;
        }
        if (block.type === "quote") {
          return <blockquote key={`quote-${index}`}>{renderInlineText(block.text)}</blockquote>;
        }
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={`list-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{renderInlineText(item)}</li>
              ))}
            </ListTag>
          );
        }
        return <InlineMediaBlock key={`${block.type}-${index}-${block.url}`} block={block} itemTitle={itemTitle} />;
      })}
    </div>
  );
}
