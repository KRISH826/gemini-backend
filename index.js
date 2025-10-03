import app from "./app.js";
import { connectRedis } from "./src/cache/index.js";
import { config } from "./src/config/config.js";
import { connectDb } from "./src/db/db.js";

const Port = config.port || 5000;
(async () => {
    try {
        await connectDb();
        await connectRedis();
        app.listen(Port, () => {
            console.log(`Server running on port ${Port}`);
        })
    } catch (error) {
        console.error(`Redis connection error: ${error.message}`);
        process.exit(1);
    }
})()