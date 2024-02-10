import { findIdenticalByHashesComparing } from "./find_identical";

const path = "./input";
const threadsCount = 10;

findIdenticalByHashesComparing(path, threadsCount).then((value) => {
  console.log(JSON.stringify(value, null, 2))
});