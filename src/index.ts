#!/usr/bin/env node
import { scdk } from "./scdk";
scdk.parse(process.argv.slice(2), { response: console.log });
