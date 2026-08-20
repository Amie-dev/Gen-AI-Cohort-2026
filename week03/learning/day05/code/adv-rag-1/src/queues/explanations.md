# `src/queues/` Directory Explanations

## Overview
The `src/queues/` directory handles asynchronous background processing operations using **BullMQ** backed by **Redis**.

## Production Rationale
Document ingestion (parsing large PDFs, splitting into chunks, computing high-dimensional vector embeddings via OpenAI, and storing them in Qdrant) is computationally expensive and introduces high network latency. Running this synchronously inside an HTTP request handler blocks the web server and causes timeout errors.

## File Explanations
1. **`indexingQueue.js`**: Producer module that initializes the BullMQ queue (`"indexing"`) and exports helper functions (`addIndexingJob`) to push document indexing tasks into Redis with configurable retry and exponential backoff strategies.
2. **`indexingWorker.js`**: Consumer/Worker module that listens for background indexing jobs. It extracts text from uploaded PDF files using `pdf-parse`, splits text into chunks, generates vector embeddings, and upserts them into Qdrant.
