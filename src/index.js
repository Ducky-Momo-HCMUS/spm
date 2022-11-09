const { spawnSync } = require("child_process");
const { join } = require("path");
const argv = require("./cli");
const {
  getWorkspaces,
  getPackageManger,
  resolveGlob,
  buildCommand,
  getSpmrcJson,
} = require("./util");

const log = argv.silent ? () => {} : console.log;
const error = argv.silent ? () => {} : console.error;
const stdio = argv.silent ? "ignore" : "inherit";

const run = (name, path, command) => {
  log(name);
  spawnSync(`cd ${path} && ${command}`, {
    shell: true,
    stdio,
  });
  log();
};

const main = async () => {
  const pm = argv.packageManager ?? getPackageManger(argv.cwd);

  argv.ignore = argv.ignore ?? [];

  const spmrc = await getSpmConfig(argv.cwd);
  if (spmrc && spmrc.ignore) {
    const ignore = spmrc.ignore;
    if (typeof ignore === "string" || Array.isArray(ignore)) {
      argv.ignore = argv.ignore.concat(ignore);
    }
  }

  if (!pm) {
    log("No lock files found. Using NPM as fallback");
  }

  const workspaces = await getWorkspaces(argv.cwd, pm ?? "npm", argv.ignore);

  if (workspaces.length == 0) {
    error("No workspaces found");
    return;
  }

  log(`Execute "${pm} ${argv.command}" in:`);
  workspaces.forEach((workspace) => log(`- ${workspace}`));
  if (argv.ignore.length != 0) {
    log("Ignore:");
    await Promise.all(
      argv.ignore.map(async (workspaceOrGlob) => {
        const workspaces = await resolveGlob(argv.cwd, workspaceOrGlob);
        workspaces.forEach((workspace) => log(`- ${workspace}`));
      })
    );
  }
  log();

  if (argv.w) {
    const command = buildCommand(pm, argv.command, {
      workspaceRoot: true,
    });
    run("root", argv.cwd, command);
  }
  workspaces.forEach((workspace) =>
    run(workspace, join(argv.cwd, workspace), `${pm} ${argv.command}`)
  );
};

main();
