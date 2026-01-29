# 🚀 Embedding & RAG Setup Guide

## ✅ What's Been Implemented

### 1. **Automatic Embedding Creation** ✓
- **File**: `app/api/upload/route.js`
- **What it does**: When you upload a new material, it automatically:
  - Parses the file content
  - Chunks it into smaller pieces
  - Creates 768-dimensional vector embeddings using Google Gemini
  - Stores them in MongoDB for semantic search

### 2. **Stats Endpoint** ✓
- **URL**: `GET /api/embeddings/stats`
- **What it does**: Shows you:
  - Total materials vs materials with embeddings
  - Coverage percentage
  - Which materials are vectorized
  - Which materials need embeddings

### 3. **Backfill Endpoint** ✓
- **URL**: `POST /api/embeddings/backfill`
- **What it does**: Processes existing materials that don't have embeddings yet
- **Features**:
  - Skips materials that already have embeddings
  - Force mode to regenerate embeddings
  - Detailed progress reporting
  - Admin-only access

---

## 🔧 How to Use

### **Check Current Status**

```bash
# Visit in browser or use curl:
curl http://localhost:3001/api/embeddings/stats
```

**Response example:**
```json
{
  "success": true,
  "stats": {
    "totalMaterials": 10,
    "totalEmbeddings": 45,
    "materialsWithEmbeddings": 5,
    "materialsWithoutEmbeddings": 5,
    "coverage": "50%"
  },
  "materialsWithEmbeddings": [...],
  "materialsWithoutEmbeddings": [...]
}
```

### **Backfill Existing Materials**

#### Option 1: Check what needs processing
```bash
curl http://localhost:3001/api/embeddings/backfill
```

#### Option 2: Process all materials without embeddings
```bash
curl -X POST http://localhost:3001/api/embeddings/backfill \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Option 3: Process specific materials
```bash
curl -X POST http://localhost:3001/api/embeddings/backfill \
  -H "Content-Type: application/json" \
  -d '{
    "materialIds": ["material_id_1", "material_id_2"]
  }'
```

#### Option 4: Force regenerate all embeddings
```bash
curl -X POST http://localhost:3001/api/embeddings/backfill \
  -H "Content-Type: application/json" \
  -d '{
    "force": true
  }'
```

---

## 📊 MongoDB Atlas Vector Index Setup

**⚠️ IMPORTANT**: For semantic search to work, you MUST create a vector search index in MongoDB Atlas.

### Steps:

1. **Go to MongoDB Atlas Dashboard**
   - Navigate to your cluster
   - Click "Search" tab
   - Click "Create Search Index"

2. **Choose "JSON Editor"**

3. **Paste this configuration:**

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "embedding": {
        "type": "knnVector",
        "dimensions": 768,
        "similarity": "cosine"
      },
      "metadata": {
        "type": "document",
        "dynamic": true
      }
    }
  }
}
```

4. **Settings:**
   - **Index Name**: `embedding_index` (must be exactly this)
   - **Database**: Your database name (e.g., `bcf-hackathon`)
   - **Collection**: `embeddings`

5. **Click "Create Search Index"**

6. **Wait for index to build** (can take a few minutes)

---

## 🧪 Testing

### Test 1: Upload a new material
1. Go to `/admin/upload`
2. Upload a PDF or document
3. Check terminal logs - should see:
   ```
   9. Creating embeddings for semantic search...
   ✓ Created X embedding chunks for vector search
   ```

### Test 2: Check stats
```bash
curl http://localhost:3001/api/embeddings/stats
```

### Test 3: Test semantic search
```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "explain database normalization",
    "mode": "search"
  }'
```

### Test 4: Test RAG (AI-powered search)
```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "what is normalization?",
    "mode": "rag"
  }'
```

---

## 📁 File Structure

```
app/
├── api/
│   ├── upload/
│   │   └── route.js          # ✅ Now creates embeddings
│   ├── search/
│   │   └── route.js          # Semantic search endpoint
│   ├── chat/
│   │   └── route.js          # RAG-powered chat
│   └── embeddings/
│       ├── stats/
│       │   └── route.js      # ✅ NEW: Check embedding status
│       └── backfill/
│           └── route.js      # ✅ NEW: Backfill existing materials

lib/
├── ai/
│   ├── rag.js                # RAG logic & embedding creation
│   └── gemini.js             # AI model integration
└── models/
    ├── Material.js           # Material schema
    └── Embedding.js          # Embedding schema (768-dim vectors)
```

---

## 🎯 How RAG Search Works

```
User Query: "Explain quicksort algorithm"
           ↓
1. Convert query to 768-dim vector (embedding)
           ↓
2. MongoDB Atlas Vector Search
   - Finds similar embeddings using cosine similarity
   - Returns top 5 most relevant chunks
           ↓
3. Build context from retrieved chunks
           ↓
4. Send to Gemini AI:
   - Query + Context from course materials
           ↓
5. AI generates natural language answer
   - Cites sources
   - Returns relevant materials
           ↓
6. User gets answer + source links
```

---

## 🐛 Troubleshooting

### "No results found" when searching
- **Check**: Run `/api/embeddings/stats` - are materials vectorized?
- **Fix**: Run backfill endpoint to create embeddings

### "Vector search failed"
- **Check**: Is the Atlas vector index created?
- **Fix**: Follow MongoDB Atlas setup steps above

### "Embedding creation failed" during upload
- **Check**: Is `GOOGLE_API_KEY` set in `.env.local`?
- **Check**: Terminal logs for specific error
- **Note**: Material still saves, just won't be searchable

### Backfill takes too long
- **Solution**: Process in batches using `materialIds` parameter
- **Example**: Process 5 materials at a time

---

## 🔑 Environment Variables Required

```env
# .env.local
GOOGLE_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_atlas_uri
```

---

## 📈 Next Steps

1. ✅ Upload route now creates embeddings automatically
2. ✅ Stats endpoint to monitor coverage
3. ✅ Backfill endpoint for existing materials
4. ⏳ Create MongoDB Atlas vector index (manual step)
5. ⏳ Run backfill for existing materials
6. ⏳ Test search functionality
7. ⏳ Build search UI in dashboard

---

## 🎓 Benefits

- **Semantic Search**: Find materials by meaning, not just keywords
- **Natural Language**: Ask questions like "how do I sort arrays?"
- **Context-Aware**: AI understands programming concepts
- **Multi-Format**: Works with PDFs, code files, slides, notes
- **Fast**: Vector search is extremely efficient
- **Accurate**: Cites actual course materials

---

**Status**: ✅ Backend complete, ready for MongoDB Atlas index setup!

