import ReactMarkdown from "react-markdown";
import { X, BookOpen } from "lucide-react";
// @ts-ignore
import helpContent from "../../assets/HELP.md?raw";

// Helper to convert "🚀 Quick Start" -> "quick-start"
function slugify(text: any): string {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars (emojis, punctuation)
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, ""); // Trim - from end
}

export function HelpModal({ onClose }: { onClose: () => void }) {
  // Custom logic to handle scrolling inside the modal div
  const handleScrollTo = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const id = href.substring(1);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="auth-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 600,
          maxWidth: "95vw",
          height: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="modal-header">
          <BookOpen size={20} color="var(--accent)" />
          <h2>Help Topics</h2>
          <div style={{ flex: 1 }}></div>
          <X size={20} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        <div
          className="modal-body"
          style={{ flex: 1, overflowY: "auto", paddingRight: 10 }}
        >
          <div className="markdown-content">
            <ReactMarkdown
              components={{
                // Auto-generate IDs for headers so links work
                h2: ({ node, children, ...props }) => {
                  const id = slugify(children);
                  return (
                    <h2 id={id} {...props}>
                      {children}
                    </h2>
                  );
                },
                h3: ({ node, children, ...props }) => {
                  const id = slugify(children);
                  return (
                    <h3 id={id} {...props}>
                      {children}
                    </h3>
                  );
                },
                // Intercept links to handle scrolling inside the div
                a: ({ node, href, children, ...props }) => {
                  return (
                    <a
                      href={href}
                      onClick={(e) => handleScrollTo(e, href || "")}
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {helpContent}
            </ReactMarkdown>
          </div>
        </div>

        <div
          style={{ padding: "15px 25px", borderTop: "1px solid var(--border)" }}
        >
          <button
            className="secondary-btn"
            style={{ width: "100%" }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
