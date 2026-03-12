import { app } from 'electron';
import { existsSync, cpSync, mkdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { logger } from './logger';

export interface PluginInstallResult {
  installed: boolean;
  warning?: string;
}

async function ensureBundledPluginInstalled(pluginId: string, displayName: string): Promise<PluginInstallResult> {
  const targetDir = join(homedir(), '.openclaw', 'extensions', pluginId);
  const targetManifest = join(targetDir, 'openclaw.plugin.json');

  if (existsSync(targetManifest)) {
    logger.info(`${displayName} plugin already installed from local mirror`);
    return { installed: true };
  }

  const candidateSources = app.isPackaged
    ? [
      join(process.resourcesPath, 'openclaw-plugins', pluginId),
      join(process.resourcesPath, 'app.asar.unpacked', 'build', 'openclaw-plugins', pluginId),
      join(process.resourcesPath, 'app.asar.unpacked', 'openclaw-plugins', pluginId),
    ]
    : [
      join(app.getAppPath(), 'build', 'openclaw-plugins', pluginId),
      join(process.cwd(), 'build', 'openclaw-plugins', pluginId),
      join(__dirname, '../../build/openclaw-plugins', pluginId),
    ];

  const sourceDir = candidateSources.find((dir) => existsSync(join(dir, 'openclaw.plugin.json')));
  if (!sourceDir) {
    logger.warn(`Bundled ${displayName} plugin mirror not found in candidate paths`, { candidateSources });
    return {
      installed: false,
      warning: `Bundled ${displayName} plugin mirror not found. Checked: ${candidateSources.join(' | ')}`,
    };
  }

  try {
    mkdirSync(join(homedir(), '.openclaw', 'extensions'), { recursive: true });
    rmSync(targetDir, { recursive: true, force: true });
    cpSync(sourceDir, targetDir, { recursive: true, dereference: true });

    if (!existsSync(targetManifest)) {
      return { installed: false, warning: `Failed to install ${displayName} plugin mirror (manifest missing).` };
    }

    logger.info(`Installed ${displayName} plugin from bundled mirror: ${sourceDir}`);
    return { installed: true };
  } catch (error) {
    logger.warn(`Failed to install ${displayName} plugin from bundled mirror:`, error);
    return {
      installed: false,
      warning: `Failed to install bundled ${displayName} plugin mirror`,
    };
  }
}

export async function ensureFeishuPluginInstalled(): Promise<PluginInstallResult> {
  return await ensureBundledPluginInstalled('feishu-openclaw-plugin', 'Feishu');
}
