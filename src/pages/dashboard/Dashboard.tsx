import { useEffect, useState } from "react";
import {
  Calendar,
  Users,
  School,
  CheckCircle2,
  Loader2,
  TrendingUp,
  GraduationCap,
  UserCheck,
  ClipboardList,
  Bell,
} from "lucide-react";
import { StatCard } from "../../components/common/StatCard";
import { ChartRadarDots } from "./ChartRadarDots";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Link } from "react-router";
import {
  getEvents,
  EventData,
} from "../../features/events/services/eventService";
import { getUsers, UserData } from "../../features/users/services/userService";
import { getNotifications } from "../../features/notifications/services/notificationService";
import { getActivePrograms } from "../../features/programs/services/programService";
import { getAnimatorStats } from "../../features/animators/services/animatorService";
import { getMarks } from "../../features/marks/services/marksService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useAuth } from "../../context/AuthContext";
import { Bar, BarChart, Rectangle, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../components/ui/chart";
import { motion } from "framer-motion";

export function Dashboard() {
  const { isAdminUser, currentUser } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activePrograms, setActivePrograms] = useState(0);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Starting to fetch dashboard data...");

        const eventsData = await getEvents().catch((err) => {
          console.error("Error fetching events:", err);
          return [];
        });

        const usersData = await getUsers().catch((err) => {
          console.error("Error fetching users:", err);
          return [];
        });

        const notificationsData = await getNotifications().catch((err) => {
          console.error("Error fetching notifications:", err);
          return [];
        });

        const programsData = await getActivePrograms().catch((err) => {
          console.error("Error fetching programs:", err);
          return [];
        });

        const animatorStatsData = await getAnimatorStats().catch((err) => {
          console.error("Error fetching animator stats:", err);
          return { total: 0, assigned: 0, unassigned: 0 };
        });

        const marksData = await getMarks().catch((err: any) => {
          console.error("Error fetching marks:", err);
          return [];
        });

        // Process marks data for Radar Chart (Average Marks per Forane)
        const foraneMap = new Map<string, { total: number; count: number }>();

        marksData.forEach((mark: any) => {
          const school = usersData.find((u) => u.id === mark.schoolId);
          const forane = school?.forane || "Unknown";

          const totalMarks = Object.values(mark.marks).reduce(
            (sum: number, val: unknown) => sum + (val as number),
            0
          );

          if (foraneMap.has(forane)) {
            const current = foraneMap.get(forane)!;
            foraneMap.set(forane, {
              total: current.total + totalMarks,
              count: current.count + 1,
            });
          } else {
            foraneMap.set(forane, { total: totalMarks, count: 1 });
          }
        });

        const processedRadarData = Array.from(foraneMap.entries()).map(
          ([forane, stats]) => ({
            forane,
            score: Math.round(stats.total / stats.count),
          })
        );

        console.log("Fetched data:", {
          events: eventsData?.length || 0,
          users: usersData?.length || 0,
          notifications: notificationsData?.length || 0,
          programs: programsData?.length || 0,
          animatorStats: animatorStatsData,
          marks: marksData?.length || 0,
        });

        setEvents(eventsData as EventData[]);
        setUsers(usersData);
        setNotifications(notificationsData);
        setActivePrograms(programsData?.length || 0);
        setRadarData(processedRadarData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const filteredEvents = events.filter((event) => {
    if (isAdminUser) return true;
    const isApprovedPublic = event.status === "approved" && event.isPublic;
    const isMyEvent = currentUser?.uid && event.creatorId === currentUser.uid;
    return isApprovedPublic || !!isMyEvent;
  });

  const publicEvents = events.filter((e) => e.isPublic).length;
  const schoolCount = users.filter((u) => u.role === "school").length;
  const animatorCount = users.filter((u) => u.role === "animator").length;
  const pendingApprovals = events.filter((e) => e.status === "pending").length;

  const getEventDate = (event: EventData) => {
    return event.date
      ? new Date(
        (event.date as any).seconds
          ? (event.date as any).seconds * 1000
          : event.date
      )
      : new Date();
  };

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const currentDate = new Date();
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - (5 - i),
      1
    );
    return {
      month: months[d.getMonth()],
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
    };
  });

  const chartData = last6Months.map(({ month, year, monthIndex }) => {
    const eventsCount = events.filter((event) => {
      const eventDate = getEventDate(event);
      return (
        eventDate.getMonth() === monthIndex && eventDate.getFullYear() === year
      );
    }).length;
    return {
      name: month,
      events: eventsCount,
      fill: "var(--color-events)",
    };
  });

  const chartConfig = {
    events: {
      label: "Events",
      color: "hsl(217, 91%, 60%)", // Blue color
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      className="space-y-4 sm:space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
        {[
          {
            title: "Total Events",
            value: events.length,
            icon: Calendar,
            color: "text-blue-600",
            bg: "bg-blue-100",
          },
          {
            title: "Public Events",
            value: publicEvents,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-100",
          },
          {
            title: "Total Users",
            value: users.length,
            icon: Users,
            color: "text-purple-600",
            bg: "bg-purple-100",
          },
          {
            title: "Total Schools",
            value: schoolCount,
            icon: School,
            color: "text-orange-600",
            bg: "bg-orange-100",
          },
        ].map((stat, index) => (
          <motion.div key={index} variants={itemVariants}>
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              iconColor={stat.color}
              iconBg={stat.bg}
            />
          </motion.div>
        ))}
      </div>

      {isAdminUser && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
          {[
            {
              title: "Active Programs",
              value: activePrograms,
              icon: GraduationCap,
              color: "text-indigo-600",
              bg: "bg-indigo-100",
            },
            {
              title: "Total Animators",
              value: animatorCount,
              icon: UserCheck,
              color: "text-teal-600",
              bg: "bg-teal-100",
            },
            {
              title: "Pending Approvals",
              value: pendingApprovals,
              icon: ClipboardList,
              color: "text-amber-600",
              bg: "bg-amber-100",
            },
            {
              title: "Notifications Sent",
              value: notifications.length,
              icon: Bell,
              color: "text-pink-600",
              bg: "bg-pink-100",
            },
          ].map((stat, index) => (
            <motion.div key={index} variants={itemVariants}>
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                iconColor={stat.color}
                iconBg={stat.bg}
              />
            </motion.div>
          ))}
        </div>
      )}

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Bar Chart - Active</CardTitle>
            <CardDescription>
              Event creation trend over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="h-[250px] sm:h-[300px] w-full aspect-auto"
            >
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  dataKey="events"
                  strokeWidth={2}
                  radius={8}
                  activeIndex={chartData.length - 1}
                  activeBar={({ ...props }) => {
                    return (
                      <Rectangle
                        {...props}
                        fillOpacity={0.8}
                        stroke={props.payload.fill}
                        strokeDasharray={4}
                        strokeDashoffset={4}
                      />
                    );
                  }}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <div className="flex-col items-start gap-2 text-sm p-6 pt-0 hidden sm:flex">
            <div className="flex gap-2 leading-none font-medium">
              Showing total events for the last 6 months{" "}
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8"
      >
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Events</CardTitle>
            <Link to="/events" className="flex items-center">
              <Button variant="default" size="sm">
                View Details
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile View: Simple List */}
            <div className="md:hidden">
              {filteredEvents.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between px-6 py-4 border-b last:border-0"
                >
                  <div className="font-medium truncate mr-4">{event.title}</div>
                  <Link to={`/events/${event.id}`}>
                    <Button variant="outline" size="sm" className="h-8">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
              {events.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  No events found
                </div>
              )}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Title</TableHead>
                    <TableHead className="min-w-[150px]">School</TableHead>
                    <TableHead className="min-w-[100px]">Created</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.slice(0, 5).map((event) => {
                    const creator = users.find((u) => u.id === event.creatorId);
                    const schoolName =
                      event.creatorSchoolName &&
                        event.creatorSchoolName !== "Admin"
                        ? event.creatorSchoolName
                        : creator?.schoolName ||
                        creator?.schoolname ||
                        creator?.fullName ||
                        "Unknown";

                    const formatDate = (date: any) => {
                      if (!date) return "N/A";
                      try {
                        // Handle Firestore Timestamp
                        if (date.seconds) {
                          return new Date(
                            date.seconds * 1000
                          ).toLocaleDateString();
                        }
                        // Handle Date object or string
                        const d = new Date(date);
                        if (isNaN(d.getTime())) return "Invalid Date";
                        return d.toLocaleDateString();
                      } catch (e) {
                        return "Error";
                      }
                    };

                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">
                          <Link
                            to={`/events/${event.id}`}
                            className="hover:underline text-blue-600"
                          >
                            {event.title}
                          </Link>
                        </TableCell>
                        <TableCell>{schoolName}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(event.timestamp)}</span>
                            {event.updatedAt && (
                              <span className="text-xs text-gray-400">
                                Upd: {formatDate(event.updatedAt)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={
                              event.status ||
                              (event.isPublic ? "approved" : "pending")
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {events.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-gray-500 py-8"
                      >
                        No events found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <ChartRadarDots data={radarData} />
      </motion.div>
    </motion.div>
  );
}
