"use client";
/** Renders a short localized text with inline **bold** / *italic* markdown. */
import ReactMarkdown from "react-markdown";

export function Md({ text }: { text: string }) {
  return (
    <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }} allowedElements={["p", "strong", "em"]} unwrapDisallowed>
      {text}
    </ReactMarkdown>
  );
}
