import { supabase } from '@/lib/supabase'

export const resumeService = {
  // Get resume for a specific student + meeting
  async getMyResumeByMeeting(meetingId, studentId) {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('student_id', studentId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  // Save or update resume (upsert)
  async saveResume(meetingId, studentId, htmlContent) {
    const { data, error } = await supabase
      .from('resumes')
      .upsert({
        meeting_id: meetingId,
        student_id: studentId,
        content: htmlContent,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'meeting_id,student_id'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get all resumes for a meeting (admin/dosen view)
  async getAllResumesByMeeting(meetingId) {
    const { data, error } = await supabase
      .from('resumes')
      .select('*, profiles:student_id(full_name, nim)')
      .eq('meeting_id', meetingId)

    if (error) throw error
    return data || []
  },

  // Get all resumes by a specific student
  async getMyAllResumes(studentId) {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('student_id', studentId)

    if (error) throw error
    return data || []
  },

  // Get all resumes (for summary matrix)
  async getAllResumes() {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')

    if (error) throw error
    return data || []
  }
}
