"""Convert the editor's HTML into safe, separately flowing PDF text blocks."""

from html.parser import HTMLParser
from urllib.parse import urlsplit
from xml.sax.saxutils import escape, quoteattr

from django.utils.html import strip_tags


class _ContentParser(HTMLParser):
    block_tags = {"p", "div", "h1", "h2", "h3", "h4", "blockquote", "li"}
    inline_tags = {"b": "b", "strong": "b", "i": "i", "em": "i", "u": "u"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks = []
        self.fragments = []
        self.inline = []
        self.lists = []
        self.kind = "body"
        self.bullet = None
        self.indent = 0
        self.ignored = 0
        self.has_markup = False

    def flush(self):
        html = "".join(self.fragments)
        if strip_tags(html).strip():
            html += "".join(f"</{output}>" for _, output in reversed(self.inline))
            self.blocks.append({
                "html": html, "kind": self.kind,
                "bullet": self.bullet, "indent": self.indent,
            })
        self.fragments = []
        self.inline = []
        self.kind = "body"
        self.bullet = None
        self.indent = 0

    def handle_starttag(self, tag, attributes):
        self.has_markup = True
        if tag in {"script", "style"}:
            self.ignored += 1
        if self.ignored:
            return
        attrs = dict(attributes)
        if tag in {"ol", "ul"}:
            self.flush()
            self.lists.append({"tag": tag, "count": 0})
        elif tag in self.block_tags:
            self.flush()
            if tag.startswith("h"):
                self.kind = "rich_heading"
            elif tag == "blockquote":
                self.kind = "blockquote"
            elif tag == "li":
                self.indent = min(max(len(self.lists) - 1, 0), 8)
                for token in attrs.get("class", "").split():
                    if token.startswith("ql-indent-") and token[10:].isdigit():
                        self.indent = min(self.indent + int(token[10:]), 8)
                ordered = attrs.get("data-list") == "ordered" or (
                    not attrs.get("data-list") and self.lists
                    and self.lists[-1]["tag"] == "ol"
                )
                if ordered and self.lists:
                    self.lists[-1]["count"] += 1
                    self.bullet = f'{self.lists[-1]["count"]}.'
                else:
                    self.bullet = "-"
        elif tag == "br":
            self.fragments.append("<br/>")
        elif tag in self.inline_tags:
            output = self.inline_tags[tag]
            self.fragments.append(f"<{output}>")
            self.inline.append((tag, output))
        elif tag == "a":
            href = attrs.get("href") or ""
            try:
                allowed = urlsplit(href).scheme.lower() in {"https", "http", "mailto"}
            except ValueError:
                allowed = False
            if allowed:
                self.fragments.append(f'<link href={quoteattr(href)} color="#09355D">')
                self.inline.append((tag, "link"))

    def handle_endtag(self, tag):
        if self.ignored:
            if tag in {"script", "style"}:
                self.ignored -= 1
            return
        if tag in self.block_tags:
            self.flush()
        elif tag in {"ol", "ul"}:
            self.flush()
            if self.lists:
                self.lists.pop()
        elif self.inline and self.inline[-1][0] == tag:
            _, output = self.inline.pop()
            self.fragments.append(f"</{output}>")

    def handle_data(self, data):
        if not self.ignored:
            self.fragments.append(escape(data))


def parse_pdf_content(content):
    """Preserve paragraphs, lists and supported inline editor formatting."""
    parser = _ContentParser()
    parser.feed(str(content))
    parser.close()
    parser.flush()
    if not parser.has_markup:
        return [
            {"html": escape(line), "kind": "body", "bullet": None, "indent": 0}
            for line in str(content).splitlines() if line.strip()
        ]
    return parser.blocks
