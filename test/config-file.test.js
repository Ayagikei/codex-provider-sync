import test from "node:test";
import assert from "node:assert/strict";

import {
  configDeclaresProvider,
  listConfiguredProviderIds,
  readCurrentProviderFromConfigText,
  setRootProviderInConfigText
} from "../src/config-file.js";

test("readCurrentProviderFromConfigText falls back to implicit openai", () => {
  const input = `
# comment
sandbox_mode = "danger-full-access"

[features]
apps = true
`;

  assert.deepEqual(readCurrentProviderFromConfigText(input), {
    provider: "openai",
    implicit: true
  });
});

test("setRootProviderInConfigText inserts root-level model_provider before first table", () => {
  const input = `# comment
sandbox_mode = "danger-full-access"

[features]
apps = true
`;

  const next = setRootProviderInConfigText(input, "apigather");
  assert.match(next, /^# comment\nsandbox_mode = "danger-full-access"\n\nmodel_provider = "apigather"\n\[features]/);
});

test("setRootProviderInConfigText updates existing root-level model_provider", () => {
  const input = `model_provider = "openai"\nsandbox_mode = "danger-full-access"\n`;
  const next = setRootProviderInConfigText(input, "newapi");
  assert.equal(next, `model_provider = "newapi"\nsandbox_mode = "danger-full-access"\n`);
});

test("setRootProviderInConfigText comments root-level model_provider for official openai", () => {
  const input = `model_provider = "apigather"\nsandbox_mode = "danger-full-access"\n`;
  const next = setRootProviderInConfigText(input, "openai");

  assert.equal(next, `# model_provider = "apigather"\nsandbox_mode = "danger-full-access"\n`);
  assert.deepEqual(readCurrentProviderFromConfigText(next), {
    provider: "openai",
    implicit: true
  });
});

test("provider declarations include openai and custom tables", () => {
  const input = `
[model_providers.apigather]
base_url = "https://example.com"

[model_providers.newapi]
base_url = "https://example.org"
`;

  assert.deepEqual(listConfiguredProviderIds(input), ["openai", "apigather", "newapi"]);
  assert.equal(configDeclaresProvider(input, "apigather"), true);
  assert.equal(configDeclaresProvider(input, "missing"), false);
});
