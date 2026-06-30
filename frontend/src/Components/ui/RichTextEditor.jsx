import { useEffect, useMemo, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const EMPTY_EDITOR_HTML = "<p><br></p>";

const countWords = (text) => {
  const normalized = text.trim();
  return normalized ? normalized.split(/\s+/).length : 0;
};

export default function RichTextEditor({
  id,
  label,
  value,
  onChange,
  maxWords,
  isRequired = false,
  isDisabled = false,
  placeholder = "",
  onWordCountChange = () => {},
  onLimitReached = () => {},
}) {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const previousDeltaRef = useRef(null);
  const previousHtmlRef = useRef(value || EMPTY_EDITOR_HTML);

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [false, 1, 2, 3, 4] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ align: [] }],
        ["blockquote", "link"],
        ["clean"],
      ],
    }),
    [],
  );

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

    const quill = new Quill(editorRef.current, {
      bounds: editorRef.current,
      modules,
      placeholder,
      readOnly: isDisabled,
      theme: "snow",
    });

    quillRef.current = quill;
    quill.clipboard.dangerouslyPasteHTML(value || EMPTY_EDITOR_HTML);
    previousDeltaRef.current = quill.getContents();
    previousHtmlRef.current = quill.root.innerHTML;
    onWordCountChange(countWords(quill.getText()));

    quill.on("text-change", () => {
      const nextWordCount = countWords(quill.getText());

      if (maxWords && nextWordCount > maxWords) {
        const currentSelection = quill.getSelection();
        quill.setContents(previousDeltaRef.current, "silent");
        if (currentSelection) {
          quill.setSelection(
            Math.max(0, currentSelection.index - 1),
            currentSelection.length,
            "silent",
          );
        }
        onLimitReached();
        return;
      }

      const nextHtml = quill.root.innerHTML;
      previousDeltaRef.current = quill.getContents();
      previousHtmlRef.current = nextHtml;
      onWordCountChange(nextWordCount);
      onChange(nextHtml === EMPTY_EDITOR_HTML ? "" : nextHtml);
    });
  }, [
    isDisabled,
    maxWords,
    modules,
    onChange,
    onLimitReached,
    onWordCountChange,
    placeholder,
    value,
  ]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    quill.enable(!isDisabled);
  }, [isDisabled]);

  useEffect(() => {
    const quill = quillRef.current;
    const nextValue = value || EMPTY_EDITOR_HTML;
    if (!quill || previousHtmlRef.current === nextValue) return;

    const selection = quill.getSelection();
    quill.clipboard.dangerouslyPasteHTML(nextValue);
    previousDeltaRef.current = quill.getContents();
    previousHtmlRef.current = quill.root.innerHTML;
    onWordCountChange(countWords(quill.getText()));
    if (selection) {
      quill.setSelection(selection.index, selection.length, "silent");
    }
  }, [onWordCountChange, value]);

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-semibold uppercase text-gray-500"
        >
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="rich-text-editor rounded-lg border border-gray-200 bg-white">
        <div id={id} ref={editorRef} className="min-h-64 text-sm text-slate-700" />
      </div>
    </div>
  );
}
