import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DatabaseSync } from "node:sqlite";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(scriptDir, "../../data/myrss.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

for (const suffix of ["", "-journal", "-wal", "-shm"]) {
  try {
    fs.rmSync(`${dbPath}${suffix}`, { force: true });
  } catch {
    // Ignore locked files; SQLite will reuse the existing database path.
  }
}

const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS Workspace (
    id TEXT PRIMARY KEY NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Feed (
    id TEXT PRIMARY KEY NOT NULL,
    workspaceId TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    siteUrl TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspaceId) REFERENCES Workspace(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Article (
    id TEXT PRIMARY KEY NOT NULL,
    workspaceId TEXT NOT NULL,
    feedId TEXT,
    title TEXT NOT NULL,
    originalUrl TEXT NOT NULL,
    canonicalUrl TEXT NOT NULL,
    author TEXT,
    summary TEXT,
    status TEXT NOT NULL DEFAULT 'ready',
    readState TEXT NOT NULL DEFAULT 'unread',
    favorite INTEGER NOT NULL DEFAULT 0,
    language TEXT,
    publishedAt DATETIME,
    importedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspaceId) REFERENCES Workspace(id) ON DELETE CASCADE,
    FOREIGN KEY (feedId) REFERENCES Feed(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS ArticleContent (
    id TEXT PRIMARY KEY NOT NULL,
    workspaceId TEXT NOT NULL,
    articleId TEXT NOT NULL UNIQUE,
    markdownContent TEXT,
    textContent TEXT,
    wordCount INTEGER,
    fetchedAt DATETIME,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (articleId) REFERENCES Article(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ArticleSource (
    id TEXT PRIMARY KEY NOT NULL,
    workspaceId TEXT NOT NULL,
    articleId TEXT NOT NULL,
    feedId TEXT,
    sourceType TEXT NOT NULL,
    feedTitle TEXT,
    originalUrl TEXT NOT NULL,
    importedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (articleId) REFERENCES Article(id) ON DELETE CASCADE,
    FOREIGN KEY (feedId) REFERENCES Feed(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_Feed_workspaceId_createdAt
    ON Feed(workspaceId, createdAt);
  CREATE INDEX IF NOT EXISTS idx_Article_workspaceId_importedAt
    ON Article(workspaceId, importedAt);
  CREATE INDEX IF NOT EXISTS idx_Article_workspaceId_readState_importedAt
    ON Article(workspaceId, readState, importedAt);
  CREATE INDEX IF NOT EXISTS idx_Article_workspaceId_status_importedAt
    ON Article(workspaceId, status, importedAt);
  CREATE INDEX IF NOT EXISTS idx_ArticleContent_workspaceId_articleId
    ON ArticleContent(workspaceId, articleId);
  CREATE INDEX IF NOT EXISTS idx_ArticleSource_workspaceId_articleId
    ON ArticleSource(workspaceId, articleId);
`);

db.close();

console.log(`SQLite database initialized at ${dbPath}`);
