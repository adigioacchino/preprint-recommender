import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  loadConfigFile,
  mergeConfig,
  getConfig,
} from "../src/services/config-loader.js";
import type { ConfigOptions } from "../src/types.js";

describe("Config Loader", () => {
  const testConfigDir = path.join(process.cwd(), "test-config-temp");
  const defaultConfigPath = path.join(
    process.cwd(),
    "preprint-recommender-config.json"
  );

  beforeEach(() => {
    // Create temp directory for test config files
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
    // Clean up default config if created during tests
    if (fs.existsSync(defaultConfigPath)) {
      fs.rmSync(defaultConfigPath);
    }
  });

  describe("loadConfigFile", () => {
    it("returns empty object when no config file exists", () => {
      const config = loadConfigFile(
        path.join(testConfigDir, "nonexistent.json")
      );
      expect(config).toEqual({});
    });

    it("loads config from specified path", () => {
      const configPath = path.join(testConfigDir, "custom-config.json");
      const configData: ConfigOptions = {
        seedFolder: "./seeds",
        arxivCategories: ["cs.AI", "cs.LG"],
        lookBackDays: "3",
      };
      fs.writeFileSync(configPath, JSON.stringify(configData));

      const config = loadConfigFile(configPath);
      expect(config).toEqual(configData);
    });

    it("loads config from default location when no path specified", () => {
      const configData: ConfigOptions = {
        seedFolder: "./default-seeds",
        maxResults: "100",
      };
      fs.writeFileSync(defaultConfigPath, JSON.stringify(configData));

      const config = loadConfigFile();
      expect(config).toEqual(configData);
    });

    it("returns empty object for invalid JSON", () => {
      const configPath = path.join(testConfigDir, "invalid.json");
      fs.writeFileSync(configPath, "{ invalid json }");

      const config = loadConfigFile(configPath);
      expect(config).toEqual({});
    });
  });

  describe("mergeConfig", () => {
    it("returns file config when no CLI options provided", () => {
      const fileConfig: ConfigOptions = {
        seedFolder: "./seeds",
        arxivCategories: ["cs.AI"],
        lookBackDays: "5",
      };

      const merged = mergeConfig(fileConfig, {});
      expect(merged).toEqual(fileConfig);
    });

    it("CLI options override file config", () => {
      const fileConfig: ConfigOptions = {
        seedFolder: "./seeds",
        arxivCategories: ["cs.AI"],
        lookBackDays: "5",
      };
      const cliOptions = {
        seedFolder: "./cli-seeds",
        lookBackDays: "10",
      };

      const merged = mergeConfig(fileConfig, cliOptions);
      expect(merged.seedFolder).toBe("./cli-seeds");
      expect(merged.arxivCategories).toEqual(["cs.AI"]);
      expect(merged.lookBackDays).toBe("10");
    });

    it("CLI options add new values not in file config", () => {
      const fileConfig: ConfigOptions = {
        seedFolder: "./seeds",
      };
      const cliOptions = {
        biorxivCategories: ["bioinformatics"],
        maxResults: "200",
      };

      const merged = mergeConfig(fileConfig, cliOptions);
      expect(merged.seedFolder).toBe("./seeds");
      expect(merged.biorxivCategories).toEqual(["bioinformatics"]);
      expect(merged.maxResults).toBe("200");
    });

    it("handles empty file config", () => {
      const cliOptions = {
        seedFolder: "./cli-seeds",
        arxivCategories: ["cs.CV"],
      };

      const merged = mergeConfig({}, cliOptions);
      expect(merged.seedFolder).toBe("./cli-seeds");
      expect(merged.arxivCategories).toEqual(["cs.CV"]);
    });
  });

  describe("getConfig", () => {
    it("loads config from custom path and merges with CLI options", () => {
      const configPath = path.join(testConfigDir, "custom.json");
      const configData: ConfigOptions = {
        seedFolder: "./file-seeds",
        arxivCategories: ["cs.AI"],
        lookBackDays: "7",
      };
      fs.writeFileSync(configPath, JSON.stringify(configData));

      const cliOptions = {
        config: configPath,
        seedFolder: "./cli-seeds",
      };

      const config = getConfig(cliOptions);
      expect(config.seedFolder).toBe("./cli-seeds");
      expect(config.arxivCategories).toEqual(["cs.AI"]);
      expect(config.lookBackDays).toBe("7");
    });

    it("works without config file", () => {
      const cliOptions = {
        seedFolder: "./cli-seeds",
        maxResults: "50",
      };

      const config = getConfig(cliOptions);
      expect(config.seedFolder).toBe("./cli-seeds");
      expect(config.maxResults).toBe("50");
    });
  });
});
