import { supabase } from '@/lib/supabase'

export const feedbackService = {
  /**
   * Submit feedback baru
   * @param {string} authorName - Format: "H-001 - Ryan"
   * @param {string} content - Isi masukan
   * @returns {Promise<Object>}
   */
  async submitFeedback(authorName, content) {
    const { data, error } = await supabase
      .from('feedbacks')
      .insert({
        author_name: authorName,
        content: content
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Mengambil feedback dengan pagination
   * @param {number} page - Halaman saat ini (mulai dari 0)
   * @param {number} limit - Jumlah data per muat
   * @returns {Promise<Array>}
   */
  async getAllFeedback(page = 0, limit = 20) {
    const from = page * limit
    const to = from + limit - 1

    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error
    return data
  },

  /**
   * Menghapus feedback (Khusus Admin)
   * @param {string} id - UUID feedback
   * @returns {Promise<void>}
   */
  async deleteFeedback(id) {
    const { error } = await supabase
      .from('feedbacks')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
