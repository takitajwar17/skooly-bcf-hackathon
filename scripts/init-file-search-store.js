/**
 * Initialize FileSearchStore for the application
 * Run this script once to create the FileSearchStore
 *
 * Usage: node scripts/init-file-search-store.js
 * Reads GOOGLE_API_KEY from .env.local automatically
 */

const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const path = require("path");

// Read .env.local file
const envPath = path.join(__dirname, "..", ".env.local");
let apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const match = envContent.match(/GOOGLE_API_KEY=(.+)/);
  if (match) {
    apiKey = match[1].trim();
  }
}

if (!apiKey) {
  console.error("Error: GOOGLE_API_KEY not found");
  console.log("\nPlease ensure GOOGLE_API_KEY is set in .env.local");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function createFileSearchStore(displayName) {
  try {
    const store = await ai.fileSearchStores.create({
      config: { displayName },
    });
    console.log(`Created FileSearchStore: ${store.name}`);
    return store;
  } catch (error) {
    console.error("Failed to create FileSearchStore:", error);
    throw error;
  }
}

async function listFileSearchStores() {
  try {
    const stores = await ai.fileSearchStores.list();
    return stores;
  } catch (error) {
    console.error("Failed to list FileSearchStores:", error);
    throw error;
  }
}

async function initializeFileSearchStore() {
  try {
    console.log("Initializing FileSearchStore...\n");

    // Check if store already exists
    console.log("1. Checking for existing FileSearchStores...");
    const stores = await listFileSearchStores();

    if (stores && stores.length > 0) {
      console.log(`\nFound ${stores.length} existing FileSearchStore(s):`);
      stores.forEach((store, idx) => {
        console.log(`   ${idx + 1}. ${store.name}`);
        console.log(`      Display Name: ${store.displayName || "N/A"}`);
      });

      console.log("\n===========================================");
      console.log("FileSearchStore already exists!");
      console.log("===========================================");
      console.log("\nAdd this line to your .env.local:\n");
      console.log(`FILE_SEARCH_STORE_NAME=${stores[0].name}`);
      console.log("\n===========================================\n");
      return;
    }

    // Create new FileSearchStore
    console.log("   No existing stores found.\n");
    console.log("2. Creating new FileSearchStore...");

    const displayName = "Skooly Course Materials";
    const store = await createFileSearchStore(displayName);

    console.log("\n===========================================");
    console.log("SUCCESS! FileSearchStore created!");
    console.log("===========================================");
    console.log(`\nName: ${store.name}`);
    console.log(`Display Name: ${store.displayName || displayName}`);

    console.log("\n===========================================");
    console.log("NEXT STEP: Add this to your .env.local");
    console.log("===========================================\n");
    console.log(`FILE_SEARCH_STORE_NAME=${store.name}`);
    console.log("\n===========================================");
    console.log("\nThen restart your dev server!");
  } catch (error) {
    console.error("\nError initializing FileSearchStore:");
    console.error(error.message || error);
    process.exit(1);
  }
}

initializeFileSearchStore();
