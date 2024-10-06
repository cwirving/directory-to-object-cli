if (!import.meta.main) {
  throw new Error("This is a command-line module. It should not be imported.");
}

import { Command } from "@cliffy/command";
import { toFileUrl } from "@std/path";
import * as JSONC from "@std/jsonc";
import * as YAML from "@std/yaml";
import {
  type DirectoryObjectLoader,
  type DirectoryObjectLoaderOptions,
  fileValueLoaders,
  newBinaryFileValueLoader,
  newDirectoryObjectLoader,
  newFileBinaryReader,
  newFileTextReader,
  newJsonFileValueLoader,
  newStringParserFileValueLoader,
  newTextFileValueLoader,
} from "@scroogieboy/directory-to-object";
import { merge, union } from "@es-toolkit/es-toolkit";

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
    "-f, --format <format:string>",
    "the output format -- 'inspect' (default) or 'json'.",
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

const textReader = newFileTextReader();

if (parsedCommand.options.nodefaults) {
  fileValueLoaders.clear();
}

if (parsedCommand.options.binary) {
  const binaryLoader = newBinaryFileValueLoader(newFileBinaryReader());

  for (const extension of parsedCommand.options.binary) {
    fileValueLoaders.set(extension, binaryLoader);
  }
}

if (parsedCommand.options.json) {
  const jsonLoader = newJsonFileValueLoader(textReader);

  for (const extension of parsedCommand.options.json) {
    fileValueLoaders.set(extension, jsonLoader);
  }
}

if (parsedCommand.options.jsonc) {
  const jsoncLoader = newStringParserFileValueLoader(
    textReader,
    JSONC.parse,
    "JSONC file value loader",
  );

  for (const extension of parsedCommand.options.jsonc) {
    fileValueLoaders.set(extension, jsoncLoader);
  }
}

if (parsedCommand.options.text) {
  const textLoader = newTextFileValueLoader(textReader);

  for (const extension of parsedCommand.options.text) {
    fileValueLoaders.set(extension, textLoader);
  }
}

if (parsedCommand.options.yaml) {
  const yamlLoader = newStringParserFileValueLoader(
    textReader,
    YAML.parse,
    "YAML file value loader",
  );

  for (const extension of parsedCommand.options.yaml) {
    fileValueLoaders.set(extension, yamlLoader);
  }
}

const options: DirectoryObjectLoaderOptions = {};
if (parsedCommand.options.mergeArrays) {
  options.arrayMergeFunction = union;
}
if (parsedCommand.options.mergeObjects) {
  options.objectMergeFunction = merge;
}

if (verbose) {
  console.log("Using the following loaders, by extension:");
  for (const [extension, loader] of fileValueLoaders) {
    console.log(`${extension}: ${loader.name}`);
  }
}

let directoryObjectLoader: DirectoryObjectLoader;
try {
  directoryObjectLoader = newDirectoryObjectLoader(
    fileValueLoaders,
    undefined,
    "directory loader",
    options,
  );
} catch (e) {
  console.error();
  if (e instanceof Error) {
    console.error(e.message);
  }
  Deno.exit(2);
}

const path = parsedCommand.args[0];
const directoryUrl = new URL(
  toFileUrl(await Deno.realPath(path)),
);

const contents = await directoryObjectLoader.loadObjectFromDirectory(
  directoryUrl,
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
