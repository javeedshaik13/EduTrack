import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import ClassroomSettingsModal from '@/components/modals/ClassroomSettingsModal';
import { 
  Users, 
  BookOpen, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  Plus,
  Calendar,
  Trophy,
  Target,
  TrendingUp,
  FileText,
  MessageSquare,
  Loader2,
  ArrowLeft,
  Star,
  Award,
  Clock
} from 'lucide-react';

const ClassroomView: React.FC = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [classroom, setClassroom] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAssignments: 0,
    averageScore: 0,
    completionRate: 0
  });

  useEffect(() => {
    if (classroomId) {
      fetchClassroomData();
    }
  }, [classroomId]);

  const fetchClassroomData = async () => {
    setLoading(true);
    try {
      // Fetch classroom details
      const classroomResponse = await apiService.getClassroomById(classroomId!);
      if (classroomResponse.success) {
        setClassroom(classroomResponse.data);
      }

      // Fetch students (for teachers) or classroom info (for students)
      if (user?.role === 'teacher') {
        const [studentsResponse, assignmentsResponse, materialsResponse, analyticsResponse] = await Promise.all([
          apiService.getClassroomStudents(classroomId!),
          apiService.getClassroomAssignments(classroomId!),
          apiService.getClassroomMaterials(classroomId!),
          apiService.getClassroomAnalytics(classroomId!)
        ]);

        if (studentsResponse.success) {
          setStudents(studentsResponse.data || []);
        }
        if (assignmentsResponse.success) {
          setAssignments(assignmentsResponse.data || []);
        }
        if (materialsResponse.success) {
          setMaterials(materialsResponse.data || []);
        }

        // Use dynamic stats from analytics API
        if (analyticsResponse.success) {
          setStats({
            totalStudents: analyticsResponse.data.totalStudents,
            totalAssignments: analyticsResponse.data.totalAssignments,
            averageScore: analyticsResponse.data.averageScore,
            completionRate: analyticsResponse.data.completionRate
          });
        } else {
          // Fallback to basic calculation
          setStats({
            totalStudents: studentsResponse.data?.length || 0,
            totalAssignments: assignmentsResponse.data?.length || 0,
            averageScore: 0,
            completionRate: 0
          });
        }
      } else {
        // For students, fetch their specific data for this classroom
        const [assignmentsResponse, materialsResponse] = await Promise.all([
          apiService.getStudentAssignments(),
          apiService.getClassroomMaterials(classroomId!)
        ]);

        if (assignmentsResponse.success) {
          // Filter assignments for this classroom
          const classroomAssignments = assignmentsResponse.data?.filter(
            (assignment: any) => assignment.classroomId === classroomId
          ) || [];
          setAssignments(classroomAssignments);
          
          // Calculate student stats
          const completedAssignments = classroomAssignments.filter(a => a.status === 'graded').length;
          const averageScore = classroomAssignments
            .filter(a => a.percentage !== null)
            .reduce((sum, a, _, arr) => sum + (a.percentage || 0) / arr.length, 0);
          
          setStats({
            totalStudents: 0,
            totalAssignments: classroomAssignments.length,
            averageScore: Math.round(averageScore) || 0,
            completionRate: classroomAssignments.length > 0 ? Math.round((completedAssignments / classroomAssignments.length) * 100) : 0
          });
        }
        if (materialsResponse.success) {
          setMaterials(materialsResponse.data || []);
        }
      }
    } catch (error) {
      toast({
        title: "Failed to load classroom",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground">Loading classroom...</p>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Classroom not found</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const isTeacher = user?.role === 'teacher';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{classroom.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{classroom.subject}</Badge>
              <Badge variant="outline">{classroom.grade}</Badge>
              <Badge variant={classroom.isActive ? "default" : "secondary"}>
                {classroom.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {classroom.description && (
              <p className="text-muted-foreground mt-2">{classroom.description}</p>
            )}
          </div>
        </div>
        
        {isTeacher && (
          <Button
            onClick={() => setShowSettings(true)}
            variant="outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{isTeacher ? stats.totalStudents : students.length}</p>
                <p className="text-xs text-muted-foreground">
                  {isTeacher ? 'Total Students' : 'Classmates'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <ClipboardList className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.length}</p>
                <p className="text-xs text-muted-foreground">Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <BookOpen className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{materials.length}</p>
                <p className="text-xs text-muted-foreground">Materials</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100">
                <BarChart3 className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageScore}%</p>
                <p className="text-xs text-muted-foreground">
                  {isTeacher ? 'Class Average' : 'Your Average'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue={isTeacher ? "overview" : "assignments"} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value={isTeacher ? "students" : "performance"}>
            {isTeacher ? "Students" : "Performance"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isTeacher ? (
            // Teacher Overview
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Class Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Average Score</span>
                        <span>{stats.averageScore}%</span>
                      </div>
                      <Progress value={stats.averageScore} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Completion Rate</span>
                        <span>{stats.completionRate}%</span>
                      </div>
                      <Progress value={stats.completionRate} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>5 new submissions today</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>2 students joined this week</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span>3 assignments due this week</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Student Overview
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">85%</div>
                      <p className="text-sm text-muted-foreground">Overall Score</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Assignments Completed</span>
                        <span>8/10</span>
                      </div>
                      <Progress value={80} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm">Top Performer</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-blue-500" />
                      <span className="text-sm">Perfect Attendance</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-green-500" />
                      <span className="text-sm">On-Time Submissions</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Assignments</h3>
            {isTeacher && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            )}
          </div>
          
          {assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((assignment) => (
                <Card key={assignment._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{assignment.title}</CardTitle>
                    <CardDescription>{assignment.subject}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Due Date</span>
                        <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Points</span>
                        <span>{assignment.totalPoints}</span>
                      </div>
                      {!isTeacher && assignment.status && (
                        <Badge variant={
                          assignment.status === 'completed' ? 'default' :
                          assignment.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {assignment.status}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
              <p className="text-muted-foreground">
                {isTeacher ? 'Create your first assignment to get started.' : 'No assignments have been posted yet.'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Materials</h3>
            {isTeacher && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Material
              </Button>
            )}
          </div>
          
          {materials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((material, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Material {index + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Uploaded on {new Date().toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No materials yet</h3>
              <p className="text-muted-foreground">
                {isTeacher ? 'Upload your first material to share with students.' : 'No materials have been shared yet.'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value={isTeacher ? "students" : "performance"} className="space-y-4">
          {isTeacher ? (
            // Students tab for teachers
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Students ({students.length})</h3>
              </div>
              
              {students.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student) => (
                    <Card key={student._id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={student.avatar} />
                            <AvatarFallback>
                              {student.name?.charAt(0)?.toUpperCase() || 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{student.name || 'Unknown Student'}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined: {student.joinedAt ? new Date(student.joinedAt).toLocaleDateString() : 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No students yet</h3>
                  <p className="text-muted-foreground">
                    Generate a PIN and share it with students to let them join this classroom.
                  </p>
                </div>
              )}
            </>
          ) : (
            // Performance tab for students
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Your Performance</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Grade Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>A grades</span>
                        <span className="font-medium">5</span>
                      </div>
                      <div className="flex justify-between">
                        <span>B grades</span>
                        <span className="font-medium">2</span>
                      </div>
                      <div className="flex justify-between">
                        <span>C grades</span>
                        <span className="font-medium">1</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Scores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Math Quiz #3</span>
                        <Badge>95%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Physics Lab</span>
                        <Badge>88%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Chemistry Test</span>
                        <Badge>92%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Settings Modal */}
      {isTeacher && (
        <ClassroomSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          classroom={classroom}
          onSettingsUpdated={fetchClassroomData}
        />
      )}
    </div>
  );
};

export default ClassroomView;
