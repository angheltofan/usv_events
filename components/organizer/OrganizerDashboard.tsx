
import React, { useState, useEffect, useCallback } from 'react';
import { eventService } from '../../services/eventService';
import { fileService } from '../../services/fileService';
import { facultyService } from '../../services/facultyService';
import { Event, CreateEventPayload, EventStatus, Participant, EventMaterial, Department, Faculty } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { EventDetailsModal } from '../ui/EventDetailsModal';

// Internal Confirmation Modal to replace window.confirm
const ConfirmModal = ({ isOpen, title, message, onClose, onConfirm, isLoading }: { 
    isOpen: boolean; 
    title: string; 
    message: string; 
    onClose: () => void; 
    onConfirm: () => void;
    isLoading?: boolean;
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-600">{message}</p>
                </div>
                <div className="bg-gray-50 p-4 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors">
                        Anulează
                    </button>
                    <button 
                        onClick={onConfirm} 
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Se procesează...' : 'Confirmă'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const OrganizerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-events' | 'create'>('my-events');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Data for Selects
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);

  // Create/Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Split date/time state for easier UI input
  const [dateInputs, setDateInputs] = useState({
      startDate: '', startTime: '12:00',
      endDate: '', endTime: '14:00',
      regDate: '', regTime: '23:59',
  });
  
  // General Form State
  const [formData, setFormData] = useState({
      title: '', 
      description: '', 
      shortDescription: '', 
      type: 'social',
      location: '', 
      address: '',
      isOnline: false, 
      maxParticipants: 100, 
      onlineLink: '', 
      coverImage: '',
      tags: '',
      departmentId: '',
      facultyId: '', // Fallback for manual selection
      requirements: '',
      targetAudience: ''
  });

  // Participants View State
  const [viewingParticipantsFor, setViewingParticipantsFor] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [ticketInput, setTicketInput] = useState('');
  const [checkInMsg, setCheckInMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [showCancelledParticipants, setShowCancelledParticipants] = useState(false);

  // Materials View State
  const [viewingMaterialsFor, setViewingMaterialsFor] = useState<string | null>(null);
  const [materials, setMaterials] = useState<EventMaterial[]>([]);
  const [materialForm, setMaterialForm] = useState({ title: '', description: '', fileUrl: '', fileType: 'pdf', isPublic: true });
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);

  // Preview Modal
  const [previewEvent, setPreviewEvent] = useState<Event | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // --- PERSISTENCE LOGIC ---
  // Load draft from local storage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('usv_event_draft');
    if (savedDraft) {
        try {
            const parsed = JSON.parse(savedDraft);
            // Only restore if we are not editing a specific event ID (which would be handled by openEdit)
            if (!parsed.isEditing) {
                setFormData(parsed.formData);
                setDateInputs(parsed.dateInputs);
            }
        } catch (e) {
            console.error("Failed to parse draft", e);
        }
    }
  }, []);

  // Save draft to local storage whenever form changes (if in create mode)
  useEffect(() => {
    if (!isEditing && activeTab === 'create') {
        const draft = {
            formData,
            dateInputs,
            isEditing: false,
            timestamp: Date.now()
        };
        localStorage.setItem('usv_event_draft', JSON.stringify(draft));
    }
  }, [formData, dateInputs, activeTab, isEditing]);

  // Stable fetch function
  const fetchMyEvents = useCallback(async () => {
      setIsLoading(true);
      const res = await eventService.getMyEvents();
      if(res.success && res.data) setEvents(res.data);
      setIsLoading(false);
  }, []);

  // Fetch initial data
  useEffect(() => {
      if (activeTab === 'my-events') {
          fetchMyEvents();
      }
      
      const loadFaculties = async () => {
          const res = await facultyService.getAllFaculties();
          if(res.success && res.data) {
              setFaculties(res.data);
              
              // Determine logic for departments
              // If user has facultyId, use that.
              // If manual selection (formData.facultyId), use that.
              const targetFacultyId = formData.facultyId || user?.facultyId;
              
              if(targetFacultyId) {
                  const myFaculty = res.data.find(f => f.id === targetFacultyId);
                  if(myFaculty && myFaculty.departments) {
                      setAvailableDepartments(myFaculty.departments);
                  } else {
                      setAvailableDepartments([]);
                  }
              }
          }
      };
      loadFaculties();
  }, [activeTab, fetchMyEvents, user, formData.facultyId]);

  const combineDateTime = (dateStr: string, timeStr: string) => {
      if(!dateStr) return undefined;
      const full = `${dateStr}T${timeStr || '00:00'}`;
      try {
          return new Date(full).toISOString();
      } catch(e) {
          return undefined;
      }
  };
  
  // Utility to clean payload
  const sanitize = (val: string | undefined) => (!val || val.trim() === '') ? undefined : val.trim();

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setErrorMsg(null);
      
      try {
          const isoStart = combineDateTime(dateInputs.startDate, dateInputs.startTime);
          const isoEnd = combineDateTime(dateInputs.endDate, dateInputs.endTime);
          const isoReg = combineDateTime(dateInputs.regDate, dateInputs.regTime);

          if(!isoStart || !isoEnd) {
              setErrorMsg("Te rog selectează data și ora de start/sfârșit.");
              setIsLoading(false);
              return;
          }
          
          if (new Date(isoEnd) <= new Date(isoStart)) {
              setErrorMsg("Data de sfârșit trebuie să fie după data de început.");
              setIsLoading(false);
              return;
          }

          const payload: CreateEventPayload = {
              title: formData.title.trim(),
              description: formData.description.trim(),
              shortDescription: sanitize(formData.shortDescription) || formData.description.substring(0, 150),
              type: formData.type,
              startDate: isoStart,
              endDate: isoEnd,
              registrationDeadline: isoReg || isoStart,
              location: formData.location.trim(),
              address: sanitize(formData.address),
              isOnline: formData.isOnline,
              onlineLink: (formData.isOnline && formData.onlineLink.trim()) ? formData.onlineLink.trim() : undefined,
              maxParticipants: Number(formData.maxParticipants) > 0 ? Number(formData.maxParticipants) : 100,
              coverImage: sanitize(formData.coverImage),
              tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : ['general'],
              facultyId: user?.facultyId || sanitize(formData.facultyId), 
              departmentId: sanitize(formData.departmentId),
              requirements: sanitize(formData.requirements),
              targetAudience: sanitize(formData.targetAudience),
              status: EventStatus.DRAFT, 
              rejectionReason: null 
          };

          let res;
          let successMessage = "Evenimentul a fost salvat cu succes.";

          if (isEditing && editEventId) {
              res = await eventService.updateEvent(editEventId, payload);
              if (res.success) {
                   successMessage = "Evenimentul a fost actualizat și resetat la 'Draft'.";
              }
          } else {
              res = await eventService.createEvent(payload);
          }
          
          if (res && res.success) {
              setNotification({ type: 'success', text: successMessage });
              setActiveTab('my-events');
              resetForm(); 
              localStorage.removeItem('usv_event_draft'); // Clear draft on success
              fetchMyEvents();
              setTimeout(() => setNotification(null), 5000);
          } else {
              let detailedError = res?.message || 'Eroare la salvare.';
              if (res?.errors) {
                  const errorDetails = Object.entries(res.errors)
                      .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
                      .join('; ');
                  detailedError += ` (${errorDetails})`;
              }
              setErrorMsg(detailedError);
          }
      } catch (err) {
          setErrorMsg('Eroare neașteptată.');
          console.error(err);
      }
      setIsLoading(false);
  };

  const handleDeleteClick = (id: string) => {
      setEventToDelete(id);
      setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
      if (!eventToDelete) return;
      setIsDeleting(true);
      const res = await eventService.deleteEvent(eventToDelete);
      
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setEventToDelete(null);

      if (res.success) {
          setNotification({ type: 'success', text: "Eveniment șters cu succes." });
          fetchMyEvents();
      } else {
          setNotification({ type: 'error', text: res.message || "Eroare la ștergerea evenimentului." });
      }
      
      setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmitForApproval = async (id: string) => {
      setSubmittingId(id);
      const res = await eventService.submitEvent(id);
      if(res.success) {
          fetchMyEvents();
          setNotification({ type: 'success', text: "Eveniment trimis spre validare." });
          setTimeout(() => setNotification(null), 3000);
      } else {
          setNotification({ type: 'error', text: res.message || "Eroare la trimitere. Asigură-te că evenimentul este Draft." });
      }
      setSubmittingId(null);
  };

  const splitDateTime = (isoString?: string) => {
      if(!isoString) return { date: '', time: '' };
      const d = new Date(isoString);
      const date = d.toISOString().split('T')[0];
      const time = d.toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'});
      return { date, time };
  };

  const openEdit = (event: Event) => {
      const start = splitDateTime(event.startDate);
      const end = splitDateTime(event.endDate);
      const reg = splitDateTime(event.registrationDeadline ? event.registrationDeadline : event.startDate);

      setDateInputs({
          startDate: start.date, startTime: start.time,
          endDate: end.date, endTime: end.time,
          regDate: reg.date, regTime: reg.time
      });

      setFormData({
          title: event.title,
          description: event.description,
          shortDescription: event.shortDescription || '',
          type: event.type,
          location: event.location,
          address: event.address || '',
          isOnline: event.isOnline || false,
          maxParticipants: event.maxParticipants || 100,
          onlineLink: event.onlineLink || '',
          coverImage: event.coverImage || '',
          tags: event.tags?.join(', ') || '',
          departmentId: event.departmentId || '',
          facultyId: event.facultyId || '',
          requirements: event.requirements || '',
          targetAudience: event.targetAudience || ''
      });
      setIsEditing(true);
      setEditEventId(event.id);
      setActiveTab('create');
  };

  const openPreview = (event: Event) => {
      setPreviewEvent(event);
      setIsPreviewOpen(true);
  };

  const resetForm = () => {
      setFormData({
          title: '', description: '', shortDescription: '', type: 'social',
          location: '', address: '', isOnline: false, maxParticipants: 100, onlineLink: '', coverImage: '', tags: '',
          departmentId: '', facultyId: '', requirements: '', targetAudience: ''
      });
      setDateInputs({
          startDate: '', startTime: '12:00',
          endDate: '', endTime: '14:00',
          regDate: '', regTime: '23:59',
      });
      setIsEditing(false);
      setEditEventId(null);
      setErrorMsg(null);
  };

  const handleCancelCreate = () => {
      resetForm();
      localStorage.removeItem('usv_event_draft');
      setActiveTab('my-events');
  };

  const handleViewParticipants = async (eventId: string) => {
      setViewingParticipantsFor(eventId);
      setShowCancelledParticipants(false); // Reset to hidden by default
      setLoadingParticipants(true);
      const res = await eventService.getParticipants(eventId);
      if(res.success && res.data) setParticipants(res.data);
      setLoadingParticipants(false);
  };

  const handleViewMaterials = async (eventId: string) => {
      setViewingMaterialsFor(eventId);
      const res = await fileService.getEventMaterials(eventId);
      if(res.success && res.data) setMaterials(res.data);
      setMaterialForm({ title: '', description: '', fileUrl: '', fileType: 'pdf', isPublic: true });
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!viewingMaterialsFor) return;

      setIsUploadingMaterial(true);
      const res = await fileService.uploadMaterial({
          eventId: viewingMaterialsFor,
          title: materialForm.title,
          description: materialForm.description,
          fileUrl: materialForm.fileUrl,
          fileType: materialForm.fileType,
          isPublic: materialForm.isPublic
      });

      if (res.success) {
          setMaterialForm({ title: '', description: '', fileUrl: '', fileType: 'pdf', isPublic: true });
          const mRes = await fileService.getEventMaterials(viewingMaterialsFor);
          if (mRes.success && mRes.data) setMaterials(mRes.data);
          setNotification({ type: 'success', text: "Material adăugat cu succes!" });
          setTimeout(() => setNotification(null), 3000);
      } else {
          setNotification({ type: 'error', text: res.message || "Eroare la adăugarea materialului." });
      }
      setIsUploadingMaterial(false);
  };

  const handleCheckIn = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!viewingParticipantsFor || !ticketInput) return;
      
      const res = await eventService.checkInParticipant(viewingParticipantsFor, ticketInput);
      if(res.success) {
          setCheckInMsg({type: 'success', text: 'Check-in reușit!'});
          setTicketInput('');
          // Refresh list to show check-in time
          const pRes = await eventService.getParticipants(viewingParticipantsFor);
          if(pRes.success && pRes.data) setParticipants(pRes.data);
      } else {
          setCheckInMsg({type: 'error', text: res.message || 'Eroare la check-in'});
      }
  };

  // --- RENDER HELPERS ---

  if (viewingMaterialsFor) {
      return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 animate-fade-in-up text-gray-900">
              <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold">Materiale Eveniment</h2>
                    <p className="text-xs text-gray-500 mt-1">Gestionează resursele pentru participanți.</p>
                  </div>
                  <div className="flex gap-2">
                       <button onClick={() => handleViewMaterials(viewingMaterialsFor)} className="text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 rounded hover:bg-indigo-50 text-sm">
                          Reîncarcă
                       </button>
                       <button onClick={() => setViewingMaterialsFor(null)} className="text-gray-500 hover:text-gray-700 text-sm">
                          Închide
                       </button>
                  </div>
              </div>
              
              {/* Add Material Form */}
              <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="font-bold mb-4 text-gray-800">Încarcă Material Nou</h3>
                  <form onSubmit={handleAddMaterial} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Titlu" value={materialForm.title} onChange={e => setMaterialForm({...materialForm, title: e.target.value})} required className="mb-0" />
                        <Input label="Descriere (Opțional)" value={materialForm.description} onChange={e => setMaterialForm({...materialForm, description: e.target.value})} className="mb-0" />
                      </div>
                      
                      <Input label="URL Fișier (GDrive/Dropbox link)" value={materialForm.fileUrl} onChange={e => setMaterialForm({...materialForm, fileUrl: e.target.value})} required placeholder="https://..." className="mb-0" />
                      
                      <div className="flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 w-full">
                             <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Tip Fișier</label>
                             <select 
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                value={materialForm.fileType} 
                                onChange={e => setMaterialForm({...materialForm, fileType: e.target.value})}
                             >
                                 <option value="pdf">PDF</option>
                                 <option value="slide">Prezentare (PPT)</option>
                                 <option value="image">Imagine</option>
                                 <option value="document">Document (Doc)</option>
                                 <option value="other">Altele</option>
                             </select>
                          </div>
                          <div className="pb-3">
                              <label className="flex items-center space-x-2 cursor-pointer select-none">
                                  <input type="checkbox" checked={materialForm.isPublic} onChange={e => setMaterialForm({...materialForm, isPublic: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                                  <span className="text-sm font-medium text-gray-700">Public pentru toți</span>
                              </label>
                          </div>
                          <Button type="submit" isLoading={isUploadingMaterial} className="w-full md:w-auto">Încarcă</Button>
                      </div>
                  </form>
              </div>

              {/* List */}
              <div className="space-y-3">
                  <h3 className="font-bold text-gray-800">Materiale Existente ({materials.length})</h3>
                  {materials.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          Nu există materiale încărcate pentru acest eveniment.
                      </div>
                  ) : (
                      materials.map(m => (
                          <div key={m.id} className="border border-gray-100 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center bg-white hover:shadow-sm transition-all gap-4">
                              <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-gray-900">{m.title}</h4>
                                      <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{m.fileType}</span>
                                      {!m.isPublic && <span className="text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded border border-yellow-200">Privat</span>}
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">{m.description}</p>
                                  <a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 text-xs hover:underline mt-1 block truncate max-w-md">{m.fileUrl}</a>
                              </div>
                              <div className="text-xs text-gray-400">
                                  Adăugat: {new Date(m.createdAt).toLocaleDateString('ro-RO')}
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      );
  }

  if (viewingParticipantsFor) {
      const filteredParticipants = showCancelledParticipants 
        ? participants 
        : participants.filter(p => p.status !== 'cancelled');

      return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 animate-fade-in-up text-gray-900">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h2 className="text-xl md:text-2xl font-bold">Participanți</h2>
                      <p className="text-xs text-gray-500 mt-1">Gestionează prezența și vezi lista de înscriși.</p>
                  </div>
                  <div className="flex gap-2">
                       <button onClick={() => handleViewParticipants(viewingParticipantsFor)} className="text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 rounded hover:bg-indigo-50 text-sm">
                          Reîncarcă
                       </button>
                       <button onClick={() => { setViewingParticipantsFor(null); setCheckInMsg(null); }} className="text-gray-500 hover:text-gray-700 text-sm">
                          Închide
                       </button>
                  </div>
              </div>

              <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="font-bold mb-2">Check-in Rapid</h3>
                  <form onSubmit={handleCheckIn} className="flex flex-col md:flex-row gap-2">
                      <input 
                        className="flex-1 px-3 py-2 border rounded-lg text-gray-900"
                        placeholder="Număr Bilet / Scan QR..." 
                        value={ticketInput}
                        onChange={e => setTicketInput(e.target.value)}
                        autoFocus
                      />
                      <Button type="submit" className="w-full md:w-auto px-6">Check In</Button>
                  </form>
                  {checkInMsg && (
                      <div className={`mt-2 text-sm font-bold ${checkInMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                          {checkInMsg.text}
                      </div>
                  )}
              </div>

              <div className="flex justify-between items-center mb-2 px-1">
                  <div className="text-sm font-bold text-gray-700">
                      Total: {filteredParticipants.length}
                  </div>
                  <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      <input 
                        type="checkbox" 
                        checked={showCancelledParticipants} 
                        onChange={e => setShowCancelledParticipants(e.target.checked)} 
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Arată și anulările</span>
                  </label>
              </div>

              <div className="overflow-x-auto">
                  {loadingParticipants ? <p className="text-center p-4">Se încarcă lista...</p> : (
                  <table className="w-full text-left text-sm text-gray-800">
                      <thead className="bg-gray-100 text-gray-900 uppercase font-bold text-xs">
                          <tr>
                              <th className="px-4 py-3 rounded-l-lg">User ID / Nume</th>
                              <th className="px-4 py-3">Bilet</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3 rounded-r-lg">Check-in Time</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {filteredParticipants.length === 0 ? (
                              <tr><td colSpan={4} className="p-4 text-center text-gray-500">Niciun participant activ.</td></tr>
                          ) : (
                              filteredParticipants.map(p => (
                                  <tr key={p.id} className={`hover:bg-gray-50 ${p.status === 'cancelled' ? 'bg-red-50/50 opacity-70' : ''}`}>
                                      <td className="px-4 py-3 font-medium">
                                          {p.user?.email || p.userId}
                                      </td>
                                      <td className="px-4 py-3 font-mono text-indigo-600">
                                          {p.ticketNumber}
                                      </td>
                                      <td className="px-4 py-3">
                                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                              p.status === 'attended' ? 'bg-green-100 text-green-700' :
                                              p.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                              p.status === 'cancelled' ? 'bg-red-100 text-red-700 line-through' :
                                              'bg-gray-100 text-gray-600'
                                          }`}>
                                              {p.status}
                                          </span>
                                      </td>
                                      <td className="px-4 py-3">{p.checkedInAt ? new Date(p.checkedInAt).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
        {notification && (
            <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                <div className="flex items-center">
                    <span className="mr-2 text-xl">{notification.type === 'success' ? '✅' : '⚠️'}</span>
                    <span className="font-medium text-sm md:text-base">{notification.text}</span>
                </div>
                <button onClick={() => setNotification(null)} className="text-sm font-bold opacity-60 hover:opacity-100">✕</button>
            </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Panou Organizator</h1>
            <div className="flex space-x-2 w-full md:w-auto">
                <button 
                    onClick={() => { setActiveTab('my-events'); }}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-medium transition text-center ${activeTab === 'my-events' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    Evenimentele Mele
                </button>
                <button 
                    onClick={() => { setActiveTab('create'); }}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-medium transition text-center ${activeTab === 'create' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    Creează Eveniment
                </button>
            </div>
        </div>

        {activeTab === 'my-events' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? <p className="col-span-3 text-center py-8">Se încarcă...</p> : 
                 events.length === 0 ? <div className="col-span-3 text-center py-12 text-gray-500">Nu ai creat niciun eveniment.</div> :
                 events.map(event => (
                    <div key={event.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full group transition-all hover:shadow-md">
                        <div className="h-32 bg-gray-100 relative shrink-0">
                             {event.coverImage && <img src={event.coverImage} className="w-full h-full object-cover" alt="cover" />}
                             <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold uppercase shadow-sm ${
                                 event.status === EventStatus.APPROVED ? 'bg-green-100 text-green-700' :
                                 event.status === EventStatus.REJECTED ? 'bg-red-100 text-red-700' :
                                 event.status === EventStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
                                 'bg-gray-200 text-gray-700'
                             }`}>
                                 {event.status}
                             </div>
                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <button onClick={() => openPreview(event)} className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100">
                                     Vezi Preview
                                 </button>
                             </div>
                        </div>
                        
                        <div className="p-4 flex-1 flex flex-col">
                            <div>
                                <h3 className="font-bold text-lg mb-1 text-gray-900 line-clamp-1" title={event.title}>{event.title}</h3>
                                <p className="text-sm text-gray-500 mb-2">{new Date(event.startDate).toLocaleDateString('en-GB')}</p>
                                
                                {event.status === EventStatus.REJECTED && event.rejectionReason && (
                                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2">Motiv: {event.rejectionReason}</p>
                                )}
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap gap-2 justify-between items-center">
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => openEdit(event)} className="px-3 py-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold">Editează</button>
                                    <button onClick={() => handleViewParticipants(event.id)} className="px-3 py-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 text-xs font-bold">Participanți</button>
                                    <button onClick={() => handleViewMaterials(event.id)} className="px-3 py-1.5 rounded-lg text-purple-600 bg-purple-50 hover:bg-purple-100 text-xs font-bold" title="Gestionează Materiale">Materiale</button>
                                </div>
                                
                                <div className="flex gap-2">
                                     {/* Allow sending if Draft OR Rejected */}
                                     {(event.status === EventStatus.DRAFT || event.status === EventStatus.REJECTED) && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleSubmitForApproval(event.id); }} 
                                            disabled={submittingId === event.id}
                                            className="px-3 py-1.5 rounded-lg text-green-600 bg-green-50 hover:bg-green-100 text-xs font-bold disabled:opacity-50"
                                        >
                                            {submittingId === event.id ? 'Se trimite...' : 'Trimite'}
                                        </button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(event.id); }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 text-xs" title="Șterge">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                 ))}
            </div>
        ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Editează Eveniment' : 'Eveniment Nou'}</h2>
                     <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                         {isEditing ? 'Modificare directă' : 'Ciornă salvată automat'}
                     </span>
                </div>
                
                {errorMsg && (
                    <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg text-sm font-medium border border-red-200">
                        Eroare: {errorMsg}
                    </div>
                )}

                <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                    <Input label="Titlu" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="Titlul evenimentului" />
                    
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Descriere Scurtă</label>
                        <Input 
                            label="" 
                            value={formData.shortDescription} 
                            onChange={e => setFormData({...formData, shortDescription: e.target.value})} 
                            placeholder="Rezumat (max 200 caractere)" 
                        />
                    </div>

                    {/* Split Date Inputs with colorScheme fixed for visibility */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Începe</label>
                             <div className="flex gap-2">
                                <input 
                                    type="date" 
                                    required 
                                    className="w-full p-2 rounded border border-gray-300 bg-white text-gray-900" 
                                    style={{ colorScheme: 'light' }}
                                    value={dateInputs.startDate} 
                                    onChange={e => setDateInputs({...dateInputs, startDate: e.target.value})} 
                                />
                                <input 
                                    type="time" 
                                    required 
                                    className="w-24 p-2 rounded border border-gray-300 bg-white text-gray-900" 
                                    style={{ colorScheme: 'light' }}
                                    value={dateInputs.startTime} 
                                    onChange={e => setDateInputs({...dateInputs, startTime: e.target.value})} 
                                />
                             </div>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Se termină</label>
                             <div className="flex gap-2">
                                <input 
                                    type="date" 
                                    required 
                                    className="w-full p-2 rounded border border-gray-300 bg-white text-gray-900" 
                                    style={{ colorScheme: 'light' }}
                                    value={dateInputs.endDate} 
                                    onChange={e => setDateInputs({...dateInputs, endDate: e.target.value})} 
                                />
                                <input 
                                    type="time" 
                                    required 
                                    className="w-24 p-2 rounded border border-gray-300 bg-white text-gray-900" 
                                    style={{ colorScheme: 'light' }}
                                    value={dateInputs.endTime} 
                                    onChange={e => setDateInputs({...dateInputs, endTime: e.target.value})} 
                                />
                             </div>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Deadline Înscriere (Opțional)</label>
                             <div className="flex gap-2">
                                <input 
                                    type="date" 
                                    className="w-full p-2 rounded border border-gray-300 bg-white text-gray-900" 
                                    style={{ colorScheme: 'light' }}
                                    value={dateInputs.regDate} 
                                    onChange={e => setDateInputs({...dateInputs, regDate: e.target.value})} 
                                />
                                <input 
                                    type="time" 
                                    className="w-24 p-2 rounded border border-gray-300 bg-white text-gray-900" 
                                    style={{ colorScheme: 'light' }}
                                    value={dateInputs.regTime} 
                                    onChange={e => setDateInputs({...dateInputs, regTime: e.target.value})} 
                                />
                             </div>
                        </div>
                        <div className="pt-6">
                            <Input label="Max Participanți" type="number" value={formData.maxParticipants} onChange={e => setFormData({...formData, maxParticipants: Number(e.target.value)})} min={1} className="mb-0" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Locație (Clădire/Sală)" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required placeholder="Ex: Corp C, Sala 101" />
                        <Input label="Adresă Detaliată" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Strada Universității nr. 13" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Tip Eveniment</label>
                            <select 
                                value={formData.type} 
                                onChange={e => setFormData({...formData, type: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="social">Social</option>
                                <option value="academic">Academic</option>
                                <option value="career">Carieră</option>
                                <option value="sports">Sport</option>
                                <option value="workshop">Workshop</option>
                                <option value="cultural">Cultural</option>
                                <option value="other">Altele</option>
                            </select>
                        </div>
                        
                        <div className="space-y-4">
                             {/* Faculty Selector (Fallback if user has none) */}
                             {!user?.facultyId && (
                                <div className="mb-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Facultate <span className="text-red-500">*</span></label>
                                    <select 
                                        value={formData.facultyId} 
                                        onChange={e => setFormData({...formData, facultyId: e.target.value, departmentId: ''})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    >
                                        <option value="">Selectează Facultate</option>
                                        {faculties.map(fac => (
                                            <option key={fac.id} value={fac.id}>{fac.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-orange-600 mt-1">Nu ai o facultate setată în profil. Selectează una pentru acest eveniment.</p>
                                </div>
                             )}

                             {/* Department Selector */}
                             {availableDepartments.length > 0 && (
                                <div className="mb-5">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Departament (Opțional)</label>
                                    <select 
                                        value={formData.departmentId} 
                                        onChange={e => setFormData({...formData, departmentId: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    >
                                        <option value="">Selectează Departament</option>
                                        {availableDepartments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                             )}
                        </div>
                    </div>

                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Public Țintă</label>
                        <Input 
                            label="" 
                            value={formData.targetAudience} 
                            onChange={e => setFormData({...formData, targetAudience: e.target.value})} 
                            placeholder="Ex: Studenți anul I, Profesori" 
                        />
                    </div>

                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Descriere Completă</label>
                        <textarea 
                            rows={6}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            required
                            placeholder="Descrierea detaliată a evenimentului... Suportă text simplu."
                        />
                    </div>

                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Cerințe Participare</label>
                        <textarea 
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            value={formData.requirements}
                            onChange={e => setFormData({...formData, requirements: e.target.value})}
                            placeholder="Ex: Laptop necesar, legitimație student..."
                        />
                    </div>
                    
                    <Input label="Imagine Cover (URL)" value={formData.coverImage} onChange={e => setFormData({...formData, coverImage: e.target.value})} placeholder="https://..." />
                    
                    <Input label="Tag-uri" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="IT, Party, Workshop (separate prin virgulă)" />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={handleCancelCreate} className="w-auto">Anulează</Button>
                        <Button type="submit" isLoading={isLoading} className="w-auto">{isEditing ? 'Actualizează' : 'Creează'}</Button>
                    </div>
                </form>
            </div>
        )}

        <EventDetailsModal 
           isOpen={isPreviewOpen}
           onClose={() => setIsPreviewOpen(false)}
           event={previewEvent}
        />
        
        <ConfirmModal 
            isOpen={deleteModalOpen}
            title="Șterge Eveniment"
            message={eventToDelete && events.find(e => e.id === eventToDelete)?.currentParticipants ? 
                `Atenție: Există ${events.find(e => e.id === eventToDelete)?.currentParticipants} participanți înscriși. Ștergerea este posibil să nu fie permisă de sistem.` : 
                "Ești sigur că vrei să ștergi acest eveniment? Această acțiune este ireversibilă."}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={confirmDelete}
            isLoading={isDeleting}
        />
    </div>
  );
};
