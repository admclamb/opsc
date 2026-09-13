export interface BasicAuth {
  username: string;
  password: string;
}

export async function postBinary(
  url: string,
  body: Buffer,
  contentType: string,
  auth: BasicAuth
): Promise<string> {
  const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString("base64");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      Authorization: `Basic ${credentials}`,
    },
    body,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`POST ${url} failed with status ${response.status}: ${text}`);
  }

  return text;
}
