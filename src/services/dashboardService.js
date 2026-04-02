import { supabase } from '@/lib/supabase'

export const dashboardService = {
  // Admin/Dosen stats
  async getAdminStats() {
    // Total meetings
    const { count: totalMeetings } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true })

    // Total students
    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .contains('roles', ['mahasiswa'])

    const totalStudents = students?.length || 0

    // Average attendance
    const { data: attendances } = await supabase
      .from('attendances')
      .select('is_present')

    const totalRecords = attendances?.length || 1
    const hadirs = (attendances || []).filter(a => a.is_present).length
    const avgAttendance = Math.round((hadirs / totalRecords) * 100)

    return {
      totalMeetings: totalMeetings || 0,
      totalStudents,
      avgAttendance: totalRecords > 1 ? avgAttendance : 0
    }
  },

  // Mahasiswa-specific stats
  async getMahasiswaStats(studentId) {
    // Total meetings
    const { count: totalMeetings } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true })

    // Student's attendance
    const { data: myAttendances } = await supabase
      .from('attendances')
      .select('is_present')
      .eq('student_id', studentId)

    const totalHadir = (myAttendances || []).filter(a => a.is_present).length
    const attendancePercent = (totalMeetings || 0) > 0
      ? Math.round((totalHadir / totalMeetings) * 100)
      : 0

    // Missing resumes
    const { count: totalResumes } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)

    const missingResumes = Math.max(0, (totalMeetings || 0) - (totalResumes || 0))

    return {
      attendancePercent,
      totalHadir,
      missingResumes
    }
  }
}
