#!/usr/bin/env node
const yargs = require("yargs");

module.exports = yargs
  .scriptName("spm")
  .command(
    ["run <command>", "$0 <command>"],
    "Forward command to underlying package manager"
  )
  .example('$0 "add --dev typescript jest"')
  .example(
    '$0 "add express" --ignore packages/**',
    'Ignore all workspaces in "packages" directory'
  )
  .option("cwd", {
    describe: "Specifies a current working directory",
    default: "./",
    type: "string",
  })
  .option("ignore", {
    describe: "A pattern or an array of glob patterns to exclude matches",
    type: "array",
  })
  .option("package-manager", {
    choices: ["npm", "pnpm", "yarn"],
  })
  .option("silent", {
    type: "boolean",
  })
  .option("w", {
    alias: ["W"],
    describe: "Also execute command on workspace root",
    type: "boolean",
  })
  .help().argv;
