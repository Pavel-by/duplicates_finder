import { findIdenticalByHashesComparing } from "./find_identical";
import { cpus } from "os";

const path = "./input";
const threadsCount = cpus().length;

findIdenticalByHashesComparing(path, threadsCount).then((value) => {
  console.log(JSON.stringify(value, null, 2))
});