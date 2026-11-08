// Archive status labels: record status (library) and submission status (personal translations).
import { statusLabel } from "../lib/library.js?v=202611082312";

export const archiveStatus = s => `<span class="status status--${s}"><span class="status-dot" aria-hidden="true"></span>${statusLabel(s)}</span>`;

const SUB = {
  PRIVATE: ["private", "Private"],
  PENDING_REVIEW: ["pending", "Pending review"],
  PUBLISHED: ["published", "Published"]
};
export const submissionStatus = (t) => {
  const [cls, label] = SUB[t.submissionStatus] || SUB.PRIVATE;
  const held = t.submissionStatus === "PENDING_REVIEW" && t.contribution && t.contribution.queue === "browser";
  return `<span class="status status--${cls}"><span class="status-dot" aria-hidden="true"></span>${label}${held ? " · held in this browser" : ""}</span>`;
};
