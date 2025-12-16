
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Event, Feedback, FeedbackStats, EventMaterial } from '../../types';
import { Button } from './Button';
import { feedbackService } from '../../services/feedbackService';
import { fileService } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  actionButton?: React.ReactNode;
}

const StarRatingDisplay = ({ rating }: { rating: number }) => {
  return (
    <div className="flex text-yellow-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`w-4 h-4 ${star <= rating ? 'fill-current' : 'text-gray-300'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
           <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ isOpen, onClose, event, actionButton }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [materials, setMaterials] = useState<EventMaterial[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', isAnonymous: false });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
       loadData(event.id);
       setNewReview({ rating: 5, comment: '', isAnonymous: false }); // Reset form
    }
  }, [isOpen, event]);

  const loadData = async (eventId: string) => {
     setLoadingReviews(true);
     setLoadingMaterials(true);
     const [reviewsRes, statsRes, materialsRes] = await Promise.all([
         feedbackService.getEventFeedback(eventId),
         feedbackService.getEventStats(eventId),
         fileService.getEventMaterials(eventId)
     ]);
     
     if (reviewsRes.success && reviewsRes.data) setReviews(reviewsRes.data);
     if (statsRes.success && statsRes.data) setStats(statsRes.data);
     if (materialsRes.success && materialsRes.data) setMaterials(materialsRes.data);
     
     setLoadingReviews(false);
     setLoadingMaterials(false);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
     e.preventDefault();
     if(!event) return;
     
     setSubmittingReview(true);
     const res = await feedbackService.createFeedback({
         eventId: event.id,
         rating: newReview.rating,
         comment: newReview.comment,
         isAnonymous: newReview.isAnonymous
     });

     if (res.success) {
         setNewReview({ rating: 5, comment: '', isAnonymous: false });
         const [reviewsRes, statsRes] = await Promise.all([
            feedbackService.getEventFeedback(event.id),
            feedbackService.getEventStats(event.id)
        ]);
        if (reviewsRes.success && reviewsRes.data) setReviews(reviewsRes.data);
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
         alert("Mulțumim pentru feedback!");
     } else {
         alert("Eroare: " + res.message);
     }
     setSubmittingReview(false);
  };

  const handleDownload = async (materialId: string) => {
      const res = await fileService.downloadMaterial(materialId);
      if (res.success && res.data?.fileUrl) {
          window.open(res.data.fileUrl, '_blank');
      } else {
          alert("Eroare la descărcare.");
      }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data nespecificată';
    return new Date(dateString).toLocaleDateString('ro-RO', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  if (!isOpen || !event) return null;

  const isEventFinished = new Date() > new Date(event.endDate);
  
  // Capacity Calculations
  const maxParticipants = event.maxParticipants || 0;
  const currentParticipants = event.currentParticipants || 0;
  const occupancyPercentage = maxParticipants > 0 ? Math.min((currentParticipants / maxParticipants) * 100, 100) : 0;
  const isFull = maxParticipants > 0 && currentParticipants >= maxParticipants;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in w-screen h-screen">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-scale-in" onClick={(e) => e.stopPropagation()}>
        
        {/* Header / Cover Image */}
        <div className="relative h-48 bg-gray-100 shrink-0">
          {event.coverImage ? (
            <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                <svg className="w-16 h-16 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
          )}
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="absolute bottom-4 left-4">
             <span className="px-3 py-1 rounded-lg text-sm font-bold bg-white/90 text-indigo-700 shadow-sm uppercase tracking-wide">
                {event.type}
             </span>
          </div>
        </div>

        {/* Content - Scrollable grid layout */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Col: Event Details + Materials */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h2>
                        
                        {/* Primary Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm">
                                <div className="text-gray-500 text-xs uppercase font-bold mb-1">Perioadă</div>
                                <div className="font-semibold text-gray-900">{formatDate(event.startDate)}</div>
                                <div className="text-gray-500 text-xs mt-1">până la {formatDate(event.endDate)}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm">
                                <div className="text-gray-500 text-xs uppercase font-bold mb-1">Locație</div>
                                <div className="font-semibold text-gray-900 flex items-center">
                                    <svg className="w-4 h-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {event.location}
                                </div>
                                {event.address && <div className="text-gray-500 text-xs mt-1">{event.address}</div>}
                            </div>
                        </div>

                        {/* Additional Info Cards if data exists */}
                        {(event.requirements || event.targetAudience) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {event.targetAudience && (
                                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-sm">
                                        <div className="text-indigo-800 text-xs uppercase font-bold mb-1">Public Țintă</div>
                                        <div className="text-indigo-900 font-medium">{event.targetAudience}</div>
                                    </div>
                                )}
                                {event.requirements && (
                                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-sm">
                                        <div className="text-orange-800 text-xs uppercase font-bold mb-1">Cerințe</div>
                                        <div className="text-orange-900 font-medium">{event.requirements}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Capacity & Deadline Section */}
                        <div className="mb-6 p-4 border border-indigo-100 rounded-xl bg-indigo-50/30">
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center text-sm uppercase tracking-wide">
                                Detalii Înscriere
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700">Locuri Ocupate</span>
                                        <span className={`font-bold ${isFull ? 'text-red-600' : 'text-indigo-600'}`}>
                                            {currentParticipants} / {maxParticipants > 0 ? maxParticipants : '∞'}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                        <div 
                                            className={`h-2.5 rounded-full ${isFull ? 'bg-red-500' : 'bg-indigo-500'}`} 
                                            style={{ width: `${occupancyPercentage}%` }}
                                        ></div>
                                    </div>
                                    {isFull && <p className="text-xs text-red-600 mt-1 font-bold">Toate locurile au fost ocupate.</p>}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-1">Deadline Înscriere</div>
                                    <div className="font-bold text-gray-900">
                                        {event.registrationDeadline 
                                            ? formatDate(event.registrationDeadline) 
                                            : 'Până la începerea evenimentului'
                                        }
                                    </div>
                                    {event.registrationDeadline && new Date() > new Date(event.registrationDeadline) && (
                                        <p className="text-xs text-red-600 mt-1 font-bold">Înscrierile s-au încheiat.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="prose max-w-none text-gray-700 leading-relaxed text-sm">
                            <h3 className="font-bold text-gray-900 text-lg mb-2">Despre Eveniment</h3>
                            {event.description.split('\n').map((paragraph, idx) => (<p key={idx} className="mb-2">{paragraph}</p>))}
                        </div>

                        {event.onlineLink && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                                <span className="font-bold text-blue-900">Link Online: </span>
                                <a href={event.onlineLink} target="_blank" rel="noreferrer" className="text-blue-600 underline">{event.onlineLink}</a>
                            </div>
                        )}
                    </div>

                    {/* Materials Section */}
                    {materials.length > 0 && (
                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Resurse & Materiale
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {materials.map(m => (
                                    <div key={m.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{m.title}</h4>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{m.description || 'Fără descriere'}</p>
                                                <span className="inline-block mt-2 px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded uppercase font-bold">{m.fileType}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleDownload(m.id)}
                                                className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
                                                title="Descarcă"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Feedback Section */}
                <div className="lg:col-span-1 border-l border-gray-100 pl-0 lg:pl-8 space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        Recenzii & Feedback
                    </h3>

                    {/* Stats */}
                    {stats && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                            <div className="text-4xl font-black text-gray-900">{(stats.averageRating || 0).toFixed(1)}</div>
                            <div className="flex justify-center my-1 text-yellow-400">
                                {[1,2,3,4,5].map(s => (
                                    <svg key={s} className={`w-4 h-4 ${s <= Math.round(stats.averageRating || 0) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                ))}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">{stats.totalReviews} recenzii</div>
                        </div>
                    )}

                    {/* Reviews List */}
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {loadingReviews ? <p className="text-sm text-gray-500 text-center">Se încarcă recenziile...</p> : 
                         reviews.length === 0 ? <p className="text-sm text-gray-400 text-center italic">Fii primul care lasă o recenzie!</p> :
                         reviews.map(rev => (
                             <div key={rev.id} className="border-b border-gray-100 pb-3 last:border-0">
                                 <div className="flex justify-between items-start mb-1">
                                     <span className="font-bold text-sm text-gray-900">{rev.isAnonymous ? 'Anonim' : (rev.user?.firstName || 'Utilizator')}</span>
                                     <StarRatingDisplay rating={rev.rating} />
                                 </div>
                                 <p className="text-sm text-gray-600 leading-snug">{rev.comment}</p>
                                 <div className="text-[10px] text-gray-400 mt-1">{new Date(rev.createdAt).toLocaleDateString('ro-RO')}</div>
                             </div>
                         ))
                        }
                    </div>

                    {/* Add Review Form */}
                    {isEventFinished ? (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-sm text-gray-900 mb-2">Lasă o recenzie</h4>
                            <form onSubmit={handleSubmitReview} className="space-y-3">
                                <div className="flex justify-center space-x-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button 
                                          type="button" 
                                          key={star} 
                                          onClick={() => setNewReview({...newReview, rating: star})}
                                          className={`text-2xl transition-transform hover:scale-110 focus:outline-none ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                        >★</button>
                                    ))}
                                </div>
                                <textarea 
                                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none resize-none bg-white text-gray-900"
                                    rows={2}
                                    placeholder="Cum a fost evenimentul?"
                                    value={newReview.comment}
                                    onChange={e => setNewReview({...newReview, comment: e.target.value})}
                                    required
                                />
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={newReview.isAnonymous} 
                                            onChange={e => setNewReview({...newReview, isAnonymous: e.target.checked})}
                                            className="rounded text-indigo-600 focus:ring-indigo-500" 
                                        />
                                        <span className="text-xs text-gray-600">Anonim</span>
                                    </label>
                                    <Button type="submit" isLoading={submittingReview} className="w-auto px-4 py-1.5 text-xs">Trimite</Button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                             <p className="text-sm text-indigo-800 font-medium">
                                 📝 Recenziile vor fi disponibile după încheierea evenimentului.
                             </p>
                        </div>
                    )}

                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
           <Button variant="secondary" onClick={onClose} className="w-auto">Închide</Button>
           {actionButton}
        </div>

      </div>
    </div>,
    document.body
  );
};
