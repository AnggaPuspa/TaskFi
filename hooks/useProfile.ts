import { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { supabase } from '../utils/supabase'
import { useAuth } from '~/features/auth/AuthProvider'

export interface ProfileData {
    username: string
    website: string | null
    avatar_url: string | null
    name: string
    surname: string
    display_name: string | null
    language: string
    app_lock_enabled: boolean
}

export interface UpdateProfileResult {
    success: boolean
    error?: string
    warning?: string
}

export function useProfile() {
    const { session } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [initialized, setInitialized] = useState(false)
    const [profile, setProfile] = useState<ProfileData>({
        username: '',
        website: null,
        avatar_url: null,
        name: '',
        surname: '',
        display_name: null,
        language: 'en',
        app_lock_enabled: false
    })

    useEffect(() => {
        if (session?.user && !initialized) {
            getProfile()
        }
    }, [session?.user?.id, initialized])

    async function getProfile() {
        try {
            setLoading(true)
            if (!session?.user) throw new Error('No user on the session!')

            console.log('📊 Fetching profile for user:', session.user.id)

            // Query dengan kolom basic yang pasti ada
            const { data: basicData, error: basicError, status } = await supabase
                .from('profiles')
                .select(`username, avatar_url, currency`)
                .eq('id', session?.user.id)
                .single()

            console.log('📥 Basic query response:', { data: basicData, error: basicError, status })

            if (basicError && status !== 406) {
                throw basicError
            }

            if (basicData) {
                console.log('⚠️ Trying extended query with new columns...')
                
                // Coba query dengan kolom baru (jika migration sudah dijalankan)
                const { data: extendedData, error: extendedError } = await supabase
                    .from('profiles')
                    .select(`username, avatar_url, currency, name, surname, display_name, language, app_lock_enabled`)
                    .eq('id', session?.user.id)
                    .single()

                if (extendedError) {
                    console.log('❌ Extended query failed, using basic profile data')
                    // Fallback ke data basic
                    const basicProfile = {
                        username: basicData.username || '',
                        website: null,
                        avatar_url: basicData.avatar_url || null,
                        name: '', // Default kosong jika kolom belum ada
                        surname: '',
                        display_name: basicData.username || '',
                        language: 'en',
                        app_lock_enabled: false
                    }
                    console.log('✅ Setting basic profile state:', basicProfile)
                    setProfile(basicProfile)
                    setInitialized(true)
                } else {
                    console.log('✅ Extended query successful!')
                    const extendedProfile = {
                        username: extendedData.username || '',
                        website: null,
                        avatar_url: extendedData.avatar_url || null,
                        name: extendedData.name || '',
                        surname: extendedData.surname || '',
                        display_name: extendedData.display_name || basicData.username || '',
                        language: extendedData.language || 'en',
                        app_lock_enabled: extendedData.app_lock_enabled || false
                    }
                    console.log('✅ Setting extended profile state:', extendedProfile)
                    setProfile(extendedProfile)
                    setInitialized(true)
                }
            }
        } catch (error) {
            console.error('❌ Get profile error:', error)
            if (error instanceof Error) {
                Alert.alert('Error', error.message)
            }
        } finally {
            setLoading(false)
        }
    }

    async function updateProfile(updates: Partial<ProfileData>): Promise<UpdateProfileResult> {
        try {
            setSaving(true)
            if (!session?.user) throw new Error('No user on the session!')

            console.log('📝 Updating profile with data:', updates)

            // Filter out kolom yang mungkin belum ada di database
            const safeUpdates = {
                id: session?.user.id,
                // Kolom yang pasti ada
                username: updates.username,
                avatar_url: updates.avatar_url,
                // Kolom baru (akan di-skip jika belum ada)
                ...(updates.name !== undefined && { name: updates.name }),
                ...(updates.surname !== undefined && { surname: updates.surname }),
                ...(updates.display_name !== undefined && { display_name: updates.display_name }),
                ...(updates.language !== undefined && { language: updates.language }),
                ...(updates.app_lock_enabled !== undefined && { app_lock_enabled: updates.app_lock_enabled }),
                updated_at: new Date().toISOString(),
            }

            // Remove undefined values
            Object.keys(safeUpdates).forEach(key => {
                if (safeUpdates[key as keyof typeof safeUpdates] === undefined) {
                    delete safeUpdates[key as keyof typeof safeUpdates]
                }
            })

            console.log('📤 Sending to database:', safeUpdates)

            const { data, error } = await supabase
                .from('profiles')
                .upsert(safeUpdates)
                .select()

            if (error) {
                console.error('❌ Database error:', error)
                
                // Jika error karena kolom tidak ada, coba dengan basic fields saja
                if (error.message.includes('column') && error.message.includes('does not exist')) {
                    console.log('⚠️ Trying basic update...')
                    
                    const basicUpdates = {
                        id: session?.user.id,
                        username: updates.username,
                        avatar_url: updates.avatar_url,
                        updated_at: new Date().toISOString(),
                    }

                    // Remove undefined values
                    Object.keys(basicUpdates).forEach(key => {
                        if (basicUpdates[key as keyof typeof basicUpdates] === undefined) {
                            delete basicUpdates[key as keyof typeof basicUpdates]
                        }
                    })

                    const { data: basicData, error: basicError } = await supabase
                        .from('profiles')
                        .upsert(basicUpdates)
                        .select()

                    if (basicError) {
                        throw basicError
                    }

                    console.log('✅ Basic update successful:', basicData)
                    
                    // Update local state dengan yang berhasil
                    setProfile(prev => ({ 
                        ...prev, 
                        username: updates.username || prev.username,
                        avatar_url: updates.avatar_url || prev.avatar_url
                    }))
                    
                    return { 
                        success: true, 
                        warning: 'Beberapa field belum tersimpan karena database belum diupdate. Jalankan migration untuk save semua data.' 
                    }
                }
                
                throw error
            }

            console.log('✅ Database response:', data)

            // Update local state with the new data
            setProfile(prev => ({ ...prev, ...updates }))
            
            return { success: true }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred'
            console.error('❌ Update profile error:', message)
            return { success: false, error: message }
        } finally {
            setSaving(false)
        }
    }

    async function uploadAvatar(imageUri: string): Promise<{ success: boolean; url?: string; error?: string }> {
        try {
            if (!session?.user) throw new Error('No user on the session!')

            // Upload to Supabase Storage
            const arraybuffer = await fetch(imageUri).then((res) => res.arrayBuffer())
            const fileExt = imageUri?.split('.').pop()?.toLowerCase() ?? 'jpeg'
            const path = `${session?.user?.id}/${Date.now()}.${fileExt}`

            const { data, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(path, arraybuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                })

            if (uploadError) {
                throw uploadError
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(data.path)

            // Update profile with new avatar
            await updateProfile({ avatar_url: urlData.publicUrl })

            return { success: true, url: urlData.publicUrl }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Upload failed'
            return { success: false, error: message }
        }
    }

    function refreshProfile() {
        setInitialized(false)
        getProfile()
    }

    return {
        profile,
        setProfile,
        loading,
        saving,
        getProfile: refreshProfile,
        updateProfile,
        uploadAvatar
    }
}