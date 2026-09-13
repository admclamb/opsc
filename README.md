# opsc

Typed infrastructure scripting, compiled to a native binary. No Node, no
Python, no runtime on the target — the output of `opsc build` is a static
executable.

`opsc` is a typed stdlib and CLI built on top of
[scriptc](https://github.com/vercel-labs/scriptc), aimed at the scripts
that usually end up as fragile bash: deploy scripts, provisioning,
CI glue, container entrypoints.

Status: pre-v0.1.

## Toolchain setup

Requires Node 24+ (for the scriptc compiler itself — binaries it produces
need nothing).

```bash
pnpm add -g scriptc
```

### Windows / Linux hosts need Zig

scriptc's native codegen shells out to a C compiler. On macOS this is
`clang`, already present. On Windows and Linux hosts there's no bundled
compiler, so builds fail with `spawn clang ENOENT` until you install
[Zig](https://ziglang.org) (it bundles `clang`) and point scriptc at it:

```bash
winget install -e --id zig.zig
```

**Note:** a fresh `winget install` updates the user PATH, but an
already-open shell won't see it until restarted. If `zig version` still
says "not found" right after installing, open a new terminal.

Every scriptc invocation then needs:

```bash
export SCRIPTC_CC=zigcc
```

### Cross-compiling to Linux

For a portable, dependency-free binary (CI runners, containers, minimal
images), cross-compile to static musl Linux from any host:

```bash
SCRIPTC_CC=zigcc SCRIPTC_TARGET=x86_64-linux-musl scriptc build examples/hello.ts -o hello
```

This produces a statically-linked ELF binary with no libc dependency on
the target machine. To run a Linux binary from Windows for local testing,
use Docker:

```bash
docker run --rm -v "$(pwd):/app" -w /app alpine:latest ./hello
```

**Git Bash note:** the `-w /app` flag gets mangled by MSYS path
conversion (`the working directory 'C:/Program Files/Git/app' is invalid`)
unless you prefix the command with `MSYS_NO_PATHCONV=1`.

## Layout

```
examples/    Worked examples, including the toolchain smoke test (hello.ts)
src/         opsc CLI and stdlib (env, fs, exec, http, zip)
```

## License

Apache-2.0 — see [LICENSE](./LICENSE).
