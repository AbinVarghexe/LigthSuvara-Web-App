import { useEffect, useState, useMemo } from 'react';
import { FileText, Download, Calendar, Loader2, TrendingUp, Filter } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, PolarGrid, RadialBar, RadialBarChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../../components/ui/chart';
import jsPDF from 'jspdf';
import { createMalayalamPDF } from '../../lib/pdfFonts';
import { getEvents, EventData } from '../../features/events/services/eventService';
import { getUsers, UserData } from '../../features/users/services/userService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
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

    // Entity filters
    const [foraneFilter, setForaneFilter] = useState('All');
    const [schoolFilter, setSchoolFilter] = useState('All');
    const [roleFilter, setRoleFilter] = useState('All');

    const foraneNames = [
        'Mundakayam', 'Kumily', 'Kanjirappally', 'Anakkara', 'Erumely',
        'Ponkunnam', 'Kattappana', 'Upputhara', 'Ranny', 'Pathanamthitta',
        'Velichiyani', 'Mundiyeruma', 'Peruvanthanam',
    ];

    // Derive unique school names from users
    const schoolNames = useMemo(() => {
        const names = new Set<string>();
        users.forEach(u => {
            const name = u.schoolName || u.schoolname;
            if (name) names.add(name);
        });
        return Array.from(names).sort();
    }, [users]);

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
        // Forane filter
        if (foraneFilter !== 'All') {
            if (event.creatorForane !== foraneFilter) return false;
        }

        // School / Parish name filter
        if (schoolFilter !== 'All') {
            const creator = users.find(u => u.uid === event.creatorId || u.id === event.creatorId);
            const eventSchool = event.creatorSchoolName || creator?.schoolName || creator?.schoolname || '';
            if (eventSchool !== schoolFilter) return false;
        }

        // Role filter
        if (roleFilter !== 'All') {
            const creator = users.find(u => u.uid === event.creatorId || u.id === event.creatorId);
            if (!creator || creator.role !== roleFilter) return false;
        }

        // Date / time range filter
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
            const doc = await createMalayalamPDF();

            doc.setFontSize(20);
            doc.setFont('NotoSansMalayalam', 'bold');
            doc.text('Light Suvara Event Report', 20, 20);

            doc.setFontSize(16);
            doc.setFont('NotoSansMalayalam', 'normal');
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

    const handleExport = async (format: string) => {
        if (format === 'csv') {
            const headers = ['Title', 'Date', 'Category', 'School', 'Forane', 'Creator Role', 'Status'];
            const csvContent = [
                headers.join(','),
                ...filteredEvents.map(e => {
                    const creator = users.find(u => u.uid === e.creatorId || u.id === e.creatorId);
                    return [
                        `"${e.title}"`,
                        getEventDate(e).toLocaleDateString(),
                        e.category,
                        `"${e.creatorSchoolName || ''}"`,
                        `"${e.creatorForane || creator?.forane || ''}"`,
                        creator?.role || 'unknown',
                        e.isPublic ? 'Published' : 'Draft'
                    ].join(',');
                })
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `events_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            toast.success('CSV Exported successfully');
        } else if (format === 'pdf') {
            const doc = await createMalayalamPDF();
            doc.setFontSize(18);
            doc.setFont('NotoSansMalayalam', 'bold');
            doc.text(`Events Report - ${reportType.toUpperCase()}`, 14, 20);

            // Print active filters
            let filterY = 30;
            doc.setFontSize(10);
            const activeFilters: string[] = [];
            if (foraneFilter !== 'All') activeFilters.push(`Forane: ${foraneFilter}`);
            if (schoolFilter !== 'All') activeFilters.push(`School: ${schoolFilter}`);
            if (roleFilter !== 'All') activeFilters.push(`Role: ${roleFilter}`);
            if (activeFilters.length > 0) {
                doc.text(`Filters: ${activeFilters.join(' | ')}`, 14, filterY);
                filterY += 10;
            }

            let y = filterY + 5;
            doc.setFontSize(12);
            doc.setFont('NotoSansMalayalam', 'normal');
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

    // Updated data structure for the new chart
    const categoryData = [
        { category: "cml", count: categoryCount['CML'] || 0, fill: "var(--color-cml)" },
        { category: "suvara", count: categoryCount['Suvara'] || 0, fill: "var(--color-suvara)" },
    ];

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
        count: {
            label: "Events",
        },
        cml: {
            label: "CML",
            color: "hsl(217, 91%, 60%)", // Blue
        },
        suvara: {
            label: "Suvara",
            color: "hsl(217, 91%, 75%)", // Light Blue
        },
    } satisfies ChartConfig;

    const schoolChartConfig = {
        events: {
            label: "Events",
            color: "hsl(217, 91%, 50%)", // Darker Blue
        },
    };

    return (
        <div className="space-y-6 w-[calc(100vw-2rem)] md:w-[calc(100vw-4rem)] lg:w-[calc(100vw-20rem)]">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <CardTitle>Event Report Generator</CardTitle>
                    </div>
                    <CardDescription>Generate detailed PDF reports for individual events</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
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
                            className="bg-blue-600 hover:bg-blue-700 px-6 w-full sm:w-auto"
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
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <CardTitle>Analytics Dashboard</CardTitle>
                        </div>
                        <div className="grid grid-cols-2 sm:flex flex-wrap gap-2 items-center w-full xl:w-auto">
                            <Select value={reportType} onValueChange={(v: string) => setReportType(v as 'all' | 'year' | 'month' | 'week')}>
                                <SelectTrigger className="w-full md:w-[120px] h-9">
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
                                    <SelectTrigger className="w-full md:w-[100px] h-9">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}

                            {reportType === 'month' && (
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="w-full md:w-[120px] h-9">
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
                                    className="h-9 px-3 py-1 rounded-md border border-input bg-background text-sm w-full md:w-auto"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            )}

                            <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>

                            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} className="w-full md:w-auto">
                                <Download className="w-4 h-4 mr-2" />
                                Export PDF
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="w-full md:w-auto">
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {/* Entity Filters */}
                <div className="px-4 sm:px-6 pb-2">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Filter by</span>
                        {(foraneFilter !== 'All' || schoolFilter !== 'All' || roleFilter !== 'All') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-muted-foreground"
                                onClick={() => { setForaneFilter('All'); setSchoolFilter('All'); setRoleFilter('All'); }}
                            >
                                Clear all
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Select value={foraneFilter} onValueChange={setForaneFilter}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All Foranes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Foranes</SelectItem>
                                {foraneNames.map(f => (
                                    <SelectItem key={f} value={f}>{f}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All Schools / Parishes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Schools / Parishes</SelectItem>
                                {schoolNames.map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Roles</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="school">Sunday School</SelectItem>
                                <SelectItem value="animator">Animator</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Active filter badges */}
                    {(foraneFilter !== 'All' || schoolFilter !== 'All' || roleFilter !== 'All') && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {foraneFilter !== 'All' && (
                                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setForaneFilter('All')}>
                                    Forane: {foraneFilter} ✕
                                </Badge>
                            )}
                            {schoolFilter !== 'All' && (
                                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSchoolFilter('All')}>
                                    School: {schoolFilter} ✕
                                </Badge>
                            )}
                            {roleFilter !== 'All' && (
                                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setRoleFilter('All')}>
                                    Role: {roleFilter} ✕
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
                <CardContent className="p-4 sm:p-6">
                    <div className="space-y-6 sm:space-y-8">
                        <div>
                            <h4 className="mb-4 font-medium text-sm sm:text-base">Events Over Time ({reportType === 'all' ? 'Yearly' : reportType === 'year' ? 'Monthly' : reportType === 'month' ? 'Weekly' : 'Daily'})</h4>
                            <ChartContainer config={eventsChartConfig} className="h-[250px] sm:h-[300px] w-full">
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
                            <Card className="flex flex-col shadow-none border-0 sm:border sm:shadow-sm">
                                <CardHeader className="items-center pb-0 p-4 sm:p-6">
                                    <CardTitle className="text-base font-medium">Category Distribution</CardTitle>
                                    <CardDescription>Distribution of events by category</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 pb-0">
                                    <ChartContainer
                                        config={categoryChartConfig}
                                        className="mx-auto aspect-square max-h-[250px]"
                                    >
                                        <PieChart>
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent hideLabel />}
                                            />
                                            <Pie
                                                data={categoryData}
                                                dataKey="count"
                                                nameKey="category"
                                                stroke="0"
                                            />
                                        </PieChart>
                                    </ChartContainer>
                                </CardContent>
                                <CardFooter className="flex-col gap-2 text-sm">
                                    <div className="flex items-center gap-2 leading-none font-medium">
                                        Total {filteredEvents.length} events processed <TrendingUp className="h-4 w-4" />
                                    </div>
                                    <div className="text-muted-foreground leading-none">
                                        Showing distribution for selected period
                                    </div>
                                </CardFooter>
                            </Card>

                            <Card className="flex flex-col shadow-none border-0 sm:border sm:shadow-sm">
                                <CardHeader className="items-center pb-0 p-4 sm:p-6">
                                    <CardTitle className="text-base font-medium">Most Active Schools</CardTitle>
                                    <CardDescription>Top schools by event creation</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 pb-0">
                                     <ChartContainer 
                                        config={schoolChartConfig} 
                                        className="mx-auto aspect-square max-h-[250px]"
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
                                </CardContent>
                                <CardFooter className="flex-col gap-2 text-sm">
                                    <div className="flex items-center gap-2 leading-none font-medium">
                                        Top {schoolActivity.length} Active Schools <TrendingUp className="h-4 w-4" />
                                    </div>
                                    <div className="text-muted-foreground leading-none">
                                        Based on current filters
                                    </div>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-1">Total Events</p>
                            <p className="text-3xl font-semibold text-blue-600">{filteredEvents.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-1">Published</p>
                            <p className="text-3xl font-semibold text-green-600">
                                {filteredEvents.filter(e => e.isPublic).length}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-1">Active Schools</p>
                            <p className="text-3xl font-semibold text-blue-600">
                                {schoolActivity.length}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-1">By Sunday School</p>
                            <p className="text-3xl font-semibold text-indigo-600">
                                {filteredEvents.filter(e => {
                                    const creator = users.find(u => u.uid === e.creatorId || u.id === e.creatorId);
                                    return creator?.role === 'school';
                                }).length}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-1">By Animators</p>
                            <p className="text-3xl font-semibold text-orange-600">
                                {filteredEvents.filter(e => {
                                    const creator = users.find(u => u.uid === e.creatorId || u.id === e.creatorId);
                                    return creator?.role === 'animator';
                                }).length}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-1">By Admin</p>
                            <p className="text-3xl font-semibold text-purple-600">
                                {filteredEvents.filter(e => {
                                    const creator = users.find(u => u.uid === e.creatorId || u.id === e.creatorId);
                                    return creator?.role === 'admin';
                                }).length}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
