export const siteCopyGroups = [
  {
    title: "Navigation",
    fields: [
      ["brand", "Brand name", "Jirathiwat"],
      ["navHome", "Nav · Home", "Home"],
      ["navProjects", "Nav · Projects", "Projects"],
      ["navCertificates", "Nav · Certificates", "Certificates"],
      ["navSkills", "Nav · Skills", "Skills"],
      ["navAbout", "Nav · About", "About"],
      ["navBlog", "Nav · Blog", "Blog"],
      ["navAdmin", "Nav · Admin", "Admin"],
    ],
  },
  {
    title: "Home hero",
    fields: [
      ["heroGreeting", "Greeting", "@jtsriouz_o · Bangkok · Night"],
      ["heroGreetingTh", "Greeting · Thai", "สวัสดี ผม Jirathiwat"],
      ["heroGreetingZh", "Greeting · Chinese", "你好，我是 Jirathiwat"],
      ["heroContact", "Primary button", "Contact"],
      ["heroWork", "Secondary button", "View the work"],
      ["portraitIndex", "Portrait index", "Fig. I"],
      ["portraitFig", "Portrait figure prefix", "Fig."],
      ["portraitCaption", "Portrait caption", "Portrait · Bangkok"],
      ["statProjects", "Count label · Projects", "Projects"],
      ["statExperience", "Count label · Experience", "Experience"],
      ["statCertificates", "Count label · Certificates", "Certificates"],
    ],
  },
  {
    title: "Home sections",
    fields: [
      ["kickerWorks", "Featured projects kicker", "Curated Works"],
      ["viewPiece", "Featured project button", "View the piece"],
      ["nextPrefix", "Next project prefix", "Next:"],
      ["kickerJournal", "Latest posts kicker", "The Journal"],
      ["readPost", "Home post link", "Read post"],
      ["kickerGallery", "Shortcuts kicker", "The Gallery"],
      ["linkProjects", "Shortcut · Projects", "Projects"],
      ["linkCertificates", "Shortcut · Certificates", "Certificates"],
      ["linkAcademic", "Shortcut · Academic path", "Academic Path"],
      ["linkExperience", "Shortcut · Experience", "Experience"],
      ["linkBlog", "Shortcut · Blog", "Blog"],
      ["instagramButton", "Instagram button", "Instagram"],
    ],
  },
  {
    title: "About",
    fields: [
      ["kickerProfile", "Profile kicker", "Profile"],
      ["availability", "Status line", "Available for software engineering work"],
      ["company", "Company line", "IT CITY Public Company Limited"],
      ["metricExperience", "Metric · Experience", "Experience"],
      ["metricAcademic", "Metric · Academic", "Academic"],
      ["metricSkills", "Metric · Skills", "Core skills"],
      ["kickerExperience", "Work history kicker", "Experience"],
      ["kickerEducation", "Education kicker", "Education"],
    ],
  },
  {
    title: "Projects",
    fields: [
      ["kickerProjects", "Projects kicker", "GitHub"],
      ["githubButton", "GitHub button", "GitHub"],
      ["viewDetails", "View details button", "View Details"],
      ["repoButton", "Repository button", "Repo"],
      ["repositoryButton", "Repository button on detail", "Repository"],
      ["liveButton", "Live button", "Live"],
      ["liveDemo", "Live demo button", "Live Demo"],
      ["aboutProject", "Detail heading", "About the Project"],
      ["keyFeatures", "Highlights heading", "Key Features & Highlights"],
      ["technologiesUsed", "Skills heading", "Technologies Used"],
      ["backToProjects", "Back link", "Back to Projects"],
      ["projectMissing", "Missing title", "Project Not Found"],
      ["projectMissingNote", "Missing note", "The project you are looking for does not exist."],
      ["recentFallback", "Empty date label", "Recent"],
      ["projectFallback", "Empty language label", "Project"],
    ],
  },
  {
    title: "Certificates",
    fields: [
      ["kickerCertificates", "Certificates kicker", "Archive"],
      ["credentialButton", "Credential button", "Credential"],
      ["viewCredential", "Detail credential button", "View Credential"],
      ["aboutCertificate", "Detail heading", "About the Certificate"],
      ["skillsAcquired", "Skills heading", "Skills Acquired"],
      ["backToCertificates", "Back link", "Back to Certificates"],
      ["certificateMissing", "Missing title", "Certificate Not Found"],
      ["certificateMissingNote", "Missing note", "The certificate you are looking for does not exist."],
      ["certificateFallback", "Empty issuer label", "Certificate"],
    ],
  },
  {
    title: "Blog",
    fields: [
      ["kickerBlog", "Blog kicker", "News"],
      ["readMore", "Read more button", "Read More"],
      ["readArticle", "External article button", "Read Full Article"],
      ["backToBlog", "Back link", "Back to Blog"],
      ["postMissing", "Missing title", "Post Not Found"],
      ["postMissingNote", "Missing note", "The blog post you are looking for does not exist."],
      ["postFallback", "Empty category label", "Post"],
    ],
  },
  {
    title: "Skills and stills",
    fields: [
      ["kickerSkills", "Skills kicker", "Expertise"],
      ["kickerStills", "Instagram stills kicker", "Stills"],
    ],
  },
  {
    title: "Footer and language",
    fields: [
      ["footerBlurb", "Footer description", "Software Engineer, AI & Full-Stack Developer in Bangkok City, Thailand."],
      ["footerStatus", "Footer status", "Atelier open · MMXXVI"],
      ["footerExplore", "Footer · Explore", "Explore"],
      ["footerConnect", "Footer · Connect", "Connect"],
      ["footerShare", "Footer · Share", "Share"],
      ["copyLink", "Copy link button", "Copy Link"],
      ["translateTitle", "Language modal title", "Translate website"],
      ["translateNote", "Language modal note", "Pick a language to automatically translate this page."],
      ["translateCredit", "Language modal credit", "Powered by Google Translate"],
      ["soundOn", "Sound control, playing", "Sound on"],
      ["soundOff", "Sound control, quiet", "Sound"],
      ["soundSkip", "Sound control, next track", "Skip"],
      ["soundMute", "Sound control, mute", "Mute"],
      ["soundUnmute", "Sound control, unmute", "Hear"],
      ["soundVolume", "Sound control, volume", "Volume"],
      ["soundSink", "Sound control, tuck away", "Sink player"],
      ["soundRaise", "Sound control, open", "Open player"],
    ],
  },
];

export const siteCopy = Object.fromEntries(
  siteCopyGroups.flatMap((group) => group.fields.map(([key, , value]) => [key, value]))
);

export function siteLabel(profile, key) {
  const value = profile?.labels?.[key];
  if (value == null) return siteCopy[key] ?? "";
  return value;
}
