if (!import.meta.main) {
  throw new Error("This is a command-line module. It should not be imported.");
}

import { Command } from "@cliffy/command";
import { toFileUrl } from "@std/path";
import * as JSONC from "@std/jsonc";
import * as YAML from "@std/yaml";
import {
  defaultLoaders,
  Loaders,
  loadObjectFromDirectory,
} from "@scroogieboy/directory-to-object";
import { merge, union } from "@es-toolkit/es-toolkit";
import type { ValueLoaderOptions } from "@scroogieboy/directory-to-object/interfaces";

const command = new Command()
  .name("directory-to-object-cli")
  .description("A CLI for the '@scroogieboy/directory-to-object' package")
  .option(
    "-n, --nodefaults",
    "Remove all default file value loaders.",
  )
  .option(
    "-b, --binary <extension:string>",
    "Map additional file extension to binary format.",
    { collect: true },
  )
  .option(
    "-c, --colors",
    "Colorize Deno.inspect output.",
  )
  .option(
    "-e, --embed-dir <key:string>",
    "Embed the URL of every directory traversed using this key.",
  )
  .option(
    "-E, --embed-file <key:string>",
    "Embed the URL of every object-valued (e.g., JSON) file traversed using this key.",
  )
  .option(
    "-f, --format <format:string>",
    "The output format -- 'inspect' (default) or 'json'.",
    (value: string): string => {
      if (!["inspect", "json"].includes(value)) {
        throw new Error(
          `Format must be one of "inspect" or "json", but got "${value}".`,
        );
      }
      return value;
    },
  )
  .option(
    "-j, --json <extension:string>",
    "Map additional file extension to JSON format.",
    { collect: true },
  )
  .option(
    "-J, --jsonc <extension:string>",
    "Map additional file extension to JSON-with-comments (JSONC) format.",
    { collect: true },
  )
  .option(
    "-M, --merge-arrays",
    "Merge any conflicting arrays in configuration using the es-toolkit `union` function.",
  )
  .option(
    "-m, --merge-objects",
    "Merge any conflicting objects in configuration using the es-toolkit `merge` function.",
  )
  .option(
    "-o, --output <path:string>",
    "Write output to this file.",
  )
  .option(
    "-t, --text <extension:string>",
    "Map additional file extension to textual format.",
    { collect: true },
  )
  .option(
    "-v, --verbose",
    "Enable verbose logging.",
  )
  .option(
    "-y, --yaml <extension:string>",
    "Map additional file extension to YAML format.",
    { collect: true },
  )
  .arguments("<path>");

const parsedCommand = await command.parse();

const verbose = !!parsedCommand.options.verbose;

if (parsedCommand.options.nodefaults) {
  defaultLoaders.length = 0;
}

if (parsedCommand.options.binary) {
  defaultLoaders.push(
    Loaders.binaryFile().whenExtensionIsOneOf(parsedCommand.options.binary),
  );
}

if (parsedCommand.options.json) {
  defaultLoaders.push(
    Loaders.jsonFile().whenExtensionIsOneOf(parsedCommand.options.json),
  );
}

if (parsedCommand.options.jsonc) {
  defaultLoaders.push(
    Loaders.customFile({ name: "JSONC file value loader", parser: JSONC.parse })
      .whenExtensionIsOneOf(parsedCommand.options.jsonc),
  );
}

if (parsedCommand.options.text) {
  defaultLoaders.push(
    Loaders.textFile().whenExtensionIsOneOf(parsedCommand.options.text),
  );
}

if (parsedCommand.options.yaml) {
  defaultLoaders.push(
    Loaders.customFile({ name: "YAML file value loader", parser: YAML.parse })
      .whenExtensionIsOneOf(parsedCommand.options.yaml),
  );
}

const options: ValueLoaderOptions = {};

if (parsedCommand.options.mergeArrays) {
  options.arrayMergeFunction = union;
}

if (parsedCommand.options.mergeObjects) {
  options.objectMergeFunction = merge;
}

if (parsedCommand.options.embedDir) {
  options.embedDirectoryUrlAs = parsedCommand.options.embedDir;
}

if (parsedCommand.options.embedFile) {
  options.embedFileUrlAs = parsedCommand.options.embedFile;
}

if (verbose) {
  console.log("Using the following loaders:");
  for (const loader of defaultLoaders) {
    console.log(loader.name);
  }
}

const path = parsedCommand.args[0];
const directoryUrl = new URL(
  toFileUrl(await Deno.realPath(path)),
);

const contents = await loadObjectFromDirectory(
  directoryUrl,
  options,
);

if (verbose) {
  console.log();
  console.log(`${directoryUrl.href}:`);
}

let output: string;

switch (parsedCommand.options.format) {
  case "json":
    output = JSON.stringify(contents, null, 2);
    break;

  default: {
    const inspectOptions: Deno.InspectOptions = {
      colors: !!parsedCommand.options.colors,
    };

    output = Deno.inspect(contents, inspectOptions);
  }
}

if (parsedCommand.options.output) {
  await Deno.writeTextFile(parsedCommand.options.output, output);
} else {
  console.log(output);
}
