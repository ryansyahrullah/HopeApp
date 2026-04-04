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

  // Upload Avatar
  async uploadAvatar(userId, file) {
    // Get extension dari name (File) atau default ke jpg (untuk Blob dari kompresi)
    const fileExt = file.name ? file.name.split('.').pop() : 'jpg'
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // 1. Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        contentType: `image/${fileExt === 'webp' ? 'webp' : 'jpeg'}`,
        upsert: true
      })

    if (uploadError) throw uploadError


    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return publicUrl
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
  },

  // Update anonymous status
  async updateAnonymousStatus(id, isAnonymous) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_anonymous: isAnonymous })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

