# Gemini File Search API Setup

## Quick Start

### 1. Initialize FileSearchStore

Run the initialization script to create your FileSearchStore:

```bash
node scripts/init-file-search-store.js
```

This will:

- Create a new FileSearchStore named "Skooly Course Materials"
- Display the store name to add to your `.env.local`

### 2. Update Environment Variables

Add the FileSearchStore name to `.env.local`:

```bash
# Add this line (use the actual name from the init script output)
FILE_SEARCH_STORE_NAME=projects/YOUR_PROJECT/locations/us/fileSearchStores/YOUR_STORE_ID
```

### 3. Restart Development Server

```bash
npm run dev
```

## How It Works

### Upload Flow

1. File uploaded to Cloudinary (for storage/delivery)
2. File uploaded to FileSearchStore (for AI search/RAG)
3. Material document created in MongoDB with `fileSearchDocumentId`

### Search Flow

1. User query sent to `/api/search`
2. Gemini FileSearch tool performs semantic search
3. Returns AI response with automatic citations

### Delete Flow

1. Delete from FileSearchStore (indexed document)
2. Delete from Cloudinary (file storage)
3. Delete from MongoDB (metadata)

## API Changes

### Upload API (`/api/upload`)

- ✅ Automatic file indexing (no manual parsing/chunking)
- ✅ Supports all file types (PDF, DOCX, code, etc.)
- ✅ Stores `fileSearchDocumentId` reference

### Search API (`/api/search`)

- ✅ Uses FileSearch tool for semantic search
- ✅ Returns citations automatically
- ✅ Simplified from ~80 lines to ~50 lines

### Delete API (`/api/materials/[id]`)

- ✅ Deletes from FileSearchStore
- ✅ Deletes from Cloudinary
- ✅ Deletes from MongoDB

## Benefits

- 🎯 **~600 lines of code removed** (no manual parsing/chunking/embedding)
- 💰 **60-80% cost savings** (free storage, free query embeddings)
- 🚀 **Simpler architecture** (just upload → query)
- ✨ **Built-in citations** and better accuracy
- 📦 **No MongoDB Vector Search** required

## Migration Notes

### What Changed

- Removed: `lib/ai/rag.js`, `lib/ai/embedding.js`, `lib/parsers/fileParser.js`
- Updated: Material model (added `fileSearchDocumentId`)
- Simplified: Upload, Search, Delete APIs

### What Stayed

- MongoDB for material metadata
- Cloudinary for file storage/delivery
- Clerk for authentication
- Next.js App Router structure

## Troubleshooting

### FileSearchStore not configured error

- Make sure `FILE_SEARCH_STORE_NAME` is set in `.env.local`
- Run `node scripts/init-file-search-store.js` if not created

### Upload fails

- Check `GOOGLE_API_KEY` is valid
- Ensure FileSearchStore exists
- Check temp directory permissions

### Search returns no results

- Verify files were uploaded after FileSearchStore setup
- Check FileSearchStore name is correct
- Ensure materials have `fileSearchDocumentId`
