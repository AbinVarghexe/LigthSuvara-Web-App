import { Calendar, Users, School, FileText, CheckCircle2 } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { mockEvents, mockNotifications } from '../data/mockData';
import { Link } from 'react-router';

export function Dashboard() {
  const publicEvents = mockEvents.filter(e => e.status === 'Public').length;
  const draftEvents = mockEvents.filter(e => e.status === 'Draft').length;

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Events"
          value={mockEvents.length}
          icon={Calendar}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Public Events"
          value={publicEvents}
          icon={CheckCircle2}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatCard
          title="Draft Events"
          value={draftEvents}
          icon={FileText}
          iconColor="text-gray-600"
          iconBg="bg-gray-100"
        />
        <StatCard
          title="Total Users"
          value={4}
          icon={Users}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Total Schools"
          value={5}
          icon={School}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />
      </div>

      {/* Recent Events Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3>Recent Events</h3>
          <Link to="/events" className="text-[#3B82F6] hover:underline">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Title</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">School</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Category</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockEvents.slice(0, 5).map((event) => (
                <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Link to={`/events/${event.id}`} className="text-[#1E40AF] hover:underline">
                      {event.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{event.schoolName}</td>
                  <td className="py-3 px-4 text-gray-700">
                    {new Date(event.eventDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      {event.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={event.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3>Recent Notifications</h3>
          <Link to="/notifications" className="text-[#3B82F6] hover:underline">
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {mockNotifications.map((notif) => (
            <div key={notif.id} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <h4 className="text-base mb-1">{notif.title}</h4>
                <p className="text-gray-600 text-sm">{notif.body}</p>
                <p className="text-gray-500 text-xs mt-2">
                  {new Date(notif.sentTime).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
