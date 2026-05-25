/**
 * Shared RPC session state.
 * Both rpc.ts and rpc-legacy.ts import from this module so that the
 * CSRF session ID is always consistent regardless of which protocol
 * is in use.
 */

let _sessionId = '';
let _isLegacy = false;
let _rpcVersion = 0;

export function getSessionId(): string { return _sessionId; }
export function setSessionId(id: string): void { _sessionId = id; }

export function isLegacyProtocol(): boolean { return _isLegacy; }
export function setLegacyProtocol(v: boolean): void { _isLegacy = v; }

export function getRpcVersion(): number { return _rpcVersion; }
export function setRpcVersion(v: number): void { _rpcVersion = v; }
