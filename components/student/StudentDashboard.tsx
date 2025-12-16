
import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import { Event, EventStatus } from '../../types';
import { EventDetailsModal } from '../ui/EventDetailsModal';

type Tab = 'all' | 'registered' | 'favorites';

// Internal Confirmation Modal
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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-600">{message}</p>
                </div>
                <div className="bg-gray-50 p-4 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors">
                        Nu, păstrează
                    </button>
                    <button 
                        onClick={onConfirm} 
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Se procesează...' : 'Da, anulează'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Modal State
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Confirmation Modal State
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [eventToCancel, setEventToCancel] = useState<Event | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
        let data: Event[] = [];
        
        // 1. Fetch Events based on tab
        if (activeTab === 'all') {
            const res = await eventService.getEvents(EventStatus.APPROVED);
            if (res.success && res.data) data = res.data;
        } 
        else if (activeTab === 'registered') {
            const res = await eventService.getMyRegistrations();
            if (res.success && res.data) {
                // Filter out cancelled events from the view
                const activeRegs = res.data.filter((item: any) => item.status !== 'cancelled');
                data = activeRegs.map((item: any) => item.event || item).filter((e: any) => !!e.id) as Event[]; 
            }
        } 
        else if (activeTab === 'favorites') {
            const res = await eventService.getFavorites();
            if (res.success && res.data) {
                data = res.data.map((item: any) => item.event || item).filter((e: any) => !!e.id) as Event[];
            }
        }
        setEvents(data);

        // 2. Sync Registration & Favorite Status (Always fetch fresh state to prevent stale UI)
        // We do this concurrently
        const [regRes, favRes] = await Promise.all([
            eventService.getMyRegistrations(),
            eventService.getFavorites()
        ]);

        if (regRes.success && regRes.data) {
             const activeRegistrations = regRes.data.filter((r: any) => r.status !== 'cancelled');
             const ids = activeRegistrations.map((r: any) => (r.event?.id || r.eventId || r.id));
             setRegisteredIds(new Set(ids));
        }
        if (favRes.success && favRes.data) {
            const ids = favRes.data.map((r: any) => (r.event?.id || r.id));
            setFavoriteIds(new Set(ids));
        }

    } catch (e) {
        console.error("Failed to fetch dashboard data", e);
        setErrorMsg("Nu s-au putut încărca datele. Verifică conexiunea.");
    }
    setIsLoading(false);
  };

  const handleActionClick = (event: Event) => {
      const isRegistered = registeredIds.has(event.id);
      if (isRegistered) {
          setEventToCancel(event);
          setConfirmCancelOpen(true);
      } else {
          processRegistration(event, false);
      }
  };

  const confirmCancellation = () => {
      if (eventToCancel) {
          processRegistration(eventToCancel, true);
      }
  };

  const processRegistration = async (event: Event, isCancellation: boolean) => {
      setProcessingId(event.id);
      setErrorMsg(null);
      
      let res;
      if (isCancellation) {
          res = await eventService.cancelRegistration(event.id);
      } else {
          res = await eventService.registerEvent(event.id);
      }

      // Check for specific edge case where backend says "already cancelled"
      // If so, we treat it as a success for the purpose of UI consistency (the user is not registered).
      const isAlreadyCancelledError = isCancellation && res.message && (
          res.message.toLowerCase().includes('already cancelled') || 
          res.message.toLowerCase().includes('not registered')
      );

      if (res.success || isAlreadyCancelledError) {
          // 1. Update Registration Set ID immediately
          setRegisteredIds(prev => {
              const newSet = new Set([...prev]);
              if (isCancellation) {
                  newSet.delete(event.id);
              } else {
                  newSet.add(event.id);
              }
              return newSet;
          });
          
          // 2. Update Event Participant Counts in Local State (Optimistic UI)
          const participantChange = isCancellation ? -1 : 1;
          
          setEvents(prevEvents => prevEvents.map(e => {
              if (e.id === event.id) {
                  const newCount = Math.max(0, e.currentParticipants + participantChange);
                  return { ...e, currentParticipants: newCount };
              }
              return e;
          }));

          // 3. Update Selected Event if Modal is Open
          if (selectedEvent && selectedEvent.id === event.id) {
              setSelectedEvent(prev => prev ? ({
                  ...prev,
                  currentParticipants: Math.max(0, prev.currentParticipants + participantChange)
              }) : null);
          }

          // 4. Handle Tab Specific Logic
          if (activeTab === 'registered' && isCancellation) {
              setEvents(prev => prev.filter(e => e.id !== event.id));
              if(selectedEvent?.id === event.id) setIsModalOpen(false);
          }

      } else {
          // Show error clearly
          const msg = res.message || "Acțiune eșuată. Reîncearcă.";
          setErrorMsg(msg);
          // Auto-hide error after 5s
          setTimeout(() => setErrorMsg(null), 5000);
      }
      
      setProcessingId(null);
      setConfirmCancelOpen(false);
      setEventToCancel(null);
  };

  const handleFavorite = async (event: Event) => {
      const isFav = favoriteIds.has(event.id);
      const newSet = new Set(favoriteIds);
      if (isFav) newSet.delete(event.id);
      else newSet.add(event.id);
      setFavoriteIds(newSet);

      if (activeTab === 'favorites' && isFav) {
          setEvents(prev => prev.filter(e => e.id !== event.id));
      }

      await eventService.toggleFavorite(event.id, isFav);
  };

  const openDetails = (event: Event) => {
      const freshEvent = events.find(e => e.id === event.id) || event;
      setSelectedEvent(freshEvent);
      setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    if(!dateString) return '';
    try {
        return new Date(dateString).toLocaleDateString('ro-RO', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit'
        });
    } catch(e) {
        return 'Invalid Date';
    }
  };

  const renderModalAction = () => {
      if (!selectedEvent) return null;
      const isRegistered = registeredIds.has(selectedEvent.id);
      const isProcessing = processingId === selectedEvent.id;
      
      const max = selectedEvent.maxParticipants || 0;
      const current = selectedEvent.currentParticipants || 0;
      const isFull = max > 0 && current >= max;

      return (
          <button 
             onClick={() => handleActionClick(selectedEvent)}
             disabled={isProcessing || (!isRegistered && isFull)}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${
                 isRegistered 
                 ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                 : isFull 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
             } ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
           >
               {isProcessing ? 'Se procesează...' : (isRegistered ? 'Anulează Înscrierea' : isFull ? 'Locuri Epuizate' : 'Participă la Eveniment')}
           </button>
      );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
       <div className="bg-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
           <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500 opacity-20 rounded-full blur-3xl"></div>
           
           <h1 className="text-2xl md:text-3xl font-bold mb-2 relative z-10">Descoperă Evenimente</h1>
           <p className="text-indigo-100 relative z-10 max-w-xl text-sm md:text-base">
               Explorează activitățile din campus, workshop-uri, petreceri și oportunități de carieră.
           </p>
       </div>

       {errorMsg && (
           <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex justify-between items-center shadow-sm">
               <span>⚠️ {errorMsg}</span>
               <button onClick={() => setErrorMsg(null)} className="font-bold">✕</button>
           </div>
       )}

       {/* Responsive Tabs Container */}
       <div className="w-full overflow-x-auto pb-2">
           <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 min-w-max">
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                  Toate Evenimentele
              </button>
              <button 
                onClick={() => setActiveTab('registered')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'registered' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                  Înscrierile Mele
              </button>
              <button 
                onClick={() => setActiveTab('favorites')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'favorites' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                  Favorite
              </button>
           </div>
       </div>

       {isLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[1,2,3].map(i => (
                   <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100"></div>
               ))}
           </div>
       ) : events.length === 0 ? (
           <div className="text-center py-12">
               <div className="text-6xl mb-4">📅</div>
               <h3 className="text-xl font-bold text-gray-900">Nu s-au găsit evenimente</h3>
               <p className="text-gray-500">
                   {activeTab === 'all' ? 'Revin-o mai târziu pentru noutăți!' : 
                    activeTab === 'favorites' ? 'Nu ai adăugat niciun eveniment la favorite.' : 
                    'Nu ești înscris la niciun eveniment.'}
               </p>
           </div>
       ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {events.map(event => {
                   const isRegistered = registeredIds.has(event.id);
                   const isFavorite = favoriteIds.has(event.id);
                   const isProcessing = processingId === event.id;
                   
                   const max = event.maxParticipants || 0;
                   const current = event.currentParticipants || 0;
                   const isFull = max > 0 && current >= max;

                   return (
                   <div 
                        key={event.id} 
                        onClick={() => openDetails(event)}
                        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full relative group cursor-pointer"
                   >
                       <div className="h-40 bg-gray-100 relative overflow-hidden shrink-0">
                           {event.coverImage ? (
                               <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-200">
                                   <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                               </div>
                           )}
                           <div className="absolute top-3 right-3 flex gap-2">
                                <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-indigo-600 shadow-sm uppercase tracking-wide">
                                    {event.type}
                                </div>
                           </div>
                           <button 
                                onClick={(e) => { e.stopPropagation(); handleFavorite(event); }}
                                className={`absolute top-3 left-3 p-1.5 rounded-full shadow-sm backdrop-blur-sm transition-colors z-20 ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-400 hover:text-red-500'}`}
                           >
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                 <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                               </svg>
                           </button>
                       </div>
                       
                       <div className="p-5 flex-1 flex flex-col">
                           <div className="flex justify-between items-start mb-2">
                                <div className="text-xs font-semibold text-indigo-600 flex items-center">
                                   <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                   {formatDate(event.startDate)}
                               </div>
                               {event.targetAudience && (
                                   <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 max-w-[40%] truncate">
                                       {event.targetAudience}
                                   </span>
                               )}
                           </div>
                           
                           <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                               {event.title}
                           </h3>
                           
                           <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">
                               {event.shortDescription || event.description}
                           </p>

                           {/* Capacity Indicator in Card */}
                           <div className="mb-4 text-xs">
                               <div className="flex justify-between mb-1 text-gray-500">
                                    <span>Locuri disponibile</span>
                                    <span className={isFull ? 'text-red-600 font-bold' : ''}>{current} / {max || '∞'}</span>
                               </div>
                               <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                   <div 
                                        className={`h-1.5 rounded-full ${isFull ? 'bg-red-500' : 'bg-indigo-400'}`} 
                                        style={{ width: `${Math.min((current / (max || 1)) * 100, 100)}%` }}
                                   ></div>
                               </div>
                           </div>
                           
                           <div className="pt-4 border-t border-gray-100 flex flex-wrap justify-between items-center mt-auto gap-3">
                               <div className="flex items-center text-gray-500 text-sm overflow-hidden flex-1 min-w-0">
                                   <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                   <span className="truncate">{event.location}</span>
                               </div>
                               
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleActionClick(event); }}
                                 disabled={isProcessing || (!isRegistered && isFull)}
                                 className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 relative z-20 ${
                                     isRegistered 
                                     ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200' 
                                     : isFull
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                 } ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                               >
                                   {isProcessing ? '...' : (isRegistered ? 'Înscris' : isFull ? 'Plin' : 'Participă')}
                               </button>
                           </div>
                       </div>
                   </div>
                   );
               })}
           </div>
       )}

       <EventDetailsModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         event={selectedEvent} 
         actionButton={renderModalAction()}
       />
       
       <ConfirmModal 
           isOpen={confirmCancelOpen}
           title="Anulare Înscriere"
           message="Ești sigur că vrei să anulezi înregistrarea la acest eveniment? Locul tău va fi eliberat."
           onClose={() => setConfirmCancelOpen(false)}
           onConfirm={confirmCancellation}
           isLoading={!!processingId}
       />
    </div>
  );
};
