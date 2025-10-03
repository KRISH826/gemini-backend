import {client} from './index.js'

export const setJson = async (key, value, ttl= 3600) => {
    try {
        await client.setEx (key,ttl, JSON.stringify(value));
        console.log("✅ Redis cache set successfully");
    }catch(error) {
        console.error('Redis cache set error');
        throw new Error(error);
    }
}

export const getJson = async (key) => {
    try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Redis cache get error', error);
        throw new Error(error);
    }
}

export const deleteCache = async (pattern) => {
    try {
        const keys = await client.keys(pattern);

        if (keys.length > 0) {
            await client.del(...keys);
            console.log(`✅ Deleted ${keys.length} keys matching: ${pattern}`);
        } else {
            console.log(`ℹ️ No keys matched pattern: ${pattern}`);
        }
    } catch (error) {
        console.error("❌ Redis cache delete error", error);
        throw error;
    }
};
