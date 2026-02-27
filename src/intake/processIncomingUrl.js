import { fetchMetadata } from "../metadata/fetchMetadata.js";
import { buildClassificationInput, recommendFolder } from "../ai/classifyLink.js";
import { insertLinkRecord } from "../supabase/client.js";

export async function processIncomingUrl({ url, folders }) {
  if (!url) {
    throw new Error("url is required");
  }

  const metadata = await fetchMetadata(url);
  const classificationInput = buildClassificationInput({
    url,
    title: metadata.title,
    description: metadata.description,
    folders,
  });
  const classification = recommendFolder(classificationInput);

  const record = {
    original_url: url,
    title: metadata.title,
    summary: metadata.description,
    status: "unread",
  };

  const saved = await insertLinkRecord(record);

  return {
    metadata,
    classification,
    saved,
  };
}
