import * as fs from "node:fs";
import * as path from "node:path";

import type { ConfigOptions } from "../types.js";

const DEFAULT_CONFIG_FILENAME = "preprint-recommender-config.json";

/**
 * Loads configuration from a JSON file.
 * @param configPath - Path to the config file. If not provided, looks for default config file in cwd.
 * @returns The parsed configuration or an empty object if no config file is found.
 */
export function loadConfigFile(configPath?: string): ConfigOptions {
  const filePath =
    configPath ?? path.join(process.cwd(), DEFAULT_CONFIG_FILENAME);

  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as ConfigOptions;
  } catch {
    console.warn(`Warning: Failed to parse config file at ${filePath}`);
    return {};
  }
}

/**
 * Merges configuration from file with CLI options.
 * CLI options take precedence over config file options.
 * @param fileConfig - Configuration loaded from file.
 * @param cliOptions - Options passed via CLI.
 * @returns Merged configuration with CLI options taking precedence.
 */
export function mergeConfig(
  fileConfig: ConfigOptions,
  cliOptions: Record<string, unknown>
): ConfigOptions {
  const merged: ConfigOptions = { ...fileConfig };

  // Only override with CLI options if they are explicitly provided
  if (cliOptions.seedFolder !== undefined) {
    merged.seedFolder = cliOptions.seedFolder as string;
  }
  if (cliOptions.arxivCategories !== undefined) {
    merged.arxivCategories = cliOptions.arxivCategories as string[];
  }
  if (cliOptions.biorxivCategories !== undefined) {
    merged.biorxivCategories = cliOptions.biorxivCategories as string[];
  }
  if (cliOptions.lookBackDays !== undefined) {
    merged.lookBackDays = cliOptions.lookBackDays as string;
  }
  if (cliOptions.offsetDays !== undefined) {
    merged.offsetDays = cliOptions.offsetDays as string;
  }
  if (cliOptions.maxResults !== undefined) {
    merged.maxResults = cliOptions.maxResults as string;
  }
  if (cliOptions.verbose !== undefined) {
    merged.verbose = cliOptions.verbose as boolean;
  }
  return merged;
}

/**
 * Loads and merges configuration from file and CLI options.
 * @param cliOptions - Options passed via CLI (including optional config path).
 * @returns Merged configuration.
 */
export function getConfig(cliOptions: Record<string, unknown>): ConfigOptions {
  const configPath = cliOptions.config as string | undefined;
  const fileConfig = loadConfigFile(configPath);
  return mergeConfig(fileConfig, cliOptions);
}
