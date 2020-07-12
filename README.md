@MechanicalRock/scdk
====================

Generate CDK constructs from AWS Service Catalog

[![Version](https://img.shields.io/npm/v/@MechanicalRock/scdk.svg)](https://npmjs.org/package/@MechanicalRock/scdk)
[![Downloads/week](https://img.shields.io/npm/dw/@MechanicalRock/scdk.svg)](https://npmjs.org/package/@MechanicalRock/scdk)
[![License](https://img.shields.io/npm/l/@MechanicalRock/scdk.svg)](https://github.com/MechanicalRock/scdk/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @MechanicalRock/scdk
$ scdk COMMAND
running command...
$ scdk (-v|--version|version)
0.0.0
$ scdk --help [COMMAND]
USAGE
  $ scdk COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`scdk generate`](#scdk-generate)

## `scdk generate`

Generates CDK constructs from AWS Service Catalog products

```
USAGE
  $ scdk generate

OPTIONS:
  --version           Show version number                              [boolean]
  --help              Show help                                        [boolean]
  --dir, -o           Output directory                        [default: "./out"]
  --portfolio-id, -f  Generate constructs for all products in the specified
                      portfolio
  --product-id, -p    Generate a construct for the product with the specified
                      product                                            [array]

EXAMPLE
  $ scdk generate --product-id prod-123 prod-456 --out ./generated
  $ scdk generate --portfolio-id port-123
```

_See code: [src/cmd/generate.ts](https://github.com/MechanicalRock/scdk/blob/v0.0.0/src/cmd/generate.ts)_
<!-- commandsstop -->
