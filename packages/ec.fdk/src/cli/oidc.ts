import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { exec } from "node:child_process";

const OIDC_CONFIG = {
  stage: {
    authEndpoint: "https://login.cachena.entrecode.de/oidc/auth",
    tokenEndpoint: "https://login.cachena.entrecode.de/oidc/token",
  },
  live: {
    authEndpoint: "https://login.entrecode.de/oidc/auth",
    tokenEndpoint: "https://login.entrecode.de/oidc/token",
  },
};

const CLIENT_ID = "ec-fdk-cli";
const REDIRECT_URI = "http://localhost:19836/callback";
const TIMEOUT_MS = 120_000;

function base64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function generateVerifier(): string {
  return base64url(randomBytes(32));
}

function generateChallenge(verifier: string): string {
  return base64url(createHash("sha256").update(verifier).digest());
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";
  exec(`${cmd} ${JSON.stringify(url)}`);
}

const SUCCESS_HTML = `<!DOCTYPE html><html><body style="font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0">
<div style="text-align:center"><h1>Login successful</h1><p>You can close this tab.</p></div></body></html>`;

const ERROR_HTML = (msg: string) =>
  `<!DOCTYPE html><html><body style="font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0">
<div style="text-align:center"><h1>Login failed</h1><p>${msg}</p></div></body></html>`;

export interface OidcTokens {
  access_token: string;
  refresh_token?: string;
}

export async function refreshAccessToken(
  env: "stage" | "live",
  refreshToken: string
): Promise<OidcTokens> {
  const { tokenEndpoint } = OIDC_CONFIG[env];
  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  if (!data.access_token) {
    throw new Error("No access_token in refresh response");
  }
  return { access_token: data.access_token, refresh_token: data.refresh_token };
}

export function loginOidc(env: "stage" | "live"): Promise<OidcTokens> {
  const { authEndpoint, tokenEndpoint } = OIDC_CONFIG[env];
  const verifier = generateVerifier();
  const challenge = generateChallenge(verifier);
  const state = base64url(randomBytes(16));

  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      if (!req.url?.startsWith("/callback")) {
        res.writeHead(404);
        res.end();
        return;
      }

      const params = new URL(req.url, "http://localhost").searchParams;
      const code = params.get("code");
      const returnedState = params.get("state");
      const error = params.get("error");

      if (error) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(ERROR_HTML(params.get("error_description") || error));
        cleanup();
        reject(new Error(params.get("error_description") || error));
        return;
      }

      if (returnedState !== state) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(ERROR_HTML("State mismatch"));
        cleanup();
        reject(new Error("State mismatch — possible CSRF attack"));
        return;
      }

      if (!code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(ERROR_HTML("No authorization code received"));
        cleanup();
        reject(new Error("No authorization code received"));
        return;
      }

      try {
        const tokenRes = await fetch(tokenEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            code,
            code_verifier: verifier,
          }),
        });

        if (!tokenRes.ok) {
          const text = await tokenRes.text();
          throw new Error(`Token exchange failed: ${tokenRes.status} ${text}`);
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
          throw new Error("No access_token in token response");
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(SUCCESS_HTML);
        cleanup();
        resolve({ access_token: accessToken, refresh_token: tokenData.refresh_token });
      } catch (err: any) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(ERROR_HTML(err.message));
        cleanup();
        reject(err);
      }
    });

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Login timed out after 2 minutes"));
    }, TIMEOUT_MS);

    function cleanup() {
      clearTimeout(timeout);
      server.close();
    }

    server.listen(19836, () => {
      const authUrl =
        `${authEndpoint}?` +
        new URLSearchParams({
          client_id: CLIENT_ID,
          redirect_uri: REDIRECT_URI,
          response_type: "code",
          scope: "openid offline_access",
          state,
          code_challenge: challenge,
          code_challenge_method: "S256",
        }).toString();

      process.stderr.write("Opening browser for login...\n");
      openBrowser(authUrl);
    });

    server.on("error", (err) => {
      cleanup();
      reject(new Error(`Could not start local server: ${err.message}`));
    });
  });
}
