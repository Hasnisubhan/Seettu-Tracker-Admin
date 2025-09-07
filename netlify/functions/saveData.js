// netlify/functions/saveData.js
const fs = require("fs");
const path = require("path");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);

    // Save to a JSON file in Netlify build folder
    const filePath = path.join("/tmp", "seettu.json");
    fs.writeFileSync(filePath, JSON.stringify(body, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "✅ Data saved successfully" })
    };
  } catch (err) {
    return { statusCode: 500, body: "❌ Failed to save data" };
  }
};
