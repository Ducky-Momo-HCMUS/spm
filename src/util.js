const { promises: fs, existsSync } = require("fs");
const glob = require("glob-promise");
const { dirname, join, resolve } = require("path");
const YAML = require("yaml");

const list = {
  pnpm: {
    lockFile: "pnpm-lock.yaml",
    commandBuilder: (command, { workspaceRoot }) => {
      const flag = workspaceRoot ? "-w" : "";
      return `pnpm ${command} ${flag}`;
    },
    workspaceResolver: async (cwd) => {
      const path = resolve(cwd, "pnpm-workspace.yaml");
      return existsSync(path)
        ? YAML.parse(await fs.readFile(path, "utf-8")).packages ?? []
        : [];
    },
  },
  yarn: {
    lockFile: "yarn.lock",
    commandBuilder: (command, { workspaceRoot }) => {
      const flag = workspaceRoot ? "-W" : "";
      return `yarn ${command} ${flag}`;
    },
    workspaceResolver: async (cwd) => {
      const path = resolve(cwd, "package.json");
      return existsSync(path)
        ? JSON.parse(await fs.readFile(path, "utf-8")).workspaces ?? []
        : [];
    },
  },
  npm: {
    lockFile: "package-lock.json",
    commandBuilder: (command, { workspaceRoot }) => {
      return `npm ${command} ${flag}`;
    },
    workspaceResolver: async (cwd) => {
      const path = resolve(cwd, "package.json");
      return existsSync(path)
        ? JSON.parse(await fs.readFile(path, "utf-8")).workspaces ?? []
        : [];
    },
  },
};

const joinForwardSlash = (...paths) => join(...paths).replaceAll("\\", "/");

const resolveGlob = async (cwd, workspaceOrGlob, ignore = []) => {
  return glob(joinForwardSlash(cwd, workspaceOrGlob, "package.json"), {
    ignore: [joinForwardSlash(cwd, "**", "node_modules", "**"), ...ignore],
  });
};

const buildCommand = (packageManager, command, options = {}) =>
  list[packageManager].commandBuilder(command, options);

const getPackageManger = (cwd = ".") => {
  const exist = (lockFile) => existsSync(resolve(cwd, lockFile));
  for (let name in list) {
    if (exist(list[name].lockFile)) return name;
  }
  return null;
};

const getWorkspaces = async (cwd, packageManager, ignore = []) => {
  const workspacesAndGlobs = await list[packageManager].workspaceResolver(cwd);
  const workspaces = await Promise.all(
    workspacesAndGlobs.map((workspaceOrGlob) =>
      resolveGlob(cwd, workspaceOrGlob, ignore)
    )
  );
  return workspaces.flatMap((v) => v).map((workspace) => dirname(workspace));
};

const getSpmConfig = async (cwd) => {
  const path = resolve(cwd, "spmconfig.json");
  return existsSync(path) ? JSON.parse(await fs.readFile(path, "utf-8")) : null;
};

module.exports = {
  buildCommand,
  resolveGlob,
  getPackageManger,
  getWorkspaces,
  getSpmConfig,
};
