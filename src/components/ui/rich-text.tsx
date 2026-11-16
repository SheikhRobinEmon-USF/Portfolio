import { Fragment } from "react";

const pattern =
  /(\$?\d[\d,.]*\s?(?:%|K\+?|M\+?|\+)?(?:\s?to\s?\d[\d,.]*\s?(?:%|\+)?)?)/g;

/** Emphasises the figures in a sentence so results can be scanned. */
export function Figures({ text }: { text: string }) {
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 && /\d/.test(part) && /(%|K|M|\+|,\d{3}|\d{2,})/.test(part) ? (
          <strong key={i} className="font-medium text-ink">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
