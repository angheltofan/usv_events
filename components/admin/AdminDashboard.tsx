
import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { eventService } from '../../services/eventService';
import { facultyService } from '../../services/facultyService';
import { UserRole, Event, EventStatus, User, PaginationMeta, Faculty } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { EventDetailsModal } from '../ui/EventDetailsModal';

// Internal Modal for Rejection Reason
const RejectionModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: (reason: string) => void }) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in transform transition-all border border-gray-100">
                <div className="p-6 bg-white">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-red-100 p-2 rounded-full shrink-0">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Respinge Evenimentul</h3>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-6 leading-relaxed font-medium">
                        Te rugăm să menționezi motivul pentru care acest eveniment nu poate fi aprobat. 
                        <br/>Organizatorul va primi o notificare cu acest mesaj.
                    </p>
                    
                    <label className="block text-xs font-bold text-gray-800 uppercase mb-2 ml-1">Motiv Respingere</label>
                    <textarea 
                        className="w-full p-4 border border-gray-300 bg-white rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none text-sm text-gray-900 placeholder-gray-500 transition-all shadow-sm"
                        rows={5}
                        placeholder="Ex: Descrierea este incompletă, lipsește locația exactă..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        autoFocus
                    />
                </div>
                
                <div className="bg-gray-50 p-4 px-6 flex justify-end gap-3 border-t border-gray-200">
                    <button 
                        onClick={onClose} 
                        className="px-5 py-2.5 text-gray-700 font-bold hover:bg-gray-200 rounded-xl transition-colors text-sm"
                    >
                        Anulează
                    </button>
                    <button 
                        onClick={() => onConfirm(reason)} 
                        disabled={!reason.trim()}
                        className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
                    >
                        <span>Confirmă Respingerea</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'events' | 'users' | 'structure'>('events');

  // --- EVENTS STATE ---
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  // Selection States
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // Rejection State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [eventToRejectId, setEventToRejectId] = useState<string | null>(null);

  // --- USERS STATE ---
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userPagination, setUserPagination] = useState<PaginationMeta | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [targetUserId, setTargetUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ORGANIZER);
  const [roleMessage, setRoleMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // --- STRUCTURE (Faculties) STATE ---
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  // Faculty Form
  const [isFacultyEditing, setIsFacultyEditing] = useState(false);
  const [editFacultyId, setEditFacultyId] = useState<string | null>(null);
  const [facultyForm, setFacultyForm] = useState({ name: '', abbreviation: '', description: '', website: '', contactEmail: '' });
  // Department Form
  const [showDeptFormFor, setShowDeptFormFor] = useState<string | null>(null); // facultyId
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });

  useEffect(() => {
    if (activeTab === 'events') fetchPendingEvents();
    if (activeTab === 'users') fetchUsers(1, userSearch);
    if (activeTab === 'structure') fetchFaculties();
  }, [activeTab]);

  // --- USERS LOGIC ---
  useEffect(() => {
    if (activeTab === 'users') {
        const timer = setTimeout(() => {
            fetchUsers(1, userSearch);
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [userSearch]);

  const fetchUsers = async (page: number, search: string) => {
      setLoadingUsers(true);
      const result = await userService.getUsers({ page, limit: 10, search });
      if (result.success && result.data) {
          setUsers(result.data);
          setUserPagination(result.pagination);
          setCurrentPage(page);
      }
      setLoadingUsers(false);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim()) return;
    setIsUpdatingRole(true);
    setRoleMessage(null);
    const result = await userService.updateUserRole(targetUserId.trim(), selectedRole);
    if (result.success) {
      setRoleMessage({ type: 'success', text: `Rolul a fost actualizat.` });
      setTargetUserId('');
      fetchUsers(currentPage, userSearch);
    } else {
      setRoleMessage({ type: 'error', text: result.message || 'Eroare.' });
    }
    setIsUpdatingRole(false);
  };

  // --- EVENTS LOGIC ---
  const fetchPendingEvents = async () => {
    setLoadingEvents(true);
    const result = await eventService.getEvents(EventStatus.PENDING);
    if (result.success && result.data) setPendingEvents(result.data);
    setLoadingEvents(false);
  };

  const handleApprove = async (eventId: string) => {
      // Optimistic Update
      setPendingEvents(prev => prev.filter(e => e.id !== eventId));
      setIsDetailsModalOpen(false);
      
      const res = await eventService.reviewEvent(eventId, 'approved');
      if (!res.success) {
          alert("Eroare la aprobare: " + res.message);
          fetchPendingEvents(); // Revert if failed
      }
  };

  const initiateReject = (eventId: string) => {
      setEventToRejectId(eventId);
      setIsRejectModalOpen(true);
  };

  const confirmReject = async (reason: string) => {
      if (!eventToRejectId) return;

      const id = eventToRejectId;
      setEventToRejectId(null);
      setIsRejectModalOpen(false);
      setIsDetailsModalOpen(false); // Close details if open

      // Optimistic Update
      setPendingEvents(prev => prev.filter(e => e.id !== id));

      const res = await eventService.reviewEvent(id, 'rejected', reason);
      if (!res.success) {
          alert("Eroare la respingere: " + res.message);
          fetchPendingEvents(); // Revert
      }
  };

  // --- STRUCTURE LOGIC ---
  const fetchFaculties = async () => {
      setLoadingFaculties(true);
      const res = await facultyService.getAllFaculties();
      if(res.success && res.data) setFaculties(res.data);
      setLoadingFaculties(false);
  };

  const handleFacultySubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const payload = { ...facultyForm };
      
      let res;
      if(isFacultyEditing && editFacultyId) {
          res = await facultyService.updateFaculty(editFacultyId, payload);
      } else {
          res = await facultyService.createFaculty(payload);
      }

      if(res.success) {
          resetFacultyForm();
          fetchFaculties();
      } else {
          alert("Eroare: " + res.message);
      }
  };

  const handleDeleteFaculty = async (id: string) => {
      if(!confirm("Sigur ștergi această facultate?")) return;
      await facultyService.deleteFaculty(id);
      fetchFaculties();
  };

  const resetFacultyForm = () => {
      setFacultyForm({ name: '', abbreviation: '', description: '', website: '', contactEmail: '' });
      setIsFacultyEditing(false);
      setEditFacultyId(null);
  };

  const startEditFaculty = (f: Faculty) => {
      setFacultyForm({
          name: f.name,
          abbreviation: f.abbreviation,
          description: f.description || '',
          website: f.website || '',
          contactEmail: f.contactEmail || ''
      });
      setEditFacultyId(f.id);
      setIsFacultyEditing(true);
      window.scrollTo({top:0, behavior: 'smooth'});
  };

  const handleDeptSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!showDeptFormFor) return;
      
      const payload = {
          name: deptForm.name,
          description: deptForm.description,
          facultyId: showDeptFormFor
      };
      
      const res = await facultyService.createDepartment(payload);
      if(res.success) {
          setDeptForm({ name: '', description: '' });
          setShowDeptFormFor(null);
          fetchFaculties(); // Refresh to show new dept
      } else {
          alert("Eroare creare departament: " + res.message);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-gradient-to-r from-red-50 to-white border border-red-100 rounded-3xl p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-red-900 mb-2">Panou Administrator</h1>
          <p className="text-red-700/80 font-medium">Panoul de control principal al universității.</p>
      </div>

      {/* TABS - Responsive Scroll */}
      <div className="w-full overflow-x-auto pb-2">
          <div className="flex space-x-1 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit min-w-max">
              <button onClick={() => setActiveTab('events')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'events' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>Evenimente</button>
              <button onClick={() => setActiveTab('users')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'users' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>Utilizatori</button>
              <button onClick={() => setActiveTab('structure')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'structure' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>Structură</button>
          </div>
      </div>

      {/* --- CONTENT: EVENTS --- */}
      {activeTab === 'events' && (
          <div className="bg-white rounded-3xl shadow-lg shadow-gray-100 border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Validare Evenimente</h2>
                    <p className="text-gray-500 text-sm mt-1">Aprobă sau respinge evenimentele propuse de organizatori.</p>
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-full text-sm font-bold text-gray-700 whitespace-nowrap ml-4">
                    {pendingEvents.length} în așteptare
                </div>
            </div>
            
            {loadingEvents ? <p className="text-center py-12 text-gray-400 font-medium animate-pulse">Se încarcă evenimentele...</p> : pendingEvents.length === 0 ? <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200"><p className="text-gray-400 font-medium">Nu sunt evenimente de validat 🎉</p></div> : (
                <div className="flex flex-col gap-6">
                    {pendingEvents.map(event => (
                        <div key={event.id} className="group flex flex-col md:flex-row bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-300">
                            {/* Image Thumbnail */}
                            <div className="w-full md:w-56 h-40 md:h-auto bg-gray-100 shrink-0 relative overflow-hidden">
                                {event.coverImage ? (
                                    <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm uppercase tracking-wide border border-indigo-50">
                                    {event.type}
                                </div>
                            </div>
                            
                            {/* Details */}
                            <div className="p-6 flex-1 min-w-0 flex flex-col justify-center">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                                    <span className="flex items-center bg-gray-50 px-2 py-1 rounded text-gray-600"><span className="mr-1.5">📅</span> {new Date(event.startDate).toLocaleDateString('ro-RO')}</span>
                                    <span className="flex items-center bg-gray-50 px-2 py-1 rounded text-gray-600"><span className="mr-1.5">📍</span> {event.location}</span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{event.shortDescription || event.description}</p>
                            </div>

                            {/* Actions Panel - Modernized */}
                            <div className="bg-gray-50/50 p-4 flex flex-row md:flex-col justify-center items-center gap-3 border-t md:border-t-0 md:border-l border-gray-100 min-w-[100px]">
                                <button 
                                    onClick={() => handleApprove(event.id)} 
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-lg shadow-green-500/30 hover:scale-110 hover:shadow-green-500/40 transition-all duration-200"
                                    title="Aprobă Evenimentul"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                </button>
                                
                                <button 
                                    onClick={() => initiateReject(event.id)} 
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-rose-600 text-white shadow-lg shadow-red-500/30 hover:scale-110 hover:shadow-red-500/40 transition-all duration-200"
                                    title="Respinge Evenimentul"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                                
                                <button 
                                    onClick={() => { setSelectedEvent(event); setIsDetailsModalOpen(true); }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-indigo-600 shadow-sm hover:border-indigo-300 hover:text-indigo-700 hover:scale-110 transition-all duration-200"
                                    title="Vezi Detalii"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Main Event Details Modal */}
            <EventDetailsModal 
                isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} event={selectedEvent}
                actionButton={selectedEvent && (
                    <div className="flex gap-3">
                         <button 
                            onClick={() => initiateReject(selectedEvent.id)} 
                            className="px-5 py-2 rounded-xl bg-red-100 text-red-700 font-bold hover:bg-red-200 transition-colors"
                         >
                             Respinge
                         </button>
                        <button 
                            onClick={() => handleApprove(selectedEvent.id)} 
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold shadow-lg shadow-green-500/30 hover:scale-105 transition-transform"
                        >
                            Aprobă
                        </button>
                    </div>
                )}
            />

            {/* Rejection Input Modal */}
            <RejectionModal 
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onConfirm={confirmReject}
            />
          </div>
      )}

      {/* --- CONTENT: USERS --- */}
      {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Role Manager */}
              <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">Schimbă Rol</h3>
                  <form onSubmit={handleUpdateRole} className="space-y-4">
                      <Input label="ID Utilizator" value={targetUserId} onChange={e => setTargetUserId(e.target.value)} placeholder="UUID..." />
                      <div className="flex flex-col gap-2">
                          <label className="flex items-center space-x-2"><input type="radio" name="role" checked={selectedRole === UserRole.STUDENT} onChange={() => setSelectedRole(UserRole.STUDENT)} /> <span className="text-gray-900">Student</span></label>
                          <label className="flex items-center space-x-2"><input type="radio" name="role" checked={selectedRole === UserRole.ORGANIZER} onChange={() => setSelectedRole(UserRole.ORGANIZER)} /> <span className="text-gray-900">Organizator</span></label>
                      </div>
                      {roleMessage && <p className={`text-sm ${roleMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{roleMessage.text}</p>}
                      <Button type="submit" isLoading={isUpdatingRole}>Actualizează</Button>
                  </form>
              </div>

              {/* User List */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="mb-4"><Input label="Caută utilizatori" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Nume sau Email..." className="mb-0" /></div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-100 font-bold uppercase text-xs text-gray-700"><tr><th className="p-3">Nume</th><th className="p-3">Email</th><th className="p-3">Rol</th><th className="p-3">Acțiuni</th></tr></thead>
                          <tbody className="divide-y divide-gray-200">
                              {users.map(u => (
                                  <tr key={u.id} className="hover:bg-gray-50 bg-white">
                                      <td className="p-3 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                                      <td className="p-3 text-gray-900">{u.email}</td>
                                      <td className="p-3"><span className="uppercase text-xs font-bold bg-gray-100 text-gray-800 px-2 py-1 rounded border border-gray-200">{u.role}</span></td>
                                      <td className="p-3"><button onClick={() => setTargetUserId(u.id)} className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline">Selectează</button></td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                  {userPagination && (
                      <div className="flex justify-between mt-4">
                          <button disabled={!userPagination.hasPrev} onClick={() => fetchUsers(currentPage - 1, userSearch)} className="text-sm text-indigo-600 disabled:text-gray-400">Anterior</button>
                          <span className="text-sm text-gray-600">Pagina {currentPage}</span>
                          <button disabled={!userPagination.hasNext} onClick={() => fetchUsers(currentPage + 1, userSearch)} className="text-sm text-indigo-600 disabled:text-gray-400">Următor</button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- CONTENT: STRUCTURE --- */}
      {activeTab === 'structure' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Faculty */}
              <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit sticky top-24">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">{isFacultyEditing ? 'Editează Facultate' : 'Adaugă Facultate'}</h3>
                  <form onSubmit={handleFacultySubmit} className="space-y-3">
                      <Input label="Nume" value={facultyForm.name} onChange={e => setFacultyForm({...facultyForm, name: e.target.value})} required />
                      <Input label="Abreviere" value={facultyForm.abbreviation} onChange={e => setFacultyForm({...facultyForm, abbreviation: e.target.value})} required placeholder="Ex: FIESC" />
                      <Input label="Website" value={facultyForm.website} onChange={e => setFacultyForm({...facultyForm, website: e.target.value})} />
                      <Input label="Email Contact" value={facultyForm.contactEmail} onChange={e => setFacultyForm({...facultyForm, contactEmail: e.target.value})} />
                      <div>
                          <label className="text-sm font-semibold text-gray-700">Descriere</label>
                          <textarea className="w-full border rounded-lg p-2 text-sm text-gray-900" rows={3} value={facultyForm.description} onChange={e => setFacultyForm({...facultyForm, description: e.target.value})}></textarea>
                      </div>
                      <div className="flex gap-2">
                        {isFacultyEditing && <Button type="button" variant="secondary" onClick={resetFacultyForm}>Anulează</Button>}
                        <Button type="submit">{isFacultyEditing ? 'Salvează' : 'Adaugă'}</Button>
                      </div>
                  </form>
              </div>

              {/* List Faculties */}
              <div className="lg:col-span-2 space-y-4">
                  {loadingFaculties && <p>Se încarcă...</p>}
                  {faculties.map(faculty => (
                      <div key={faculty.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                          <div className="flex justify-between items-start">
                              <div>
                                  <h3 className="font-bold text-xl text-gray-900">{faculty.name} ({faculty.abbreviation})</h3>
                                  <div className="text-sm text-gray-500 flex gap-4 mt-1">
                                      {faculty.website && <a href={faculty.website} target="_blank" className="text-blue-600 hover:underline">Website</a>}
                                      {faculty.contactEmail && <span>{faculty.contactEmail}</span>}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-2">{faculty.description}</p>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => startEditFaculty(faculty)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded">Editează</button>
                                  <button onClick={() => handleDeleteFaculty(faculty.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">Șterge</button>
                              </div>
                          </div>
                          
                          {/* Departments Section */}
                          <div className="mt-6 pt-4 border-t border-gray-100">
                              <h4 className="font-bold text-sm text-gray-700 mb-2 uppercase tracking-wide">Departamente</h4>
                              <div className="space-y-2 mb-3">
                                  {faculty.departments && faculty.departments.length > 0 ? (
                                      faculty.departments.map(dept => (
                                          <div key={dept.id} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                                              <span className="font-medium text-gray-900">{dept.name}</span>
                                              {dept.description && <span className="text-gray-500">- {dept.description}</span>}
                                          </div>
                                      ))
                                  ) : (
                                      <p className="text-sm text-gray-400 italic">Niciun departament.</p>
                                  )}
                              </div>

                              {showDeptFormFor === faculty.id ? (
                                  <form onSubmit={handleDeptSubmit} className="bg-gray-50 p-3 rounded-lg border border-indigo-100 animate-fade-in">
                                      <h5 className="text-xs font-bold mb-2 text-gray-800">Adaugă Departament Nou</h5>
                                      <input className="w-full mb-2 p-2 rounded border text-sm text-gray-900" placeholder="Nume Departament" value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} required />
                                      <input className="w-full mb-2 p-2 rounded border text-sm text-gray-900" placeholder="Descriere (opțional)" value={deptForm.description} onChange={e => setDeptForm({...deptForm, description: e.target.value})} />
                                      <div className="flex gap-2">
                                          <button type="button" onClick={() => setShowDeptFormFor(null)} className="px-3 py-1 text-xs bg-gray-200 rounded text-gray-800">Anulează</button>
                                          <button type="submit" className="px-3 py-1 text-xs bg-indigo-600 text-white rounded">Adaugă</button>
                                      </div>
                                  </form>
                              ) : (
                                  <button onClick={() => { setShowDeptFormFor(faculty.id); setDeptForm({name: '', description: ''}); }} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center">
                                      + Adaugă Departament
                                  </button>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};
