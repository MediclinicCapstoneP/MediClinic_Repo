import jwt from "jsonwebtoken";
import fetch from "node-fetch";

const JWT_SECRET = process.env.JWT_SECRET || "replace_this_secret";
const GROQ_API_URL = process.env.GROQ_API_URL;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MEMORY_DB = {};
const USERS = {};

function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

async function handleSignup(reqBody) {
  const { email, password } = reqBody || {};
  if (!email || !password) throw new Error("email+password required");
  if (USERS[email]) throw new Error("User exists");
  const id = "u_" + Date.now();
  USERS[email] = { id, passwordHash: password };
  const token = signJwt({ sub: id, email });
  return { token, user: { id, email } };
}

async function handleLogin(reqBody) {
  const { email, password } = reqBody || {};
  const u = USERS[email];
  if (!u || u.passwordHash !== password) throw new Error("Invalid credentials");
  const token = signJwt({ sub: u.id, email });
  return { token, user: { id: u.id, email } };
}

function getHeader(req, name) {
  if (req?.headers?.get) return req.headers.get(name);
  const key = Object.keys(req?.headers || {}).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? req.headers[key] : undefined;
}

async function parseJson(req) {
  if (typeof req.json === "function") return await req.json();
  return await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk; });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, obj) {
  if (typeof res.setHeader === "function") res.setHeader("Content-Type", "application/json");
  if (typeof res.statusCode === "number") res.statusCode = status;
  if (typeof res.json === "function") return res.json(obj);
  return res.end(JSON.stringify(obj));
}

export async function handler(req, res) {
  const method = req?.method || "GET";
  const host = getHeader(req, "host") || "localhost";
  const path = new URL(req.url, `http://${host}`).pathname;

  try {
    if (path === "/api/signup" && method === "POST") {
      const body = await parseJson(req);
      const result = await handleSignup(body);
      return sendJson(res, 200, result);
    }

    if (path === "/api/login" && method === "POST") {
      const body = await parseJson(req);
      const result = await handleLogin(body);
      return sendJson(res, 200, result);
    }

    if (path === "/api/chat" && method === "POST") {
      const auth = getHeader(req, "authorization") || "";
      const token = auth.replace(/^Bearer\s+/i, "");
      const user = verifyJwt(token);
      if (!user) return sendJson(res, 401, { error: "Unauthorized" });

      const body = await parseJson(req);
      const { prompt, conversation = [], memory = true } = body || {};

      if (memory) {
        MEMORY_DB[user.sub] = MEMORY_DB[user.sub] || [];
        MEMORY_DB[user.sub].push({ role: "user", content: prompt, ts: Date.now() });
      }

      const groqPayload = {
        model: "groq-light-1",
        input: { conversation, prompt },
        stream: true,
      };

      const groqResp = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(groqPayload),
      });

      if (!groqResp.ok) {
        const txt = await groqResp.text();
        return sendJson(res, 500, { error: "Groq error", details: txt });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");

      const decoder = new TextDecoder();
      const bodyStream = groqResp.body;
      if (bodyStream?.getReader) {
        const reader = bodyStream.getReader();
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            res.write(`data: ${chunk.replace(/\n/g, "\\n")}\n\n`);
          }
        }
      } else if (bodyStream && bodyStream[Symbol.asyncIterator]) {
        for await (const value of bodyStream) {
          const chunk = Buffer.isBuffer(value) ? value.toString("utf8") : String(value);
          res.write(`data: ${chunk.replace(/\n/g, "\\n")}\n\n`);
        }
      }
      res.write(`event: done\ndata: [DONE]\n\n`);
      res.end();

      if (memory) {
        MEMORY_DB[user.sub].push({ role: "assistant", content: "[streamed response saved server-side]", ts: Date.now() });
      }
      return;
    }

    if (path === "/api/memory" && method === "GET") {
      const auth = getHeader(req, "authorization") || "";
      const token = auth.replace(/^Bearer\s+/i, "");
      const user = verifyJwt(token);
      if (!user) return sendJson(res, 401, { error: "Unauthorized" });
      return sendJson(res, 200, { memory: MEMORY_DB[user.sub] || [] });
    }

    return sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    return sendJson(res, 500, { error: err?.message || String(err) });
  }
}

export default handler;
    if (path === "/api/chat-simple" && method === "POST") {
      const uid = getHeader(req, "x-user-id") || "anonymous";
      const urole = getHeader(req, "x-user-role") || "anonymous";
      const body = await parseJson(req);
      const { messages = [] } = body || {};

      MEMORY_DB[uid] = MEMORY_DB[uid] || [];
      MEMORY_DB[uid].push({ role: "system", content: `USER_ROLE=${urole}` });
      MEMORY_DB[uid].push(...messages);

      const groqPayload = {
        model: "groq-light-1",
        input: { conversation: [{ role: "system", content: `USER_ROLE=${urole}` }, ...messages] },
        stream: true,
      };

      const groqResp = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(groqPayload),
      });

      if (!groqResp.ok) {
        const txt = await groqResp.text();
        return sendJson(res, 500, { error: "Groq error", details: txt });
      }

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");

      const decoder = new TextDecoder();
      const bodyStream = groqResp.body;
      if (bodyStream?.getReader) {
        const reader = bodyStream.getReader();
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);
          }
        }
      } else if (bodyStream && bodyStream[Symbol.asyncIterator]) {
        for await (const value of bodyStream) {
          const chunk = Buffer.isBuffer(value) ? value.toString("utf8") : String(value);
          res.write(chunk);
        }
      }
      res.end();
      return;
    }