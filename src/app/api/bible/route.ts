import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface BibleApiVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface BibleApiResponse {
  reference: string;
  verses: BibleApiVerse[];
  text: string;
  translation_id: string;
  translation_name: string;
  error?: string;
}

/**
 * Server-side proxy for bible-api.com (free, public-domain WEB translation,
 * no API key) — proxied rather than called directly from the browser so we
 * control CORS/error handling in one place and don't hardcode a third-party
 * dependency into client code. Not exercised against the live API from this
 * sandbox (bible-api.com is blocked by this environment's egress proxy) —
 * built against its documented, stable response shape; verify against a
 * real deploy before relying on it in production.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const book = searchParams.get("book");
  const chapter = searchParams.get("chapter");

  if (!book || !chapter) {
    return NextResponse.json({ error: "book and chapter are required." }, { status: 400 });
  }

  const reference = `${book} ${chapter}`;
  let data: BibleApiResponse;
  try {
    const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}`, {
      next: { revalidate: 60 * 60 * 24 }, // chapter text never changes — cache a day
    });
    data = await response.json();
  } catch (err) {
    console.error("bible API: request to bible-api.com failed", err);
    return NextResponse.json({ error: "Could not reach the Bible text source." }, { status: 502 });
  }

  if (data.error || !Array.isArray(data.verses) || data.verses.length === 0) {
    return NextResponse.json({ error: data.error ?? "Chapter not found." }, { status: 404 });
  }

  return NextResponse.json({
    reference: data.reference,
    translationName: data.translation_name,
    verses: data.verses.map((v) => ({ chapter: v.chapter, verse: v.verse, text: v.text.trim() })),
  });
}
