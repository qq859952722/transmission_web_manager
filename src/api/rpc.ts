import { legacyRpcCall, isLegacyProtocol, detectProtocol } from './rpc-legacy';
import { getSessionId, setSessionId, setRpcVersion } from './rpc-session';

const RPC_PATH = '/transmission/rpc';
let protocolDetected = false;
let requestId = 0;
const MAX_RETRY = 3;

// Re-export for convenience
export { getRpcVersion } from './rpc-session';

/** Detect protocol on first call, then use appropriate RPC call */
async function ensureProtocolDetected() {
  if (!protocolDetected) {
    await detectProtocol();
    protocolDetected = true;
  }
}

export async function rpcCall<T = any>(method: string, params?: Record<string, any>, retryCount = 0): Promise<T> {
  await ensureProtocolDetected();

  // Use legacy protocol if detected
  if (isLegacyProtocol()) {
    return legacyRpcCall<T>(method, params);
  }

  // JSON-RPC 2.0 protocol (Transmission 4.1+)
  const id = ++requestId;
  const payload = {
    jsonrpc: '2.0',
    method,
    params: params || {},
    id,
  };

  const response = await fetch(RPC_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Transmission-Session-Id': getSessionId(),
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 409) {
    const newId = response.headers.get('X-Transmission-Session-Id') || '';
    setSessionId(newId);
    if (!newId) throw new Error('Failed to get session ID');
    if (retryCount >= MAX_RETRY) throw new Error('Max retry reached for session ID acquisition');
    return rpcCall<T>(method, params, retryCount + 1);
  }

  if (!response.ok) {
    throw new Error(`RPC call failed with status ${response.status}`);
  }

  const json = await response.json();

  // Handle JSON-RPC 2.0 error
  if (json.error) {
    const errMsg = json.error.message || 'Unknown RPC error';
    const errData = json.error.data?.error_string;
    throw new Error(errData ? `${errMsg}: ${errData}` : errMsg);
  }

  // Cache RPC version from session_get responses
  if (json.result && typeof json.result.rpc_version === 'number') {
    setRpcVersion(json.result.rpc_version);
  }

  return json.result as T;
}

/** Fetch torrents using table format for efficiency */
export async function torrentGet(fields: string[], ids?: string | number[]): Promise<{torrents: Record<string, any>[], removed?: number[]}> {
  const params: Record<string, any> = { fields, format: 'table' };
  if (ids) params.ids = ids;

  const result = await rpcCall<{torrents: any[], removed?: number[]}>('torrent_get', params);

  if (!result) {
    return { torrents: [], removed: undefined };
  }

  const tableData = result.torrents;
  if (!Array.isArray(tableData) || tableData.length === 0) {
    return { torrents: [], removed: result.removed };
  }

  // Check if table format (first row is array of strings = header)
  if (Array.isArray(tableData[0]) && typeof tableData[0][0] === 'string') {
    const headers = tableData[0] as string[];
    const torrents: Record<string, any>[] = [];
    for (let i = 1; i < tableData.length; i++) {
      const row = tableData[i];
      const obj: Record<string, any> = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = row[j];
      }
      torrents.push(obj);
    }
    return { torrents, removed: result.removed };
  }

  // Fallback: objects format
  return { torrents: tableData as Record<string, any>[], removed: result.removed };
}
