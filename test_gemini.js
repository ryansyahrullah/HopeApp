// Test Gemini API key langsung
// Jalankan: node test_gemini.js YOUR_API_KEY

const apiKey = process.argv[2]

if (!apiKey) {
  console.log('Usage: node test_gemini.js YOUR_GEMINI_API_KEY')
  process.exit(1)
}

const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash-latest']

async function testModel(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Halo, jawab singkat saja: 1+1 berapa?' }] }],
        generationConfig: { maxOutputTokens: 50 }
      })
    })
    
    const text = await res.text()
    console.log(`[${model}] Status: ${res.status}`)
    
    if (res.ok) {
      const data = JSON.parse(text)
      const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text
      console.log(`[${model}] ✅ Answer: ${answer}\n`)
    } else {
      // Parse error
      try {
        const err = JSON.parse(text)
        console.log(`[${model}] ❌ Error: ${err?.error?.message || text}\n`)
      } catch {
        console.log(`[${model}] ❌ Raw: ${text.slice(0, 200)}\n`)
      }
    }
  } catch (e) {
    console.log(`[${model}] ❌ Fetch error: ${e.message}\n`)
  }
}

async function run() {
  console.log('Testing Gemini API key...\n')
  for (const model of models) {
    await testModel(model)
  }
}

run()
