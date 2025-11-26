interface StatusBadgeProps {
    status: 'Public' | 'Draft' | 'Admin' | 'School' | 'pending' | 'approved' | 'rejected';
    className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
    const styles = {
        Public: 'bg-green-100 text-green-800 border-green-200',
        Draft: 'bg-gray-100 text-gray-800 border-gray-200',
        Admin: 'bg-blue-100 text-blue-800 border-blue-200',
        School: 'bg-purple-100 text-purple-800 border-purple-200',
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        approved: 'bg-green-100 text-green-800 border-green-200',
        rejected: 'bg-red-100 text-red-800 border-red-200'
    };

    const labels = {
        Public: 'Public',
        Draft: 'Draft',
        Admin: 'Admin',
        School: 'School',
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-xs font-medium ${styles[status]} ${className}`}>
            {labels[status] || status}
        </span>
    );
}
