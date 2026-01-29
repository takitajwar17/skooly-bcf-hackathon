# 🎓 Skooly - Implementation Plan

## AI-Powered Supplementary Learning Platform

> **Hackathon Duration:** 7 Hours  
> **Tech Stack:** Next.js 16 + MongoDB Atlas + Gemini AI + Clerk Auth

---

## ⏰ Time Allocation

| Phase | Time | Hours | Focus |
|-------|------|-------|-------|
| **Phase 1** | 0:00 - 1:00 | 1h | Setup + Models + Gemini |
| **Phase 2** | 1:00 - 2:30 | 1.5h | CMS + File Upload |
| **Phase 3** | 2:30 - 4:00 | 1.5h | RAG Search Engine |
| **Phase 4** | 4:00 - 5:30 | 1.5h | AI Generation + Validation |
| **Phase 5** | 5:30 - 6:30 | 1h | Chat Interface |
| **Phase 6** | 6:30 - 7:00 | 0.5h | Polish + Demo |

---

## Phase 1: Project Setup (Hour 0-1)

### 1.1 Install Dependencies

```bash
npm install @google/generative-ai pdf-parse mammoth uuid cloudinary
```

### 1.2 Create Database Models

#### [NEW] `lib/models/Material.js`

```javascript
// Fields: title, description, category (theory/lab), type, topic, week, tags, 
// filePath, fileUrl, mimeType, content, uploadedBy
```

#### [NEW] `lib/models/Embedding.js`

```javascript
// Fields: materialId, chunkIndex, content, embedding (768-dim), metadata
```

#### [NEW] `lib/models/ChatHistory.js`

```javascript
// Fields: userId, title, messages[], createdAt, updatedAt
```

### 1.3 Setup Gemini AI Client

#### [NEW] `lib/ai/gemini.js`

- Initialize GoogleGenerativeAI client
- Export chat model (gemini-1.5-flash)
- Export embedding model (text-embedding-004)

### 1.4 Environment Variables

