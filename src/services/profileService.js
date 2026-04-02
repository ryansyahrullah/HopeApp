import { supabase } from '@/lib/supabase'

export const profileService = {
  // Get all profiles
  async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')

    if (error) throw error
    return data || []
  },

  // Get all students (mahasiswa role)
  async getAllStudents() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .contains('roles', ['mahasiswa'])
      .order('full_name')

    if (error) throw error
    return data || []
  },

  // Get single profile by ID
  async getProfileById(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Update profile
  async updateProfile(id, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete profile (admin only — cascades to auth.users)
  async deleteProfile(id) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  },

  // Get registration toggle value
  async getRegistrationSetting() {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'is_registration_open')
      .single()

    if (error) return true // default open
    return data?.value === 'true'
  },

  // Update registration toggle (admin only)
  async setRegistrationSetting(isOpen) {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'is_registration_open',
        value: isOpen ? 'true' : 'false'
      })

    if (error) throw error
    return true
  }
}
