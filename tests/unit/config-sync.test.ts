import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listConfiguredChannels: vi.fn(),
  ensureFeishuPluginInstalled: vi.fn(),
  syncProxyConfigToOpenClaw: vi.fn(),
  sanitizeOpenClawConfig: vi.fn(),
  syncGatewayTokenToConfig: vi.fn(),
  syncBrowserConfigToOpenClaw: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock('electron', () => ({
  app: { isPackaged: false },
}));

vi.mock('@electron/utils/store', () => ({
  getAllSettings: vi.fn(),
}));

vi.mock('@electron/utils/secure-storage', () => ({
  getApiKey: vi.fn(),
  getDefaultProvider: vi.fn(),
  getProvider: vi.fn(),
}));

vi.mock('@electron/utils/provider-registry', () => ({
  getProviderEnvVar: vi.fn(),
  getKeyableProviderTypes: vi.fn(() => []),
}));

vi.mock('@electron/utils/paths', () => ({
  getOpenClawDir: vi.fn(),
  getOpenClawEntryPath: vi.fn(),
  isOpenClawPresent: vi.fn(() => true),
}));

vi.mock('@electron/utils/uv-env', () => ({
  getUvMirrorEnv: vi.fn(async () => ({})),
}));

vi.mock('@electron/utils/channel-config', () => ({
  listConfiguredChannels: mocks.listConfiguredChannels,
}));

vi.mock('@electron/utils/channel-plugin-install', () => ({
  ensureFeishuPluginInstalled: mocks.ensureFeishuPluginInstalled,
}));

vi.mock('@electron/utils/openclaw-auth', () => ({
  sanitizeOpenClawConfig: mocks.sanitizeOpenClawConfig,
  syncGatewayTokenToConfig: mocks.syncGatewayTokenToConfig,
  syncBrowserConfigToOpenClaw: mocks.syncBrowserConfigToOpenClaw,
}));

vi.mock('@electron/utils/proxy', () => ({
  buildProxyEnv: vi.fn(() => ({})),
  resolveProxySettings: vi.fn(() => ({})),
}));

vi.mock('@electron/utils/openclaw-proxy', () => ({
  syncProxyConfigToOpenClaw: mocks.syncProxyConfigToOpenClaw,
}));

vi.mock('@electron/utils/logger', () => ({
  logger: {
    warn: mocks.loggerWarn,
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { syncGatewayConfigBeforeLaunch } from '@electron/gateway/config-sync';

describe('syncGatewayConfigBeforeLaunch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listConfiguredChannels.mockResolvedValue([]);
    mocks.ensureFeishuPluginInstalled.mockResolvedValue({ installed: true });
    mocks.syncProxyConfigToOpenClaw.mockResolvedValue(undefined);
    mocks.sanitizeOpenClawConfig.mockResolvedValue(undefined);
    mocks.syncGatewayTokenToConfig.mockResolvedValue(undefined);
    mocks.syncBrowserConfigToOpenClaw.mockResolvedValue(undefined);
  });

  it('installs the bundled Feishu plugin before launch when Feishu is configured', async () => {
    mocks.listConfiguredChannels.mockResolvedValue(['feishu']);

    await syncGatewayConfigBeforeLaunch({ gatewayToken: 'token-123' } as never);

    expect(mocks.ensureFeishuPluginInstalled).toHaveBeenCalledTimes(1);
    expect(mocks.sanitizeOpenClawConfig).toHaveBeenCalledTimes(1);
    expect(mocks.syncGatewayTokenToConfig).toHaveBeenCalledWith('token-123');
  });

  it('skips bundled Feishu installation when Feishu is not configured', async () => {
    mocks.listConfiguredChannels.mockResolvedValue(['discord']);

    await syncGatewayConfigBeforeLaunch({ gatewayToken: 'token-456' } as never);

    expect(mocks.ensureFeishuPluginInstalled).not.toHaveBeenCalled();
    expect(mocks.sanitizeOpenClawConfig).toHaveBeenCalledTimes(1);
    expect(mocks.syncGatewayTokenToConfig).toHaveBeenCalledWith('token-456');
  });
});
