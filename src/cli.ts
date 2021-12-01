#!/usr/bin/env node
import { cli } from '@infra/cli';


cli.parseAsync()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));