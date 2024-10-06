# directory-to-object-cli

A simple CLI tool to exercise the
[directory-to-object](https://jsr.io/@scroogieboy/directory-to-object) package.

This tool loads a directory using `@scroogieboy/directory-to-object` then prints
the results. The default output format is the `Deno.inspect` format. The default
output location is the console.

The underlying package is portable across runtimes, but this particular CLI is
intended for Deno only.

Run it from the Deno command line with:

```
deno run --allow-read --allow-write jsr:@scroogieboy/directory-to-object-cli
```

Note: The `--allow-write` option is only required if using the `--output` flag
to write the command output to a file.

It can also be installed as a global command with:

```
deno install --allow-read --allow-write --name directory-to-object-cli jsr:@scroogieboy/directory-to-object-cli
```

## Usage

```
Usage: directory-to-object-cli <path>

Description:

  A CLI for the '@scroogieboy/directory-to-object' package

Options:

  -h, --help                         - Show this help.
  -n, --nodefaults                   - Remove all default file value loaders.
  -b, --binary          <extension>  - Map additional file extension to binary format.
  -c, --colors                       - Colorize Deno.inspect output.
  -f, --format          <format>     - the output format -- 'inspect' (default) or 'json'.
  -j, --json            <extension>  - Map additional file extension to JSON format.
  -J, --jsonc           <extension>  - Map additional file extension to JSON-with-comments (JSONC) format.
  -M, --merge-arrays                 - Merge any conflicting arrays in configuration using the es-toolkit `union`
                                       function.
  -m, --merge-objects                - Merge any conflicting objects in configuration using the es-toolkit `merge`
                                       function.
  -o, --output          <path>       - Write output to this file.
  -t, --text            <extension>  - Map additional file extension to textual format.
  -v, --verbose                      - Enable verbose logging.
  -y, --yaml            <extension>  - Map additional file extension to YAML format.
```
