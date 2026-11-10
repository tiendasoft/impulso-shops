// Proxy de Vercel para Google Apps Script.
// La tienda llama a /api/google en su mismo dominio para evitar errores CORS.
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbym1jaz8xyk36JLZt3L7AX1PseWl0Rq-vq6iKAWw8X5yEtKaeiebE5xs64flgf7VW-l/exec";

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Método no permitido." });
  }

  try {
    const options = {
      method: req.method,
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    };

    if (req.method === "POST") {
      let payload = req.body;
      if (typeof payload === "string") {
        try { payload = JSON.parse(payload); }
        catch (_) { throw new Error("El contenido recibido no es un JSON válido."); }
      }
      if (!payload || typeof payload !== "object") {
        throw new Error("No se recibieron datos válidos para guardar.");
      }
      options.body = JSON.stringify(payload);
    }

    const upstream = await fetch(GOOGLE_SCRIPT_URL, options);
    const responseText = await upstream.text();
    let data;
    try { data = JSON.parse(responseText); }
    catch (_) {
      throw new Error("Google Apps Script no devolvió una respuesta JSON válida.");
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(data);
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: "No se pudo comunicar con Google: " + String(error.message || error)
    });
  }
};
