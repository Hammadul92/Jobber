import { useMemo } from "react";
import DOMPurify from "dompurify";
import "quill/dist/quill.snow.css";

export default function RichTextContent({
  html,
  className = "",
  editorClassName = "",
  emptyText = "No content added.",
}) {
  const sanitizedHtml = useMemo(
    () => DOMPurify.sanitize(html || ""),
    [html],
  );

  if (!sanitizedHtml || sanitizedHtml === "<p><br></p>") {
    return <p className={className || "text-slate-500"}>{emptyText}</p>;
  }

  return (
    <div className={`ql-snow ${className}`}>
      <div
        className={`ql-editor ${editorClassName}`}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
}
