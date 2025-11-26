export interface Event {
  id: string;
  title: string;
  description: string;
  image: string;
  category: 'CML' | 'Suvara' | 'General';
  status: 'Public' | 'Draft';
  createdBy: string;
  schoolName: string;
  eventDate: string;
  venue: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Admin' | 'School';
  schoolName?: string;
  avatar: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'Public' | 'All' | 'Specific';
  targets?: string[];
  sentTime: string;
}

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Annual Science Fair 2025',
    description: 'Join us for an exciting showcase of student innovations and scientific projects. Students from grades 6-12 will present their research and experiments.',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
    category: 'CML',
    status: 'Public',
    createdBy: 'user-1',
    schoolName: 'Greenwood High School',
    eventDate: '2025-02-15',
    venue: 'Main Auditorium',
    createdAt: '2025-01-10'
  },
  {
    id: '2',
    title: 'Music Concert - Spring Edition',
    description: 'Experience an evening of melodious performances by our talented music students. Featuring classical, contemporary, and fusion pieces.',
    image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
    category: 'Suvara',
    status: 'Public',
    createdBy: 'user-2',
    schoolName: 'Riverside Academy',
    eventDate: '2025-03-20',
    venue: 'School Theater',
    createdAt: '2025-01-15'
  },
  {
    id: '3',
    title: 'Sports Day Championship',
    description: 'Annual inter-house sports competition featuring track and field events, team sports, and athletic competitions.',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
    category: 'General',
    status: 'Draft',
    createdBy: 'user-3',
    schoolName: 'Oakwood School',
    eventDate: '2025-04-10',
    venue: 'Sports Complex',
    createdAt: '2025-01-20'
  },
  {
    id: '4',
    title: 'Art Exhibition - Young Talents',
    description: 'A vibrant display of student artwork including paintings, sculptures, and digital art creations.',
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
    category: 'CML',
    status: 'Public',
    createdBy: 'user-1',
    schoolName: 'Greenwood High School',
    eventDate: '2025-02-28',
    venue: 'Art Gallery',
    createdAt: '2025-01-12'
  },
  {
    id: '5',
    title: 'Debate Competition 2025',
    description: 'Inter-school debate championship on contemporary social and global issues.',
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
    category: 'General',
    status: 'Draft',
    createdBy: 'user-2',
    schoolName: 'Riverside Academy',
    eventDate: '2025-03-05',
    venue: 'Conference Hall',
    createdAt: '2025-01-18'
  }
];

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@greenwood.edu',
    phone: '+1 234-567-8901',
    role: 'School',
    schoolName: 'Greenwood High School',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'
  },
  {
    id: 'user-2',
    name: 'Michael Chen',
    email: 'michael.chen@riverside.edu',
    phone: '+1 234-567-8902',
    role: 'School',
    schoolName: 'Riverside Academy',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
  },
  {
    id: 'user-3',
    name: 'Emily Rodriguez',
    email: 'emily.r@oakwood.edu',
    phone: '+1 234-567-8903',
    role: 'School',
    schoolName: 'Oakwood School',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200'
  },
  {
    id: 'user-4',
    name: 'Admin User',
    email: 'admin@lightsuvara.com',
    phone: '+1 234-567-8900',
    role: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200'
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'System Maintenance Scheduled',
    body: 'The platform will undergo scheduled maintenance on Sunday, 2:00 AM - 4:00 AM EST. Please save your work beforehand.',
    type: 'Public',
    sentTime: '2025-01-20T10:30:00'
  },
  {
    id: 'notif-2',
    title: 'New Event Approval Required',
    body: 'Annual Science Fair 2025 has been submitted and is awaiting your approval.',
    type: 'All',
    sentTime: '2025-01-19T14:15:00'
  },
  {
    id: 'notif-3',
    title: 'Event Submission Reminder',
    body: 'Please submit your upcoming events for Q1 2025 by the end of this month.',
    type: 'Specific',
    targets: ['Greenwood High School', 'Riverside Academy'],
    sentTime: '2025-01-18T09:00:00'
  }
];

export const schools = [
  'Greenwood High School',
  'Riverside Academy',
  'Oakwood School',
  'Sunset Valley School',
  'Mountain View Academy'
];

export const categories = ['All', 'CML', 'Suvara', 'General'];
export const statuses = ['All', 'Public', 'Draft'];
export const roles = ['All', 'Admin', 'School'];
