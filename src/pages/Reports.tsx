import { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { mockEvents } from '../data/mockData';
import { toast } from 'sonner@2.0.3';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Reports() {
  const [selectedEvent, setSelectedEvent] = useState('');

  const handleGeneratePDF = () => {
    toast.success('Event report PDF generated successfully');
  };

  const handleExport = (format: string) => {
    toast.success(`Analytics exported as ${format.toUpperCase()}`);
  };

  // Analytics data
  const eventsOverTime = [
    { month: 'Jan', events: 3 },
    { month: 'Feb', events: 5 },
    { month: 'Mar', events: 4 },
    { month: 'Apr', events: 7 },
    { month: 'May', events: 6 },
    { month: 'Jun', events: 8 },
  ];

  const categoryData = [
    { name: 'CML', value: 2, color: '#3B82F6' },
    { name: 'Suvara', value: 1, color: '#8B5CF6' },
    { name: 'General', value: 2, color: '#10B981' },
  ];

  const schoolActivity = [
    { school: 'Greenwood', events: 2 },
    { school: 'Riverside', events: 2 },
    { school: 'Oakwood', events: 1 },
    { school: 'Sunset Valley', events: 0 },
    { school: 'Mountain View', events: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Event Report Generator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[#1E40AF]" />
          <h3>Event Report Generator</h3>
        </div>
        <p className="text-gray-600 mb-6">Generate detailed PDF reports for individual events</p>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {mockEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleGeneratePDF}
            className="bg-[#1E40AF] hover:bg-[#1E40AF]/90 px-6"
            disabled={!selectedEvent}
          >
            <Download className="w-4 h-4 mr-2" />
            Generate PDF
          </Button>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#1E40AF]" />
            <h3>Analytics Dashboard</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="space-y-8">
          {/* Events Over Time */}
          <div>
            <h4 className="mb-4">Events Over Time</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="events" fill="#1E40AF" name="Events" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Distribution */}
            <div>
              <h4 className="mb-4">Category Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Most Active Schools */}
            <div>
              <h4 className="mb-4">Most Active Schools</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={schoolActivity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="school" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="events" fill="#22C55E" name="Events Created" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Total Events</p>
            <p className="text-3xl font-semibold text-[#1E40AF]">{mockEvents.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Avg Events/Month</p>
            <p className="text-3xl font-semibold text-[#1E40AF]">
              {(eventsOverTime.reduce((sum, item) => sum + item.events, 0) / eventsOverTime.length).toFixed(1)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Active Schools</p>
            <p className="text-3xl font-semibold text-[#1E40AF]">
              {schoolActivity.filter(s => s.events > 0).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Published Events</p>
            <p className="text-3xl font-semibold text-[#22C55E]">
              {mockEvents.filter(e => e.status === 'Public').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
