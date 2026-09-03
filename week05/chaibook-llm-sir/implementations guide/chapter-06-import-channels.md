# Chapter 6 — Source Import Channels (Website, YouTube, PDF, Web Search)

## 1. Goal & Outcome
- **Goal**: Expand knowledge input mechanisms by implementing 4 specialized import channels: Website Scraping (Firecrawl), YouTube Transcript Fetching, PDF Document Upload (Multer + Cloudinary), and Web Search Result Saving.
- **Student Outcome**: Users can bring external web pages, YouTube videos, PDF documents, and live web research into their workspace as raw sources ready for vector indexing.

---

## 2. Server Implementation (`server/`)

### A. Folder & File Structure
```
server/
├── src/
    ├── lib/
    │   ├── firecrawl.ts               ← Firecrawl SDK website scraper
    │   ├── youtube.ts                 ← YouTube transcript extractor
    │   └── cloudinary.ts              ← Cloudinary PDF uploader
    ├── middleware/
    │   └── upload.middleware.ts       ← Multer file upload handler
    ├── validators/
    │   └── source.validator.ts        ← Schemas for website, youtube, web-search
    ├── services/
    │   └── source.service.ts          ← Import business logic
    ├── controllers/
    │   └── source.controller.ts       ← Import endpoint controllers
    └── routes/
        └── source.routes.ts           ← Mount import endpoints
```

### B. Installation Commands
From `week05/chaibook-llm-sir/server`:
```bash
npm install @mendable/firecrawl-js youtube-transcript multer cloudinary
npm install -D @types/multer
```

---

### C. Server Helper Integrations

#### 1. Website Scraper (`server/src/lib/firecrawl.ts`)
```typescript
import Firecrawl from "@mendable/firecrawl-js";
import { BadRequestError } from "../types/app-error.js";

export async function scrapeWebsite(url: string) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new BadRequestError("Firecrawl API key is missing on server");
  }

  const client = new Firecrawl({ apiKey });
  const result = await client.scrape(url, { formats: ["markdown"] });

  const markdown = result.markdown?.trim();
  if (!markdown) {
    throw new BadRequestError("Failed to extract content from URL");
  }

  return {
    markdown,
    title: result.metadata?.title ?? url,
    sourceUrl: result.metadata?.sourceURL ?? url,
  };
}
```

#### 2. YouTube Transcript Extractor (`server/src/lib/youtube.ts`)
```typescript
import { YoutubeTranscript } from "youtube-transcript";
import { BadRequestError } from "../types/app-error.js";

export async function fetchYoutubeTranscript(url: string) {
  try {
    const items = await YoutubeTranscript.fetchTranscript(url);
    if (!items || items.length === 0) {
      throw new BadRequestError("No transcript found for this video");
    }

    const transcript = items.map((item) => item.text).join(" ");
    return {
      transcript,
      url,
    };
  } catch (err) {
    throw new BadRequestError(`Failed to fetch YouTube transcript: ${(err as Error).message}`);
  }
}
```

#### 3. Cloudinary PDF Upload (`server/src/lib/cloudinary.ts`)
```typescript
import { v2 as cloudinary } from "cloudinary";
import { BadRequestError } from "../types/app-error.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadPdfToCloudinary(buffer: Buffer, originalFilename: string) {
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "chaibook_pdfs",
        public_id: `${Date.now()}_${originalFilename}`,
      },
      (error, result) => {
        if (error || !result) {
          return reject(new BadRequestError("Failed to upload PDF to Cloudinary"));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    uploadStream.end(buffer);
  });
}
```

#### 4. Multer Upload Middleware (`server/src/middleware/upload.middleware.ts`)
```typescript
import multer from "multer";
import { BadRequestError } from "../types/app-error.js";

const storage = multer.memoryStorage();

export const uploadSinglePdf = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new BadRequestError("Only PDF files are allowed"));
    }
  },
}).single("file");
```

---

### D. Service & Route Handlers

#### 1. Extended Validators (`server/src/validators/source.validator.ts`)
```typescript
export const importWebsiteSchema = z.object({
  url: z.string().url("Valid URL required"),
  title: z.string().optional(),
});

export const importYoutubeSchema = z.object({
  url: z.string().url("Valid YouTube URL required"),
  title: z.string().optional(),
});

export const importWebSearchSchema = z.object({
  query: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  url: z.string().url().optional(),
});
```

