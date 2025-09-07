// netlify/functions/loadData.js
exports.handler = async () => {
  try {
    // In production, use Netlify Blobs or external DB
    const data = { test: "Hello Seettu!" };
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 500, body: "❌ Failed to load data" };
  }
};
