
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { userService } from '../../services/userService';
import { facultyService } from '../../services/facultyService';
import { UpdateProfilePayload, Faculty } from '../../types';

// Restricted list of interests supported by the backend
const AVAILABLE_INTERESTS = [
  'academic', 
  'social', 
  'sports', 
  'cultural', 
  'workshop', 
  'career', 
  'volunteering'
];

interface ProfileFormState {
  firstName: string;
  lastName: string;
  phone: string;
  facultyId: string;
  bio: string;
  profileImage: string;
}

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  
  const [profileData, setProfileData] = useState<ProfileFormState>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    facultyId: user?.facultyId || '',
    bio: user?.bio || '',
    profileImage: user?.profileImage || ''
  });

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingInterests, setSavingInterests] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    loadInterests();
    loadFaculties();
    
    if (user) {
        setProfileData(prev => ({
            ...prev,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || '',
            facultyId: user.facultyId || '',
            bio: user.bio || '',
            profileImage: user.profileImage || ''
        }));
    }
  }, [user]);

  const loadFaculties = async () => {
      const res = await facultyService.getAllFaculties();
      if(res.success && res.data) setFaculties(res.data);
  };

  const loadInterests = async () => {
    setLoadingInterests(true);
    const response = await userService.getInterests();
    if (response.success && response.data) {
      const interests = response.data.interests || [];
      setSelectedInterests(interests);
    } else {
        if(response.message) console.error("Failed to load interests:", response.message);
    }
    setLoadingInterests(false);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
        setMessage({ type: 'error', text: 'Prenumele și Numele sunt obligatorii.' });
        return;
    }

    setSavingProfile(true);
    setMessage(null);

    const payload: UpdateProfilePayload = {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        facultyId: profileData.facultyId.trim() ? profileData.facultyId.trim() : undefined,
        phone: profileData.phone.trim() ? profileData.phone.trim() : undefined,
        bio: profileData.bio.trim() ? profileData.bio.trim() : undefined,
        profileImage: profileData.profileImage.trim() ? profileData.profileImage.trim() : undefined,
    };

    const result = await userService.updateProfile(payload);
    
    if (result.success && result.data) {
      setMessage({ type: 'success', text: 'Profil actualizat cu succes!' });
      updateUser(result.data);
    } else {
      setMessage({ type: 'error', text: result.message || 'Eroare la actualizare.' });
    }
    setSavingProfile(false);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSaveInterests = async () => {
    setSavingInterests(true);
    setMessage(null);
    const result = await userService.updateInterests({ interests: selectedInterests });
    if (result.success) {
      setMessage({ type: 'success', text: 'Interese actualizate cu succes!' });
    } else {
      setMessage({ type: 'error', text: result.message || 'Eroare la salvarea intereselor.' });
    }
    setSavingInterests(false);
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const getInitials = () => {
      const first = profileData.firstName?.charAt(0) || user?.firstName?.charAt(0) || '';
      const last = profileData.lastName?.charAt(0) || user?.lastName?.charAt(0) || '';
      return (first + last).toUpperCase();
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center space-x-4 mb-6">
         <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden shrink-0">
            {profileData.profileImage ? (
                <img src={profileData.profileImage} alt="Profile" className="h-full w-full object-cover" />
            ) : (
                <span>{getInitials()}</span>
            )}
         </div>
         <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 truncate">
                {profileData.firstName} {profileData.lastName}
            </h1>
            <p className="text-gray-500 font-medium capitalize">{user?.role} Account</p>
         </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} flex items-center`}>
           <span className="mr-2 text-xl">{message.type === 'success' ? '✅' : '⚠️'}</span>
           {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Details */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Detalii Personale
                </h2>
                
                <form onSubmit={handleSaveProfile}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            label="Prenume" 
                            name="firstName" 
                            value={profileData.firstName} 
                            onChange={handleProfileChange} 
                        />
                        <Input 
                            label="Nume" 
                            name="lastName" 
                            value={profileData.lastName} 
                            onChange={handleProfileChange} 
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            label="Telefon" 
                            name="phone" 
                            value={profileData.phone} 
                            onChange={handleProfileChange} 
                            placeholder="+40..."
                        />
                        
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Facultate</label>
                            <select
                                name="facultyId"
                                value={profileData.facultyId}
                                onChange={handleProfileChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="">Alege facultatea...</option>
                                {faculties.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="mb-5">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                        Despre Mine (Bio)
                      </label>
                      <textarea
                        name="bio"
                        rows={4}
                        value={profileData.bio}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 resize-none"
                        placeholder="Spune-ne câteva lucruri despre tine..."
                      />
                    </div>

                     <Input 
                            label="URL Imagine Profil" 
                            name="profileImage" 
                            value={profileData.profileImage} 
                            onChange={handleProfileChange} 
                            placeholder="https://..."
                            helperText="Link direct către o imagine (opțional)"
                        />

                    <div className="flex justify-end mt-4">
                        <Button type="submit" isLoading={savingProfile} className="w-auto px-8">
                            Salvează Modificările
                        </Button>
                    </div>
                </form>
            </div>
        </div>

        {/* Right Column: Interests */}
        <div className="lg:col-span-1">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    Interese
                </h2>
                
                <p className="text-gray-500 text-sm mb-4">
                    Selectează categoriile de evenimente care te interesează pentru a primi recomandări personalizate.
                </p>

                {loadingInterests ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_INTERESTS.map(interest => (
                                <button
                                    key={interest}
                                    onClick={() => toggleInterest(interest)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                                        selectedInterests.includes(interest)
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {capitalize(interest)}
                                </button>
                            ))}
                        </div>
                        
                        <Button 
                            onClick={handleSaveInterests} 
                            isLoading={savingInterests} 
                            variant="outline"
                            className="mt-4"
                        >
                            Actualizează Interese
                        </Button>
                    </div>
                )}
             </div>
        </div>
      </div>
    </div>
  );
};
