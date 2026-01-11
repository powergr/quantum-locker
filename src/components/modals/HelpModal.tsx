import React, { useRef } from "react";
import ReactMarkdown from "react-markdown";
import { X, BookOpen } from "lucide-react";
// @ts-ignore
import helpContent from "../../assets/HELP.md?raw";

// 1. Extract raw text from React children (handles bold/italic in headers)
function extractText(children: any): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children?.props?.children) return extractText(children.props.children);
  return "";
}

// 2. Convert text to ID (Matches the links in HELP.md)
// Example: "🚀 Quick Start" -> "quick-start"
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-") // Spaces to dashes
    .replace(/[^\w\-]+/g, "") // Remove emojis and non-word chars
    .replace(/\-\-+/g, "-") // Collapse multiple dashes
    .replace(/^-+/, "") // Trim leading dash
    .replace(/-+$/, ""); // Trim trailing dash
}

export function HelpModal({ onClose }: { onClose: () => void }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 3. Custom Scroll Logic
  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const id = href.substring(1);
      const element = document.getElementById(id);
      const container = scrollContainerRef.current;

      if (element && container) {
        // Calculate position relative to the container
        const topPos = element.offsetTop - container.offsetTop;
        container.scrollTo({
          top: topPos,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="auth-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 650,
          maxWidth: "95vw",
          height: "85vh",
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

        {/* Attach Ref to the scrollable container */}
        <div
          className="modal-body"
          ref={scrollContainerRef}
          style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: 15,
            scrollBehavior: "smooth",
          }}
        >
          <div className="markdown-content">
            <ReactMarkdown
              components={{
                // Custom H2 Renderer to attach IDs
                h2: ({ node, children, ...props }) => {
                  const text = extractText(children);
                  const id = slugify(text);
                  return (
                    <h2 id={id} {...props} style={{ scrollMarginTop: "20px" }}>
                      {children}
                    </h2>
                  );
                },
                // Custom H3 Renderer
                h3: ({ node, children, ...props }) => {
                  const text = extractText(children);
                  const id = slugify(text);
                  return (
                    <h3 id={id} {...props} style={{ scrollMarginTop: "20px" }}>
                      {children}
                    </h3>
                  );
                },
                // Custom Link Renderer to intercept clicks
                a: ({ node, href, children, ...props }) => {
                  return (
                    <a
                      href={href}
                      onClick={(e) => handleLinkClick(e, href || "")}
                      style={{
                        cursor: "pointer",
                        color: "var(--accent)",
                        textDecoration: "none",
                      }}
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
