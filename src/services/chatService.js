import { supabase } from '@/lib/supabase'

export const chatService = {
  /**
   * Mengambil pesan terbaru dengan data profil pengirim
   * @param {number} limit - Jumlah pesan yang diambil
   * @returns {Promise<Array>}
   */
  async getMessages(limit = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    // Reverse agar pesan terlama di atas, terbaru di bawah
    return (data || []).reverse()
  },

  /**
   * Memuat pesan lebih lama (pagination scroll ke atas)
   * @param {string} beforeTimestamp - ISO timestamp pesan paling atas
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async loadOlderMessages(beforeTimestamp, limit = 30) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .lt('created_at', beforeTimestamp)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []).reverse()
  },

  /**
   * Mengirim pesan baru
   * @param {string} userId
   * @param {string} content
   * @returns {Promise<Object>}
   */
  async sendMessage(userId, content, authorName, authorNumber, authorRoles, authorAvatar, isAnonymous = false) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ 
        user_id: userId, 
        content: content.trim(),
        author_name: authorName,
        author_number: authorNumber,
        author_roles: authorRoles,
        author_avatar: authorAvatar,
        author_is_anonymous: isAnonymous
      })
      .select('*')
      .single()


    if (error) throw error
    return data
  },


  /**
   * Mengedit pesan
   * @param {string} id - UUID pesan
   * @param {string} newContent - Konten baru
   * @returns {Promise<Object>}
   */
  async updateMessage(id, newContent) {
    const { data, error } = await supabase
      .from('messages')
      .update({
        content: newContent.trim(),
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  /**
   * Menghapus pesan
   * @param {string} id - UUID pesan
   */
  async deleteMessage(id) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Subscribe ke pesan baru secara realtime
   * @param {Function} onInsert - Callback saat ada pesan baru
   * @returns {Object} subscription channel (untuk unsubscribe)
   */
  subscribeToMessages(onInsert) {
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          // Fetch full data
          const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('id', payload.new.id)
            .single()

          if (data) onInsert(data)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          if (onInsert._onUpdate) onInsert._onUpdate(payload.new)
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          if (onInsert._onDelete) onInsert._onDelete(payload.old.id)
        }
      )
      .subscribe()

    return channel
  },

  /**
   * Unsubscribe dari realtime channel
   * @param {Object} channel
   */
  unsubscribe(channel) {
    if (channel) {
      supabase.removeChannel(channel)
    }
  }
}
