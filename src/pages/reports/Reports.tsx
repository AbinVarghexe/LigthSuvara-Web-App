import { useEffect, useState } from 'react';
import { FileText, Download, Calendar, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, PolarGrid, RadialBar, RadialBarChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../../components/ui/chart';
import jsPDF from 'jspdf';
import { getEvents, EventData } from '../../features/events/services/eventService';
import { getUsers, UserData } from '../../features/users/services/userService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { useAuth } from '../../context/AuthContext';

export function Reports() {
    const { isAdminUser } = useAuth();
    const [events, setEvents] = useState<EventData[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [generatingPdf, setGeneratingPdf] = useState(false);

    const [reportType, setReportType] = useState<'all' | 'year' | 'month' | 'week'>('year');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

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

    const getEventDate = (event: EventData) => {
        return event.date ? new Date((event.date as any).seconds ? (event.date as any).seconds * 1000 : event.date) : new Date();
    };

    const filteredEvents = events.filter(event => {
        if (reportType === 'all') return true;

        const eventDate = getEventDate(event);

        if (reportType === 'year') {
            return eventDate.getFullYear().toString() === selectedYear;
        }

        if (reportType === 'month') {
            return eventDate.getFullYear().toString() === selectedYear &&
                eventDate.getMonth().toString() === selectedMonth;
        }

        if (reportType === 'week' && selectedDate) {
            const targetDate = new Date(selectedDate);
            const start = new Date(targetDate);
            start.setDate(start.getDate() - start.getDay());
            start.setHours(0, 0, 0, 0);

            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            end.setHours(23, 59, 59, 999);

            return eventDate >= start && eventDate <= end;
        }

        return true;
    });

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
            const dateStr = getEventDate(event).toLocaleDateString();
            doc.text(`Date: ${dateStr}`, 20, 55);
            doc.text(`Venue: ${event.place}`, 20, 65);
            doc.text(`Category: ${event.category.toUpperCase()}`, 20, 75);
            doc.text(`Created By: ${event.creatorSchoolName}`, 20, 85);
            doc.text(`Status: ${event.isPublic ? 'Published' : 'Draft'}`, 20, 95);

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
        if (format === 'csv') {
            const headers = ['Title', 'Date', 'Category', 'School', 'Status'];
            const csvContent = [
                headers.join(','),
                ...filteredEvents.map(e => [
                    `"${e.title}"`,
                    getEventDate(e).toLocaleDateString(),
                    e.category,
                    `"${e.creatorSchoolName}"`,
                    e.isPublic ? 'Published' : 'Draft'
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `events_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            toast.success('CSV Exported successfully');
        } else if (format === 'pdf') {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text(`Events Report - ${reportType.toUpperCase()}`, 14, 20);

            let y = 40;
            doc.setFontSize(12);
            filteredEvents.forEach((e, i) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                const date = getEventDate(e).toLocaleDateString();
                const status = e.isPublic ? 'Published' : 'Draft';
                doc.text(`${i + 1}. ${e.title} (${date}) - ${e.category} - ${status}`, 14, y);
                y += 10;
            });

            doc.save(`events_report_${reportType}.pdf`);
            toast.success('PDF Exported successfully');
        }
    };

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!isAdminUser) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-red-500">Access Denied. Admin privileges required.</p>
            </div>
        );
    }

    let chartData: { name: string; events: number }[] = [];

    if (reportType === 'week') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const counts = new Array(7).fill(0);
        filteredEvents.forEach(e => {
            const d = getEventDate(e).getDay();
            counts[d]++;
        });
        chartData = days.map((day, i) => ({ name: day, events: counts[i] }));
    } else if (reportType === 'month') {
        const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0).getDate();
        const counts = new Array(daysInMonth).fill(0);
        filteredEvents.forEach(e => {
            const d = getEventDate(e).getDate() - 1;
            if (d >= 0 && d < daysInMonth) counts[d]++;
        });
        chartData = Array.from({ length: daysInMonth }, (_, i) => ({
            name: (i + 1).toString(),
            events: counts[i]
        }));
    } else if (reportType === 'year') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const counts = new Array(12).fill(0);
        filteredEvents.forEach(e => {
            const m = getEventDate(e).getMonth();
            counts[m]++;
        });
        chartData = months.map((m, i) => ({ name: m, events: counts[i] }));
    } else {
        const yearCounts: Record<string, number> = {};
        filteredEvents.forEach(e => {
            const y = getEventDate(e).getFullYear().toString();
            yearCounts[y] = (yearCounts[y] || 0) + 1;
        });
        chartData = Object.entries(yearCounts)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([year, count]) => ({ name: year, events: count }));
    }

    const categoryCount = filteredEvents.reduce((acc: Record<string, number>, event: EventData) => {
        const catLower = (event.category || '').toLowerCase();
        const cat = catLower === 'cml' ? 'CML' : 'Suvara';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryCount).map(([name, value]) => ({
        name,
        value,
    }));

    const schoolEventCount = filteredEvents.reduce((acc: Record<string, number>, event: EventData) => {
        let school = event.creatorSchoolName;
        
        // Fallback to user data if school name is missing in event
        if (!school || school === 'Unknown') {
            const creator = users.find(u => u.uid === event.creatorId || u.id === event.creatorId);
            school = creator?.schoolName || creator?.schoolname || 'Unknown School';
        }
        
        acc[school] = (acc[school] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const blueShades = [
        "hsl(217, 91%, 60%)",
        "hsl(217, 91%, 50%)",
        "hsl(217, 91%, 70%)",
        "hsl(217, 91%, 40%)",
        "hsl(217, 91%, 80%)",
    ];

    const schoolActivity = Object.entries(schoolEventCount)
        .map(([school, events], index) => ({ 
            school, 
            events, 
            fill: blueShades[index % blueShades.length] 
        }))
        .sort((a, b) => b.events - a.events)
        .slice(0, 5);

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
    const months = [
        { value: '0', label: 'January' }, { value: '1', label: 'February' }, { value: '2', label: 'March' },
        { value: '3', label: 'April' }, { value: '4', label: 'May' }, { value: '5', label: 'June' },
        { value: '6', label: 'July' }, { value: '7', label: 'August' }, { value: '8', label: 'September' },
        { value: '9', label: 'October' }, { value: '10', label: 'November' }, { value: '11', label: 'December' }
    ];

    const eventsChartConfig = {
        events: {
            label: "Events",
            color: "hsl(217, 91%, 60%)", // Blue
        },
    };

    const categoryChartConfig = {
        CML: {
            label: "CML",
            color: "hsl(217, 91%, 60%)", // Blue
        },
        Suvara: {
            label: "Suvara",
            color: "hsl(217, 91%, 75%)", // Light Blue
        },
    };

    const schoolChartConfig = {
        events: {
            label: "Events",
            color: "hsl(217, 91%, 50%)", // Darker Blue
        },
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
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
                            className="bg-blue-600 hover:bg-blue-700 px-6"
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

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <CardTitle>Analytics Dashboard</CardTitle>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <Select value={reportType} onValueChange={(v: string) => setReportType(v as 'all' | 'year' | 'month' | 'week')}>
                                <SelectTrigger className="w-[120px] h-9">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="year">Yearly</SelectItem>
                                    <SelectItem value="month">Monthly</SelectItem>
                                    <SelectItem value="week">Weekly</SelectItem>
                                </SelectContent>
                            </Select>

                            {reportType !== 'all' && (
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-[100px] h-9">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}

                            {reportType === 'month' && (
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="w-[120px] h-9">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}

                            {reportType === 'week' && (
                                <input
                                    type="date"
                                    className="h-9 px-3 py-1 rounded-md border border-input bg-background text-sm"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            )}

                            <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>

                            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                                <Download className="w-4 h-4 mr-2" />
                                Export PDF
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        <div>
                            <h4 className="mb-4 font-medium text-base">Events Over Time ({reportType === 'all' ? 'Yearly' : reportType === 'year' ? 'Monthly' : reportType === 'month' ? 'Weekly' : 'Daily'})</h4>
                            <ChartContainer config={eventsChartConfig} className="h-[300px] w-full">
                                <BarChart accessibilityLayer data={chartData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        tickFormatter={(value) => value.slice(0, 3)}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Bar dataKey="events" fill="var(--color-events)" radius={8} />
                                </BarChart>
                            </ChartContainer>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <h4 className="mb-4 font-medium text-base">Category Distribution</h4>
                                <ChartContainer 
                                    config={categoryChartConfig} 
                                    className="mx-auto aspect-square max-h-[300px] [&_.recharts-pie-label-text]:fill-foreground"
                                >
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                        <Pie
                                            data={categoryData}
                                            dataKey="value"
                                            nameKey="name"
                                            label
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={index === 0 ? "hsl(217, 91%, 60%)" : "hsl(217, 91%, 75%)"}
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>
                            </div>

                            <div>
                                <h4 className="mb-4 font-medium text-base">Most Active Schools</h4>
                                <ChartContainer 
                                    config={schoolChartConfig} 
                                    className="mx-auto aspect-square max-h-[300px]"
                                >
                                    <RadialBarChart data={schoolActivity} innerRadius={30} outerRadius={100}>
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent hideLabel nameKey="school" />}
                                        />
                                        <PolarGrid gridType="circle" />
                                        <RadialBar dataKey="events" />
                                    </RadialBarChart>
                                </ChartContainer>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-gray-200">
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-1">Total Events</p>
                            <p className="text-3xl font-semibold text-blue-600">{filteredEvents.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-1">Avg Events/Period</p>
                            <p className="text-3xl font-semibold text-blue-600">
                                {chartData.length > 0
                                    ? (filteredEvents.length / chartData.length).toFixed(1)
                                    : '0.0'}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-1">Active Schools</p>
                            <p className="text-3xl font-semibold text-blue-600">
                                {schoolActivity.length}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-1">Published Events</p>
                            <p className="text-3xl font-semibold text-green-600">
                                {filteredEvents.filter(e => e.isPublic).length}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
