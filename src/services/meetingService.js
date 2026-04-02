import { supabase } from '@/lib/supabase'

export const meetingService = {
  async getMeetings() {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('meeting_number', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getMeetingById(id) {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async createMeeting(meetingData) {
    // Check duplicate meeting_number
    const { data: existing } = await supabase
      .from('meetings')
      .select('id')
      .eq('meeting_number', Number(meetingData.meeting_number))
      .maybeSingle()

    if (existing) {
      throw new Error('Nomor Sesi sudah digunakan. Silakan gunakan nomor yang lain.')
    }

    const { data, error } = await supabase
      .from('meetings')
      .insert({
        meeting_number: Number(meetingData.meeting_number),
        title: meetingData.title,
        topic: meetingData.topic,
        meeting_date: meetingData.meeting_date,
        video_url: meetingData.video_url || null
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateMeeting(id, meetingData) {
    // Check duplicate meeting_number (exclude self)
    const { data: existing } = await supabase
      .from('meetings')
      .select('id')
      .eq('meeting_number', Number(meetingData.meeting_number))
      .neq('id', id)
      .maybeSingle()

    if (existing) {
      throw new Error('Nomor Sesi sudah digunakan. Silakan gunakan nomor yang lain.')
    }

    const { data, error } = await supabase
      .from('meetings')
      .update({
        meeting_number: Number(meetingData.meeting_number),
        title: meetingData.title,
        topic: meetingData.topic,
        meeting_date: meetingData.meeting_date,
        video_url: meetingData.video_url || null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteMeeting(id) {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }
}
