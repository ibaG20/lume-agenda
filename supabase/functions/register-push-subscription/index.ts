import { serveFunction } from "../_shared/router.ts";

Deno.serve((request) => serveFunction("register-push-subscription", request));
