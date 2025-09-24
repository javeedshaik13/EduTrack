import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import ManageClassroomsModal from '@/components/modals/ManageClassroomsModal';
import { 
  Users, 
  Plus, 
  Search, 
  BookOpen, 
  ClipboardList, 
  Calendar,
  Settings,
  UserPlus,
  Copy,
  TrendingUp,
  Award,
  Loader2
} from 'lucide-react';

const mockClassrooms = [
  {
    id: 1,
    name: "Advanced Mathematics",
    code: "MATH301",
    students: 25,
    assignments: 8,
    materials: 12,
    description: "Calculus and advanced mathematical concepts",
    color: "bg-primary"
  },
  {
    id: 2,
    name: "Physics Fundamentals", 
    code: "PHYS101",
    students: 18,
    assignments: 6,
    materials: 9,
    description: "Introduction to physics principles and mechanics",
    color: "bg-secondary"
  },
  {
    id: 3,
    name: "Chemistry Lab",
    code: "CHEM205",
    students: 15,
    assignments: 4,
    materials: 15,
    description: "Hands-on chemistry experiments and theory",
    color: "bg-accent"
  }
];

const recentStudents = [
  {
    name: "Emma Wilson",
    email: "emma.wilson@email.com",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
    joinedDate: "2024-01-15"
  },
  {
    name: "James Brown",
    email: "james.brown@email.com", 
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    joinedDate: "2024-01-14"
  },
  {
    name: "Sophie Chen",
    email: "sophie.chen@email.com",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    joinedDate: "2024-01-13"
  }
];

const Classrooms: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch classrooms and related data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use mock data for now to prevent API errors
        setClassrooms(Array.isArray(mockClassrooms) ? mockClassrooms : []);
        setStats({
          totalStudents: 58,
          totalAssignments: 18,
          totalMaterials: 36
        });
        setRecentActivity(recentStudents.map(student => ({
          ...student,
          type: 'join',
          timestamp: student.joinedDate,
          description: `Joined ${student.email}`
        })));
        
        setLoading(false);
        
        // Try to fetch real data in background
        try {
          const [classroomsResponse, statsResponse, activityResponse] = await Promise.all([
            apiService.getClassrooms(),
            apiService.getDashboardStats(),
            apiService.getRecentActivity()
          ]);

          if (classroomsResponse.success) {
            setClassrooms(Array.isArray(classroomsResponse.data) ? classroomsResponse.data : mockClassrooms);
          }

          if (statsResponse.success) {
            setStats(statsResponse.data || {
              totalStudents: 58,
              totalAssignments: 18,
              totalMaterials: 36
            });
          }

          if (activityResponse.success) {
            setRecentActivity(activityResponse.data || recentStudents.map(student => ({
              ...student,
              type: 'join',
              timestamp: student.joinedDate,
              description: `Joined ${student.email}`
            })));
          }
        } catch (apiErr) {
          console.warn('API fetch failed, using mock data:', apiErr);
        }
      } catch (err) {
        console.error('Error loading classroom data:', err);
        setError('Failed to load classroom data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateClassroom = async () => {
    setCreating(true);
    try {
      // For now, we'll use the modal for classroom creation
      // This button will trigger the ManageClassroomsModal
      toast({
        title: "Use Create Classroom Button",
        description: "Please use the 'Create Classroom' button in the header to create a new classroom.",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code copied",
        description: `Classroom code ${code} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy classroom code",
        variant: "destructive"
      });
    }
  };

  // Filter classrooms based on search
  const filteredClassrooms = (Array.isArray(classrooms) ? classrooms : []).filter(classroom =>
    classroom.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classroom.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground">Loading classrooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Classrooms</h1>
          <p className="text-muted-foreground">Manage your classes and student interactions</p>
        </div>
        
        <ManageClassroomsModal>
          <Button 
            className="bg-gradient-primary" 
            disabled={creating}
          >
            {creating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create Classroom
          </Button>
        </ManageClassroomsModal>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{classrooms.length}</p>
                <p className="text-xs text-muted-foreground">Active Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-secondary/10">
                <Users className="h-4 w-4 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalStudents || 0}</p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-accent/10">
                <ClipboardList className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalAssignments || 0}</p>
                <p className="text-xs text-muted-foreground">Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/10">
                <BookOpen className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMaterials || 0}</p>
                <p className="text-xs text-muted-foreground">Materials</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search classrooms..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Classrooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClassrooms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No classrooms found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No classrooms match your search.' : 'Create your first classroom to get started.'}
            </p>
            {!searchTerm && (
              <ManageClassroomsModal>
                <Button disabled={creating}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Classroom
                </Button>
              </ManageClassroomsModal>
            )}
          </div>
        ) : (
          filteredClassrooms.map((classroom) => (
            <Card key={classroom._id || classroom.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-full bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                
                <div>
                  <CardTitle className="text-xl">{classroom.name}</CardTitle>
                  <CardDescription>{classroom.description}</CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {classroom.inviteCode || classroom.code}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={() => handleCopyCode(classroom.inviteCode || classroom.code)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-primary">{classroom.studentCount || 0}</div>
                    <div className="text-xs text-muted-foreground">Students</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-secondary">{classroom.assignmentCount || 0}</div>
                    <div className="text-xs text-muted-foreground">Assignments</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-accent">{classroom.materialCount || 0}</div>
                    <div className="text-xs text-muted-foreground">Materials</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <ManageClassroomsModal>
                    <Button 
                      size="sm" 
                      className="flex-1"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </ManageClassroomsModal>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      // Generate PIN for students to join
                      navigator.clipboard.writeText(classroom.inviteCode || 'No PIN available');
                      toast({
                        title: "PIN Copied!",
                        description: `Classroom PIN: ${classroom.inviteCode || 'No PIN'} copied to clipboard`,
                      });
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recent Activity & Student Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Student Activity
            </CardTitle>
            <CardDescription>Latest student joins and interactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              recentActivity.slice(0, 3).map((activity, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.avatar} alt={activity.name} />
                    <AvatarFallback>
                      {activity.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{activity.name || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">{activity.description || activity.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {activity.type === 'join' ? 'Joined' : 'Activity'}
                    </p>
                    <p className="text-sm font-medium">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-secondary" />
              Classroom Insights
            </CardTitle>
            <CardDescription>Performance and engagement metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5">
                <Award className="h-6 w-6 text-success" />
                <div>
                  <h4 className="font-medium">High Engagement</h4>
                  <p className="text-sm text-muted-foreground">
                    Mathematics class shows 95% assignment completion rate
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                <Users className="h-6 w-6 text-primary" />
                <div>
                  <h4 className="font-medium">Active Participation</h4>
                  <p className="text-sm text-muted-foreground">
                    Physics class has the most AI assistant interactions
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/5">
                <BookOpen className="h-6 w-6 text-secondary" />
                <div>
                  <h4 className="font-medium">Material Usage</h4>
                  <p className="text-sm text-muted-foreground">
                    Chemistry materials have 80% download rate
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Quick Classroom Actions</CardTitle>
          <CardDescription>Common tasks to manage your classrooms effectively</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="flex items-center gap-3">
                <UserPlus className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Invite Students</p>
                  <p className="text-sm text-muted-foreground">Send class codes to new students</p>
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-secondary" />
                <div className="text-left">
                  <p className="font-medium">Create Assignment</p>
                  <p className="text-sm text-muted-foreground">Design new tasks for students</p>
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-accent" />
                <div className="text-left">
                  <p className="font-medium">View Analytics</p>
                  <p className="text-sm text-muted-foreground">Check student performance data</p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Classrooms;