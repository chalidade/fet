// Dijalankan setelah tsup: tulis dist/tokens.css dari build ESM.
import { writeFileSync } from "node:fs";
import { toCss } from "../dist/index.js";

writeFileSync(new URL("../dist/tokens.css", import.meta.url), toCss());
