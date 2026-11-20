
import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, () => {
  console.log("----------------------------------");
  console.log("       VerseServer API");
  console.log("----------------------------------");
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Port: ${env.PORT}`);
  console.log(`URL: http://localhost:${env.PORT}`);
  console.log("----------------------------------");
});
