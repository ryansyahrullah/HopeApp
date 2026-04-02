import { supabase } from '@/lib/supabase'

export const presensiService = {
  // Get all attendance records (for matrix views)
  async getAllPresensi() {
    const { data, error } = await supabase
      .from('attendances')
      .select('*')

    if (error) throw error
    return data || []
  },

  // Get attendance for a specific meeting, enriched with student info
  async getPresensiByMeeting(meetingId) {
    // Get all mahasiswa profiles
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, full_name, nim')
      .contains('roles', ['mahasiswa'])

    if (studentsError) throw studentsError

    // Get existing attendance records for this meeting
    const { data: records, error: recordsError } = await supabase
      .from('attendances')
      .select('*')
      .eq('meeting_id', meetingId)

    if (recordsError) throw recordsError

    // Merge: for each student, find their attendance record
    const enriched = (students || []).map(student => {
      const record = (records || []).find(r => r.student_id === student.id)
      return {
        student_id: student.id,
        student_name: student.full_name,
        nim: student.nim,
        is_present: record ? record.is_present : null,
        status: record ? record.status : '',
        note: record ? record.note : ''
      }
    })

    return enriched
  },

  // Batch save/update attendance (admin only)
  async savePresensiBatch(meetingId, presensiDataArray) {
    // Use upsert with the unique constraint (meeting_id, student_id)
    const records = presensiDataArray.map(item => ({
      meeting_id: meetingId,
      student_id: item.student_id,
      is_present: item.is_present,
      status: item.status,
      note: item.note || '',
      updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('attendances')
      .upsert(records, {
        onConflict: 'meeting_id,student_id'
      })

    if (error) throw error
    return true
  }
}