```env
GOOGLE_API_KEY=AIza...
MONGODB_URI=mongodb+srv://...

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Phase 2: Content Management System (Hour 1-2:30)

### 2.1 File Parsing

#### [NEW] `lib/parsers/fileParser.js`

- Parse PDF files (pdf-parse)
- Parse DOCX files (mammoth)
- Parse code files (raw text)
- Extract structured content

### 2.2 Cloudinary Integration

#### [NEW] `lib/cloudinary/config.js`

```javascript
// Initialize Cloudinary SDK
// Configure with environment variables
// Export cloudinary instance and upload helpers
```

#### [NEW] `lib/cloudinary/upload.js`

```javascript
// Functions:
// - uploadFile(file, options) → { publicId, secureUrl, resourceType }
// - uploadImage(file) → optimized image URL
// - uploadVideo(file) → video URL with transformations
// - uploadDocument(file) → raw file URL (PDF, DOCX, etc.)
// - deleteFile(publicId) → remove from Cloudinary
```

### 2.3 Upload API

#### [NEW] `app/api/upload/route.js`

- Handle multipart file upload
- Upload to Cloudinary (auto-detect resource type)
- Store Cloudinary URL + publicId in Material document
- Parse file content for embeddings
- Trigger embedding generation

### 2.4 Materials CRUD API

#### [NEW] `app/api/materials/route.js`

- GET: List materials with filters (category, type, week, tags)
- POST: Create material (admin only)

#### [NEW] `app/api/materials/[id]/route.js`

- GET: Get single material
- PUT: Update material
- DELETE: Delete material + embeddings + Cloudinary file

### 2.5 Admin Upload UI

#### [NEW] `app/admin/upload/page.jsx`

- Drag & drop file upload (images, videos, documents)
- Metadata form (title, category, topic, week, tags)
- Upload progress indicator (Cloudinary upload progress)
- Preview uploaded media (image/video thumbnails via Cloudinary transformations)

### 2.6 Materials Browser UI

#### [NEW] `app/materials/page.jsx`

- Grid view of materials with Cloudinary thumbnails
- Filter by category (Theory/Lab), type, week
- Search by tags
- Video previews using Cloudinary video player

#### [NEW] `app/materials/[id]/page.jsx`

- View material details
- Download original file (Cloudinary URL)
- Stream video/audio content
- View extracted content

---

## Phase 3: RAG Search Engine (Hour 2:30-4:00)

### 3.1 Embedding Generation

#### [NEW] `lib/ai/embeddings.js`

```javascript
// Functions:
// - generateEmbedding(text) → 768-dim vector
// - chunkText(content, maxTokens=500) → chunks[]
// - createEmbeddings(materialId, content) → save chunks to DB
```

### 3.2 RAG Implementation

#### [NEW] `lib/ai/rag.js`

```javascript
// Functions:
// - semanticSearch(query, limit=5, category=null) → chunks[]
// - generateRAGResponse(query, context) → response + sources
// - getRelevantContext(query) → formatted context string
```

### 3.3 Search API

#### [NEW] `app/api/search/route.js`

- POST: Accept natural language query
- Generate query embedding
- Vector search in MongoDB Atlas
- Return ranked results with scores

### 3.4 Search UI

#### [NEW] `app/search/page.jsx`

- Natural language search bar
- Result cards with relevance score
- Source material links
- Category filter tabs

---

## Phase 4: AI Generation + Validation (Hour 4:00-5:30)

### 4.1 Content Generation

#### [NEW] `lib/ai/generate.js`

```javascript
// Functions:
// - generateTheoryContent(topic, context) → notes/summary
// - generateLabContent(topic, language, context) → code + explanation
// - generateWithValidation(type, topic) → content + validation
```

#### System Prompts

- **Theory**: Structured notes with headers, bullet points, examples
- **Lab**: Syntactically correct code with comments, explanations

### 4.2 Content Validation

#### [NEW] `lib/ai/validate.js`

```javascript
// Functions:
// - validateTheory(content, sources) → accuracy score
// - validateCode(code, language) → syntax check + relevance
// - selfEvaluate(content) → AI confidence score
```

### 4.3 Generation API

#### [NEW] `app/api/generate/route.js`

- POST: Accept topic + type (theory/lab)
- Fetch RAG context
- Generate content
- Validate and score
- Return with sources

### 4.4 Generation UI

#### [NEW] `app/generate/page.jsx`

- Topic input field
- Type selector (Theory/Lab)
- Language selector (for Lab)
- Generated content display (markdown)
- Validation score badge
- Copy/Download buttons

---

## Phase 5: Chat Interface (Hour 5:30-6:30)

### 5.1 Chat Engine

#### [NEW] `lib/ai/chat.js`

```javascript
// Functions:
// - processMessage(message, history, userId) → response
// - detectIntent(message) → search/generate/explain/general
// - formatResponse(content, sources) → structured response
```

### 5.2 Chat API

#### [NEW] `app/api/chat/route.js`

- POST: Accept message + chatId
- Load chat history
- Detect intent (search/generate/explain)
- Route to appropriate handler
- Stream response
- Save to history

#### [NEW] `app/api/chat/history/route.js`

- GET: List user's chat sessions
- DELETE: Delete chat session

### 5.3 Chat UI

#### [NEW] `app/chat/page.jsx`

- Chat message list (user/assistant bubbles)
- Message input with send button
- Source citations with links
- Code syntax highlighting
- Chat history sidebar
- Streaming response indicator

---

## Phase 6: Polish + Demo (Hour 6:30-7:00)

### 6.1 Error Handling

- API error responses
- Loading skeletons
- Empty states

### 6.2 Demo Preparation

- Upload sample materials
- Prepare demo queries
- Test all flows

### 6.3 Documentation

- Update README
- Record demo video (optional)

---

## 🎁 Bonus Features (If Time Permits)

### Bonus 1: Handwritten Notes OCR

```javascript
// lib/ai/ocr.js
// Use Gemini Vision to extract text from handwritten notes
// Convert to structured markdown/LaTeX
```

### Bonus 2: Content-to-Video (NotebookLM style)

```javascript
// Use TTS API for audio
// Generate visual slides from content
```

### Bonus 3: Community + Bot Support

```javascript
// Discussion threads per material
// Auto-reply bot using RAG when receiver unavailable
```

---

## ✅ Definition of Done

- [ ] Admin can upload PDF/DOCX/code files
- [ ] Materials are browsable by category/week/tags
- [ ] Students can search using natural language
- [ ] Search returns relevant chunks with sources
- [ ] AI generates theory notes from topics
- [ ] AI generates code examples from topics
- [ ] Generated content is validated/scored
- [ ] Chat interface accesses all features
- [ ] Chat maintains conversation context
- [ ] Responses cite source materials

---

## 🚀 Quick Start

```bash
# 1. Install new dependencies
npm install @google/generative-ai pdf-parse mammoth uuid cloudinary

# 2. Setup .env.local
cp .env.example .env.local
# Add GOOGLE_API_KEY
# Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

# 3. Create MongoDB Atlas vector search index
# Collection: embeddings
# Index name: embedding_index

# 4. Run development server
npm run dev
```
