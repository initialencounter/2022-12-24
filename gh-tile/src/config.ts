import fs from "fs";
import { resolve } from "path";
export const mainUsage = fs.readFileSync(resolve(__dirname, '../readme.md'))