import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function dataURLtoBlob(dataURL) {
  const bytoString = atob(dataURL.split(",")[1]);
  const mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];

  const buffer = new ArrayBuffer(bytoString.length);
  const binaryData = new Uint8Array(buffer);
  for (let i = 0; i < bytoString.length; i++) {
    binaryData[i] = bytoString.charCodeAt(i);
  }
  console.log(binaryData);
  return new Blob([binaryData], { type: mimeString });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { imageData, username } = body;
    if (!imageData || !username) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing imageData or username" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const filePath = `${username}/${Date.now()}.png`;
    const blob = dataURLtoBlob(imageData);

    const { data, error } = await supabase.storage
      .from("gallery")
      .upload(filePath, blob, { contentType: "image/png", upsert: false });
    if (error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    console.log(data, error);
    return new Response(JSON.stringify({ success: true, path: data.path  }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
