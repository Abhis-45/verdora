import dns from "node:dns";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import mongoose from "mongoose";

const execFileAsync = promisify(execFile);

function ensureMongoUri(uri = process.env.MONGO_URI) {
  const value = uri?.trim();

  if (!value) {
    throw new Error(
      "MONGO_URI is not set. Add it to backend/.env before starting the backend.",
    );
  }

  return value;
}

function ensureStandardMongoUri() {
  return process.env.MONGO_URI_STANDARD?.trim() || "";
}

function isSrvUri(uri) {
  return uri.startsWith("mongodb+srv://");
}

function toArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

async function runPowerShellJson(command) {
  const { stdout } = await execFileAsync(
    "powershell",
    ["-NoProfile", "-Command", command],
    { windowsHide: true },
  );

  const output = stdout.trim();
  return output ? JSON.parse(output) : [];
}

async function buildStandardAtlasUri(uri) {
  const parsed = new URL(uri);
  const srvLookup = `_mongodb._tcp.${parsed.hostname}`;

  const srvRecords = toArray(
    await runPowerShellJson(
      `Resolve-DnsName -Type SRV '${srvLookup}' | Where-Object { $_.Section -eq 'Answer' -and $_.NameTarget -and $_.Port } | Select-Object NameTarget,Port | ConvertTo-Json -Compress`,
    ),
  );

  if (srvRecords.length === 0) {
    throw new Error(`No SRV records found for ${parsed.hostname}`);
  }

  const txtRecords = toArray(
    await runPowerShellJson(
      `Resolve-DnsName -Type TXT '${parsed.hostname}' | Where-Object { $_.Section -eq 'Answer' -and $_.Strings } | ForEach-Object { $_.Strings -join '' } | ConvertTo-Json -Compress`,
    ),
  );

  const hosts = srvRecords.map(({ NameTarget, Port }) => {
    const hostname = String(NameTarget).replace(/\.$/, "");
    return `${hostname}:${Port}`;
  });

  const searchParams = new URLSearchParams(parsed.searchParams);

  for (const record of txtRecords) {
    const recordParams = new URLSearchParams(record);

    for (const [key, value] of recordParams) {
      if (!searchParams.has(key)) {
        searchParams.set(key, value);
      }
    }
  }

  if (!searchParams.has("tls") && !searchParams.has("ssl")) {
    searchParams.set("tls", "true");
  }

  const auth =
    parsed.username || parsed.password
      ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ""}@`
      : "";
  const database = parsed.pathname === "/" ? "" : parsed.pathname;
  const query = searchParams.toString();

  return `mongodb://${auth}${hosts.join(",")}${database}${query ? `?${query}` : ""}`;
}

async function resolveMongoUri(uri) {
  const mongoUri = ensureMongoUri(uri);
  const standardMongoUri = ensureStandardMongoUri();

  if (standardMongoUri) {
    return standardMongoUri;
  }

  if (!isSrvUri(mongoUri) || process.platform !== "win32") {
    return mongoUri;
  }

  const parsed = new URL(mongoUri);

  try {
    await dns.promises.resolveSrv(`_mongodb._tcp.${parsed.hostname}`);
    return mongoUri;
  } catch (error) {
    if (error?.code !== "ECONNREFUSED") {
      throw error;
    }

    try {
      return await buildStandardAtlasUri(mongoUri);
    } catch (fallbackError) {
      throw new Error(
        "MongoDB Atlas SRV lookup failed and the Windows fallback could not build a standard URI. Set MONGO_URI_STANDARD in backend/.env to a non-SRV Atlas connection string if this keeps happening.",
        { cause: fallbackError },
      );
    }
  }
}

export async function connectToMongo(options = {}) {
  const mongoUri = await resolveMongoUri();
  return mongoose.connect(mongoUri, options);
}

export { resolveMongoUri };
