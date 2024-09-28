if (!import.meta.main) {
  throw new Error("This is a command-line module. It should not be imported.");
}

import { Command } from "@cliffy/command";
import { toFileUrl } from "@std/path";
import * as YAML from "@std/yaml";
import {
  type DirectoryObjectLoader,
  newBinaryFileValueLoader,
  newDefaultFileValueLoaders,
  newDirectoryObjectLoader,
  newFileBinaryReader,
  newFileTextReader,
  newJsonFileValueLoader,
  newStringParserFileValueLoader,
  newTextFileValueLoader,
} from "@scroogieboy/directory-to-object";

const command = new Command()
  .name("directory-to-object-cli")
  .description("A CLI for the '@scroogieboy/directory-to-object' package")
  .option(
    "-n, --nodefaults",
    "Remove all default file value loaders",
  )
  .option(
    "-b, --binary <extension:string>",
    "Map additional file extension to binary format",
    { collect: true },
  )
  .option(
    "-j, --json <extension:string>",
    "Map additional file extension to JSON format",
    { collect: true },
  )
  .option(
    "-t, --text <extension:string>",
    "Map additional file extension to textual format",
    { collect: true },
  )
  .option(
    "-v, --verbose",
    "Enable verbose logging",
  )
  .option(
    "-y, --yaml <extension:string>",
    "Map additional file extension to YAML format",
    { collect: true },
  )
  .arguments("<File...>");

const parsedCommand = await command.parse();

const verbose = !!parsedCommand.options.verbose;

const textReader = newFileTextReader();

// TODO: use the variable from @scroogieboy/directory-to-object
const fileValueLoaders = newDefaultFileValueLoaders();

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

if (verbose) {
  console.log("Using the following loaders, by extension:");
  for (const [extension, loader] of fileValueLoaders) {
    console.log(`${extension}: ${loader.name}`);
  }
}

let directoryObjectLoader: DirectoryObjectLoader;
try {
  directoryObjectLoader = newDirectoryObjectLoader(fileValueLoaders);
} catch (e) {
  console.error();
  if (e instanceof Error) {
    console.error(e.message);
  }
  Deno.exit(2);
}

for (const path of parsedCommand.args) {
  const directoryUrl = new URL(
    toFileUrl(await Deno.realPath(path)),
  );

  const contents = await directoryObjectLoader.loadObjectFromDirectory(
    directoryUrl,
  );

  if (verbose) {
    console.log();
    console.log(`${directoryUrl.href}:`);
    console.log(JSON.stringify(contents, null, 2));
  }
}
