import dotenv from "dotenv";
import { registerCommands } from "./utils/register-commands.js";

dotenv.config({ path: ".env" });

await registerCommands();
