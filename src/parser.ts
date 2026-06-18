export interface ParsedInput {
  cleanedText: string;
  detectedName?: string;
  sourceWebsite?: string;
  sourceLinkedin?: string;
  charCount: number;
}

const NAME_HINT_PATTERN = /^\s*([A-Z][A-Za-z0-9&.\- ]{1,40}?)\s+(?:is|automates|provides|offers|builds|helps|delivers)\b/;

const TEMPLATE_HEADER_PATTERN = /^#\s*Company:\s*(.*)$/im;
const WEBSITE_PATTERN = /^Website:\s*(\S.*)$/im;
const LINKEDIN_PATTERN = /^LinkedIn:\s*(\S.*)$/im;
const BODY_SEPARATOR = /^-{3,}\s*$/m;

export function parseRawInput(raw: string, nameHint?: string): ParsedInput {
  const normalized = raw.replace(/\r\n/g, "\n");

  let body = normalized;
  let templateName: string | undefined;
  let sourceWebsite: string | undefined;
  let sourceLinkedin: string | undefined;

  // Only treat input as the structured template (and split off its header)
  // if it actually contains the "# Company:" marker — plain pasted text
  // that happens to contain a "---" line is left untouched.
  const nameMatch = normalized.match(TEMPLATE_HEADER_PATTERN);
  if (nameMatch) {
    templateName = nameMatch[1].trim() || undefined;

    const separatorMatch = normalized.match(BODY_SEPARATOR);
    if (separatorMatch && separatorMatch.index !== undefined) {
      const header = normalized.slice(0, separatorMatch.index);
      body = normalized.slice(separatorMatch.index + separatorMatch[0].length);

      const websiteMatch = header.match(WEBSITE_PATTERN);
      if (websiteMatch) sourceWebsite = websiteMatch[1].trim() || undefined;

      const linkedinMatch = header.match(LINKEDIN_PATTERN);
      if (linkedinMatch) sourceLinkedin = linkedinMatch[1].trim() || undefined;
    }
  }

  const cleanedText = body
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleanedText) {
    throw new Error(
      templateName !== undefined
        ? "No pasted content found below the template's '---' separator."
        : "No input text provided. Pass --file, --paste, or pipe text via stdin."
    );
  }

  let detectedName = nameHint?.trim() || templateName;
  if (!detectedName) {
    const match = cleanedText.match(NAME_HINT_PATTERN);
    if (match) {
      detectedName = match[1].trim();
    }
  }

  return {
    cleanedText,
    detectedName,
    sourceWebsite,
    sourceLinkedin,
    charCount: cleanedText.length,
  };
}
