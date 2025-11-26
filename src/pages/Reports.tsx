import { useEffect, useState } from 'react';
import { FileText, Download, Calendar, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import { getEvents, EventData } from '../services/eventService';
import { getUsers, UserData } from '../services/userService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

export function Reports() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, usersData] = await Promise.all([
          getEvents(),
          getUsers()
        ]);
        setEvents(eventsData as EventData[]);
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleGeneratePDF = async () => {
    const event = events.find(e => e.id === selectedEventId);
    if (!event) return;

    setGeneratingPdf(true);
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text('Light Suvara Event Report', 20, 20);

      doc.setFontSize(16);
      doc.text(event.title, 20, 40);

      doc.setFontSize(12);
      const dateStr = event.date ? new Date((event.date as any).seconds ? (event.date as any).seconds * 1000 : event.date).toLocaleDateString() : 'N/A';
      doc.text(`Date: ${dateStr}`, 20, 55);
      doc.text(`Venue: ${event.place}`, 20, 65);
      doc.text(`Category: ${event.category.toUpperCase()}`, 20, 75);
      doc.text(`Created By: ${event.creatorSchoolName}`, 20, 85);
      doc.text(`Status: ${event.isPublic ? 'Published' : 'Draft'}`, 20, 95);

      // Add description with text wrapping
      const splitDescription = doc.splitTextToSize(event.description, 170);
      doc.text(splitDescription, 20, 110);

      doc.save(`${event.title.replace(/\s+/g, '-').toLowerCase()}-report.pdf`);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleExport = (format: string) => {
    toast.info(`Export as ${format.toUpperCase()} coming soon!`);
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Process data for charts
  const eventsByMonth = events.reduce((acc, event) => {
    const date = event.date ? new Date((event.date as any).seconds ? (event.date as any).seconds * 1000 : event.date) : new Date();
    const month = date.toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const eventsOverTime = Object.entries(eventsByMonth).map(([month, count]) => ({
    month,
    events: count
  }));

  const categoryCount = events.reduce((acc, event) => {
    const cat = event.category === 'cml' ? 'CML' : 'Suvara';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryCount).map(([name, value], index) => ({
    name,
    value,
    color: index === 0 ? '#3B82F6' : '#8B5CF6'
  }));

  const schoolEventCount = events.reduce((acc, event) => {
    const school = event.creatorSchoolName || 'Unknown';
    acc[school] = (acc[school] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const schoolActivity = Object.entries(schoolEventCount)
    .map(([school, count]) => ({ school, events: count }))
    .sort((a, b) => b.events - a.events)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Event Report Generator */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1E40AF]" />
            <CardTitle>Event Report Generator</CardTitle>
          </div>
          <CardDescription>Generate detailed PDF reports for individual events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id || ''}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGeneratePDF}
              className="bg-[#1E40AF] hover:bg-[#1E40AF]/90 px-6"
              disabled={!selectedEventId || generatingPdf}
            >
              {generatingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#1E40AF]" />
              <CardTitle>Analytics Dashboard</CardTitle>
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
        </CardHeader>
        <CardContent>
          {/* Charts Grid */}
          <div className="space-y-8">
            {/* Events Over Time */}
            <div>
              <h4 className="mb-4 font-medium">Events Over Time</h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="events" fill="#1E40AF" name="Events" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Category Distribution */}
              <div>
                <h4 className="mb-4 font-medium">Category Distribution</h4>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
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
              </div>

              {/* Most Active Schools */}
              <div>
                <h4 className="mb-4 font-medium">Most Active Schools</h4>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={schoolActivity} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="school" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="events" fill="#22C55E" name="Events Created" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">Total Events</p>
              <p className="text-3xl font-semibold text-[#1E40AF]">{events.length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">Avg Events/Month</p>
              <p className="text-3xl font-semibold text-[#1E40AF]">
                {eventsOverTime.length > 0
                  ? (events.length / eventsOverTime.length).toFixed(1)
                  : '0.0'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">Active Schools</p>
              <p className="text-3xl font-semibold text-[#1E40AF]">
                {schoolActivity.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">Published Events</p>
              <p className="text-3xl font-semibold text-[#22C55E]">
                {events.filter(e => e.isPublic).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
