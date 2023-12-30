# Testing Scripts

This directory contains scripts intended to facilitate testing, such as setting up mock users and workouts.

Using Jest to run these scripts so we can mock stuff when needed and it is just simpler than trying to get ts-node to work.

## Setup for Jest

Add this to your VS Code `launch.json`:

```JSON
{
  "type": "node",
  "request": "launch",
  "name": "Jest: Current file",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "${fileBasenameNoExtension}",
    "--config",
    "jest.config.js",
    "--testRegex",
    ".*\\.ts",
    "--testPathIgnorePatterns",
    "/node_modules/"
  ],
  "console": "integratedTerminal",
  "env": {
    "GCLOUD_PROJECT": "firebase-project-id",
    "FIRESTORE_EMULATOR_HOST": "localhost:8080",
    "FIREBASE_AUTH_EMULATOR_HOST": "127.0.0.1:9099",
    "FIREBASE_STORAGE_EMULATOR_HOST": "localhost:9199",
  }
}
```

Note that `env` variables are only if you are using a local emulator. Remove otherwise.

## Setup for ts-node (not using)

In your `tsconfig.json`:

```JSON
{
  "compilerOptions": {
    "esModuleInterop": true
  },
  "ts-node": {
    "compilerOptions": {
      "module": "CommonJS"
    }
  },
}
```

Add this to your VS Code `launch.json`

```JSON
{
  {
    "type": "node",
    "request": "launch",
    "name": "ts-node: Current file",
    "program": "${workspaceFolder}/node_modules/.bin/ts-node",
    "args": ["${relativeFile}"],
    "cwd": "${workspaceRoot}",
  }
}
```
