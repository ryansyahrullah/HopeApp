import { supabase } from '@/lib/supabase'


export const dmService = {
  /**
   * Mengirim pesan pribadi
   */
  async sendPrivateMessage(recipientId, content, authorName, authorAvatar) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('private_messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content: content.trim(),
        author_name: authorName,
        author_avatar: authorAvatar
      })
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  /**
   * Mengambil riwayat chat dengan user tertentu
   */
  async getPrivateMessages(otherUserId, limit = 50) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('private_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data.reverse() // Balik agar urutan kronologis (bawah terbaru)
  },

  /**
   * Mengambil daftar percakapan (Inbox)
   * Mengambil pesan-pesan terbaru di mana user terlibat
   */
  async getInbox() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Ambil 100 pesan terbaru yang melibatkan user
    const { data, error } = await supabase
      .from('private_messages')
      .select(`
        *,
        sender:profiles!private_messages_sender_id_fkey(full_name, avatar_url, is_anonymous),
        recipient:profiles!private_messages_recipient_id_fkey(full_name, avatar_url, is_anonymous)
      `)

      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error

    // Filter unik per teman bicara
    const conversations = []
    const seenUsers = new Set()

    data.forEach(msg => {
      const otherUser = msg.sender_id === user.id ? msg.recipient : msg.sender
      const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id

      if (!seenUsers.has(otherId)) {
        seenUsers.add(otherId)
        conversations.push({
          other_user_id: otherId,
          other_user_name: otherUser?.full_name || 'Unknown',
          other_user_avatar: otherUser?.avatar_url || null,
          last_message: msg.content,
          last_message_time: msg.created_at,
          unread_count: msg.recipient_id === user.id && !msg.is_read ? 1 : 0 // Sederhana, bisa ditingkatkan
        })
      }
    })

    return conversations
  },

  /**
   * Tandai pesan sebagai dibaca
   */
  async markAsRead(fromUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('private_messages')
      .update({ is_read: true })
      .match({ sender_id: fromUserId, recipient_id: user.id, is_read: false })

    if (error) console.error('Mark as read error:', error)
  },

  /**
   * Subscribe ke pesan pribadi (Realtime)
   */
  subscribeToDMs(callback) {
    return supabase
      .channel('dm-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'private_messages' },
        (payload) => callback(payload.new)
      )
      .subscribe()
  },

  unsubscribe(channel) {
    if (channel) supabase.removeChannel(channel)
  }
}
