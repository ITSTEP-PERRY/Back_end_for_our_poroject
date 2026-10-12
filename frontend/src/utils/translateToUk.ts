/** MyMemory — free, CORS-enabled; Ukrainian = `uk`. */
const MYMEMORY_URL = "https://api.mymemory.translated.net/get";
/** MyMemory free tier: ~500 bytes per `q`. Keep headroom for encoding. */
const CHUNK_CHARS = 450;

type MyMemoryResponse = {
  responseStatus: number | string;
  responseDetails?: string;
  responseData?: { translatedText?: string };
};

function splitForTranslate(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let rest = text;
  while (rest.length > maxChars) {
    let cut = rest.lastIndexOf(" ", maxChars);
    if (cut < maxChars * 0.4) cut = maxChars;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks.filter(Boolean);
}

async function translateChunk(chunk: string): Promise<string> {
  const url =
    `${MYMEMORY_URL}?q=${encodeURIComponent(chunk)}` +
    `&langpair=${encodeURIComponent("en|uk")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Translation service unavailable");

  const data = (await res.json()) as MyMemoryResponse;
  const status = Number(data.responseStatus);
  if (status !== 200) {
    throw new Error(data.responseDetails || "Translation failed");
  }
  const out = data.responseData?.translatedText?.trim();
  if (!out) throw new Error("Empty translation");
  return out;
}

/** Translate English (or mostly English) review text to Ukrainian. */
export async function translateToUkrainian(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const chunks = splitForTranslate(trimmed, CHUNK_CHARS);
  const parts: string[] = [];
  for (const chunk of chunks) {
    parts.push(await translateChunk(chunk));
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export type ReviewTranslation = { title: string; body: string };

export async function translateReviewToUkrainian(
  title: string,
  body: string,
): Promise<ReviewTranslation> {
  const [ukTitle, ukBody] = await Promise.all([
    title.trim() ? translateToUkrainian(title) : Promise.resolve(""),
    body.trim() ? translateToUkrainian(body) : Promise.resolve(""),
  ]);
  return { title: ukTitle, body: ukBody };
}
