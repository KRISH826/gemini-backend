import { createClient } from "redis";
import { config } from "../config/config.js";

const client = createClient({
  url: config.redisUrl,
});

let isConnected = false;
client.on("connect", () => console.log("Redis client connected to the server"));
client.on("ready", () => {
  console.log("Redis client connected to the server and ready to use");
  isConnected = true;
});
client.on("error", (err) =>
  console.log(`Redis client not connected to the server: ${err.message}`)
);
client.on("reconnecting", () =>
  console.log("Redis client reconnecting to the server")
);
client.on("end", () => {
  console.log("Redis client disconnected from the server");
  isConnected = false;
});

async function connectRedis() {
  if (isConnected) {
    console.log("Redis client is already connected");
    return;
  }
  try {
    await client.connect();
    isConnected = true;
    console.log("✅ Redis connection established");
  } catch (error) {
    console.error(`❌ Redis connection error: ${error.message}`);
    console.log("⏳ Retrying Redis connection in 5 seconds...");
    setTimeout(connectRedis, 5000);
  }
}

process.on("SIGINT", async () => {
    console.log('disconnecting redis client...');
    await client.quit();
    console.log('redis client disconnected.');
    process.exit(0);
})

export {client, connectRedis};