#### 2. Extended Source Service (`server/src/services/source.service.ts`)
```typescript
import { scrapeWebsite } from "../lib/firecrawl.js";
import { fetchYoutubeTranscript } from "../lib/youtube.ts";
import { uploadPdfToCloudinary } from "../lib/cloudinary.js";

export async function importWebsiteSource(workspaceId: string, userId: string, url: string, customTitle?: string) {
  const scraped = await scrapeWebsite(url);
  return createSourceRecord({
    workspaceId,
    type: "WEBSITE",
    title: customTitle || scraped.title,
    content: scraped.markdown,
    url: scraped.sourceUrl,
    status: "PENDING",
  });
}

export async function importYoutubeSource(workspaceId: string, userId: string, url: string, customTitle?: string) {
  const result = await fetchYoutubeTranscript(url);
  return createSourceRecord({
    workspaceId,
    type: "YOUTUBE",
    title: customTitle || `YouTube Transcript: ${url}`,
    content: result.transcript,
    url,
    status: "PENDING",
  });
}

export async function uploadPdfSource(workspaceId: string, userId: string, file: Express.Multer.File, title?: string) {
  const uploaded = await uploadPdfToCloudinary(file.buffer, file.originalname);
  return createSourceRecord({
    workspaceId,
    type: "PDF",
    title: title || file.originalname,
    url: uploaded.url,
    status: "PENDING",
    metadata: { publicId: uploaded.publicId, filename: file.originalname },
  });
}

export async function importWebSearchSource(workspaceId: string, userId: string, data: { title: string; content: string; url?: string }) {
  return createSourceRecord({
    workspaceId,
    type: "WEBSITE",
    title: data.title,
    content: data.content,
    url: data.url,
    status: "PENDING",
  });
}
```

#### 3. Extended Source Routes (`server/src/routes/source.routes.ts`)
> **ROUTE ORDERING RULE**: Specific static sub-paths (`/import/*`, `/upload`, `/bulk-delete`) must be registered BEFORE dynamic param paths (`/:sourceId`).

```typescript
import { Router } from "express";
import { uploadSinglePdf } from "../middleware/upload.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  listSources,
  getSource,
  createSource,
  deleteSource,
  bulkDeleteSources,
  importWebsite,
  importYoutube,
  uploadPdf,
  importWebSearch,
} from "../controllers/source.controller.js";

export const sourceRoutes = Router({ mergeParams: true });

sourceRoutes.get("/", asyncHandler(listSources));
sourceRoutes.post("/", asyncHandler(createSource));
sourceRoutes.post("/bulk-delete", asyncHandler(bulkDeleteSources));

// Import Endpoints
sourceRoutes.post("/import/website", asyncHandler(importWebsite));
sourceRoutes.post("/import/youtube", asyncHandler(importYoutube));
sourceRoutes.post("/upload", uploadSinglePdf, asyncHandler(uploadPdf));
sourceRoutes.post("/import/web-search", asyncHandler(importWebSearch));

// Dynamic Param Endpoints (Must come last)
sourceRoutes.get("/:sourceId", asyncHandler(getSource));
sourceRoutes.delete("/:sourceId", asyncHandler(deleteSource));
```

---

## 3. Environment Setup (`server/.env`)

```env
FIRECRAWL_API_KEY=fc_...
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 4. Verification & Testing

```bash
# 1. Scrape Website
curl -X POST http://localhost:8080/api/workspaces/ws123/sources/import/website \
  -H "Content-Type: application/json" \
  -b "better-auth.session_token=TOKEN" \
  -d '{"url": "https://nextjs.org/docs"}'

# 2. Extract YouTube Transcript
curl -X POST http://localhost:8080/api/workspaces/ws123/sources/import/youtube \
  -H "Content-Type: application/json" \
  -b "better-auth.session_token=TOKEN" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# 3. Upload PDF File
curl -X POST http://localhost:8080/api/workspaces/ws123/sources/upload \
  -b "better-auth.session_token=TOKEN" \
  -F "file=@/path/to/document.pdf"
```
