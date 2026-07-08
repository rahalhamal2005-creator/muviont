const fs = require("fs");
const path = require("path");

const filePath = "C:\\Users\\hp\\.gemini\\antigravity\\brain\\35a74df6-578d-4f13-947f-a3388f987006\\.system_generated\\steps\\3766\\content.md";

try {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  console.log(`Searching ${lines.length} lines for video/streaming/movie APIs...`);

  const matches = [];
  const keywords = ["embed", "stream", "movie", "vidsrc", "vidsrc-pro", "2embed", "player", "video player", "anime player", "netflix"];

  lines.forEach((line, idx) => {
    const lowerLine = line.toLowerCase();
    const hasKeyword = keywords.some(k => lowerLine.includes(k));
    if (hasKeyword) {
      matches.push({ lineNum: idx + 1, content: line.trim() });
    }
  });

  console.log(`Found ${matches.length} matching lines.`);
  console.log("Here are the top 50 matches:\n");
  matches.slice(0, 50).forEach(m => {
    console.log(`[Line ${m.lineNum}]: ${m.content}`);
  });

} catch (err) {
  console.error("Error reading file:", err);
}
