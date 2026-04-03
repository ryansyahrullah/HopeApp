import { supabase } from '@/lib/supabase'

// Rate limiting: max 3 requests per minute per session
const requestTimestamps = []
const MAX_REQUESTS = 3
const TIME_WINDOW_MS = 60 * 1000 // 1 minute

function isRateLimited() {
  const now = Date.now()
  // Remove timestamps older than the time window
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > TIME_WINDOW_MS) {
    requestTimestamps.shift()
  }
  return requestTimestamps.length >= MAX_REQUESTS
}

function trackRequest() {
  requestTimestamps.push(Date.now())
}

/**
 * Ask Cici AI assistant a question.
 *
 * @param {string} question - The question asked by the user
 * @param {string} userId - The UUID of the asking user
 * @param {boolean} isPrivate - If true, Edge Function will NOT save the answer to the public group chat DB.
 * @returns {Promise<{ success: boolean, message?: object, answer?: string, error?: string }>}
 */
export async function askCici(question, userId, isPrivate = false) {
  // Client-side rate limiting
  if (isRateLimited()) {
    return {
      success: false,
      error: 'Kamu sudah bertanya 3 kali dalam 1 menit. Tunggu sebentar ya! ⏳'
    }
  }

  trackRequest()

  try {
    const { data, error } = await supabase.functions.invoke('ask-cici', {
      body: { question, userId, isPrivate }
    })

    if (error) throw error

    if (data?.error) {
      return { success: false, error: data.error }
    }

    return { success: true, message: data?.message, answer: data?.answer }
  } catch (err) {
    console.error('[aiService] askCici error:', err)
    return {
      success: false,
      error: err.message || 'Gagal menghubungi Cici. Coba lagi nanti.'
    }
  }
}
