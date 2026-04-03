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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`

    // Parse history for Gemini context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedContents = history.map((msg: any) => ({
      role: msg.isOwn ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))
    
    // Append current formatted question
    formattedContents.push({ role: 'user', parts: [{ text: cleanQuestion }] })

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: formattedContents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    })

    // Quota habis → pesan manusiawi
    if (geminiRes.status === 429) {
      const friendlyMsg = 'Maaf ya, Cici lagi istirahat sebentar karena sudah banyak yang bertanya hari ini 😊 Coba lagi dalam beberapa menit ya!'

      // Kalau di grup chat, kirim pesan ini sebagai Cici
      if (!isPrivate) {
        await insertCiciMessage(friendlyMsg)
      }

      return json({ answer: friendlyMsg })
    }

    // Error lain dari Gemini
    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error(`[ask-cici] Gemini ${geminiRes.status}:`, errText)
      return json({ error: 'Cici sedang tidak bisa merespons saat ini. Coba lagi nanti ya.' })
    }

    const data = await geminiRes.json()
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!answer) {
      return json({ error: 'Hmm, Cici bingung mau jawab apa. Coba tanya dengan cara lain ya!' })
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
