// HopeApp — Edge Function: ask-cici
// Deploy: copy-paste ke Supabase Dashboard → Edge Functions → ask-cici

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CICI_USER_ID = '00000000-0000-0000-0000-00000000c1c1'
const GEMINI_MODEL = 'gemini-2.0-flash-lite'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Kamu adalah Cici 希 (dibaca: xī), asisten AI ramah di HopeApp — aplikasi koordinasi kelas Bahasa Mandarin program HOPE di POLIBAN (Politeknik Negeri Banjarmasin).

Kepribadian:
- Ramah, ceria, dan suportif seperti kakak kelas yang baik
- Sering menyisipkan kata/frasa Mandarin sederhana dengan pinyin dan artinya
- Jawaban singkat dan to-the-point (maksimal 2-3 paragraf)
- Gunakan emoji secukupnya untuk menambah kesan hangat

Kemampuan:
- Membantu belajar Bahasa Mandarin (translate, kosakata, grammar, pinyin)
- Menjawab pertanyaan umum tentang kelas dan program HOPE
- Memberi motivasi dan semangat belajar
- Menjawab pertanyaan umum lainnya

Batasan:
- JANGAN menjawab pertanyaan yang tidak pantas atau berbahaya
- Jika ditanya sesuatu di luar kemampuan, arahkan dengan sopan
- Selalu jawab dalam Bahasa Indonesia (kecuali diminta dalam bahasa lain)`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const { question, userId, isPrivate, history = [] } = await req.json()

    if (!question || !userId) {
      return json({ error: 'Missing question or userId' })
    }

    const cleanQuestion = question.replace(/@Cici\s*/gi, '').trim()
    if (!cleanQuestion) {
      return json({ error: 'Pertanyaan kosong setelah mention dihapus.' })
    }

    // Gemini API
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      return json({ error: 'AI belum dikonfigurasi. Hubungi admin.' })
    }

    // Parse history for Gemini context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedContents = history.map((msg: any) => ({
      role: msg.isOwn ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))
    
    // Append current formatted question
    formattedContents.push({ role: 'user', parts: [{ text: cleanQuestion }] })

    const FALLBACK_MODELS = [
      'gemini-2.0-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash',
      'gemma-3-27b-it',
      'gemma-3-27b',
      'gemma-4-26b-it',
      'gemma-4-31b-it',
      'gemma-3-12b-it',
      'gemma-3-4b-it',
      'gemini-3-flash',
      'gemini-1.5-flash'
    ]

    let answer = null
    let fallbackTriggered = false
    let apiErrorMsg = null

    for (const modelName of FALLBACK_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`
      
      const payload = JSON.stringify({
        contents: formattedContents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      })

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })

      if (res.ok) {
        const data = await res.json()
        answer = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (answer) {
          console.log(`[ask-cici] Success with model: ${modelName}`)
          break // Berhasil, keluar dari loop
        }
      } else if (res.status === 429) {
        console.warn(`[ask-cici] Model ${modelName} hit quota limit 429. Trying fallback...`)
        fallbackTriggered = true
        continue
      } else {
        const errText = await res.text()
        console.error(`[ask-cici] Model ${modelName} error ${res.status}:`, errText)
        apiErrorMsg = 'Cici sedang tidak bisa merespons saat ini. Coba lagi nanti ya.'
        // Coba model fallback lain jika error 503 / 500
        continue
      }
    }

    if (!answer) {
      if (fallbackTriggered) {
        const friendlyMsg = 'Maaf ya, Cici lagi istirahat sebentar karena sudah banyak yang bertanya hari ini 😊 Coba lagi dalam beberapa menit ya!'
        if (!isPrivate) await insertCiciMessage(friendlyMsg)
        return json({ answer: friendlyMsg })
      }
      return json({ error: apiErrorMsg || 'Hmm, Cici bingung mau jawab apa. Coba tanya dengan cara lain ya!' })
    }

    // Simpan ke grup chat jika bukan private
    let savedMessage = null
    if (!isPrivate) {
      savedMessage = await insertCiciMessage(answer)
    }

    return json({ answer, message: savedMessage })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ask-cici] Error:', msg)
    return json({ error: 'Terjadi kesalahan. Coba lagi nanti.' })
  }
})

async function insertCiciMessage(content: string) {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        user_id: CICI_USER_ID,
        content,
        author_name: 'Cici 希',
        author_number: null,
        author_roles: ['ai_assistant'],
      })
      .select('*')
      .single()

    if (error) {
      console.error('[ask-cici] DB insert error:', error.message)
      return null
    }
    return data
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown'
    console.error('[ask-cici] DB exception:', msg)
    return null
  }
}
