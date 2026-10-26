import { allowedOriginsFrom } from "./http.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${
        JSON.stringify(actual)
      }`,
    );
  }
}

Deno.test("includes PUBLIC_APP_URL in the CORS allowlist", () => {
  const origins = allowedOriginsFrom(
    undefined,
    "https://agendinha.example.com/",
  );

  assertEquals([...origins], [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://agendinha.example.com",
  ]);
});

Deno.test("normalizes configured origins and ignores invalid protocols", () => {
  const origins = allowedOriginsFrom(
    " https://app.example.com/, https://admin.example.com/path, ftp://files.example.com ",
    undefined,
  );

  assertEquals([...origins], [
    "https://app.example.com",
    "https://admin.example.com",
  ]);
});
