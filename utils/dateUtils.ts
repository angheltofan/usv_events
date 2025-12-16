
export const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Data nespecificată';
    try {
        return new Date(dateString).toLocaleDateString('ro-RO', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit'
        });
    } catch(e) {
        return 'Dată invalidă';
    }
};

export const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Acum câteva secunde';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min în urmă`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ore în urmă`;
    return date.toLocaleDateString('ro-RO');
};
