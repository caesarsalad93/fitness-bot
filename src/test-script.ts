import { getUsers } from "./drizzle/db.js";

const dummyUsers = await getUsers();
console.log(dummyUsers);