# `src/db/` Directory Explanations

## Overview
The `src/db/` directory centralizes access to data infrastructure. Rather than putting raw connection strings or database driver calls inside business logic, this directory isolates database clients for PostgreSQL, Qdrant, and Redis.

## File Explanations
1. **`postgres.js`**: Provides structured querying for relational data (e.g. user accounts, current subscription plans, billing histories). Includes fallback mock mechanisms for offline testing.
2. **`qdrant.js`**: Manages the Qdrant Vector Database connection, handles collection creation, vector embedding storage (upsert), and similarity vector searching.
3. **`redis.js`**: Manages the IORedis connection used by BullMQ task queues for job persistence and distributed locking.
