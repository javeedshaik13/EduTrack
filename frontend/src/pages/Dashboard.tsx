import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import UploadMaterialModal from '@/components/modals/UploadMaterialModal';
import ManageClassroomsModal from '@/components/modals/ManageClassroomsModal';
import SimpleManageModal from '@/components/modals/SimpleManageModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import JoinClassroomModal from '@/components/modals/JoinClassroomModal';
import GeneratePinModal from '@/components/modals/GeneratePinModal';
import { 
  BookOpen, 
  TrendingUp, 
  Users, 
  Award, 
  Target, 
  Calendar, 
  CheckCircle, 
  ClipboardList, 
  Crown, 
  Flame, 
  Trophy, 
  Star, 
  Zap, 
  Plus,
  Loader2,
  Clock,
  AlertCircle,
  Medal
} from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [streakData, setStreakData] = useState<any>(null);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  // Mock dynamic data for student dashboard
  const mockStudentStats = {
    totalAssignments: 12,
    completedAssignments: 8,
    averageScore: 87,
    badges: [
      { id: 1, name: 'Consistent Learner', icon: 'flame', color: 'yellow', earned: '2025-09-01' },
      { id: 2, name: 'Mathematics Master', icon: 'star', color: 'blue', earned: '2025-09-05' },
      { id: 3, name: 'Assignment Ace', icon: 'checkCircle', color: 'green', earned: '2025-08-28' },
      { id: 4, name: 'Material Explorer', icon: 'bookOpen', color: 'purple', earned: '2025-08-20' }
    ],
    streak: 12,
    rank: 3,
    totalStudents: 45,
    pointsEarned: 1240,
    materialsViewed: 23,
    questionsAsked: 7
  };

  const mockLeaderboard = [
    { rank: 1, name: 'Sarah Chen', points: 1450, avatar: null },
    { rank: 2, name: 'Alex Rodriguez', points: 1380, avatar: null },
    { rank: 3, name: user?.name || 'You', points: 1240, avatar: user?.avatar, isCurrentUser: true },
    { rank: 4, name: 'Emma Thompson', points: 1190, avatar: null },
    { rank: 5, name: 'Michael Kim', points: 1150, avatar: null }
  ];

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // Fetch real dashboard data from API
        const response = await apiService.getStudentDashboardData();
        
        if (response.success && response.data) {
          const dashboardData = response.data;
          
          // Set stats from API response
          setStats({
            totalAssignments: dashboardData.summary.totalAssignments,
            completedAssignments: dashboardData.summary.completedAssignments,
            averageScore: dashboardData.summary.averageScore,
            badges: dashboardData.student.badges,
            streak: dashboardData.student.stats.streak,
            rank: dashboardData.student.stats.rank,
            totalStudents: 45, // This would come from a separate leaderboard API
            pointsEarned: dashboardData.summary.totalPoints,
            materialsViewed: 0, // This would be tracked separately
            questionsAsked: 0 // This would be tracked separately
          });
          
          // Set other data
          setClassrooms(dashboardData.classrooms);
          setAssignments(dashboardData.recentAssignments);
          setStreakData({ 
            current: dashboardData.student.stats.streak, 
            longest: dashboardData.student.stats.longestStreak, 
            lastLogin: new Date().toISOString() 
          });
          
          // For now, use mock leaderboard - this would be a separate API call
          setLeaderboard(mockLeaderboard);
          
          // Check for new achievements and show congratulations
          const newAchievements = dashboardData.student.badges.filter((badge: any) => {
            // For now, show all badges as new - in real app, track when badges were earned
            return true;
          });
          
          if (newAchievements.length > 0 && newAchievements.length <= 2) {
            setTimeout(() => {
              newAchievements.forEach((achievement: any) => {
                toast({
                  title: `🎉 Congratulations! Badge Earned!`,
                  description: `You've earned the "${achievement}" badge! Keep up the great work!`,
                  duration: 5000,
                });
              });
            }, 1500);
          }
        } else {
          // Fallback to mock data if API fails
          setStats(mockStudentStats);
          setLeaderboard(mockLeaderboard);
          setStreakData({ current: 12, longest: 15, lastLogin: new Date().toISOString() });
        }
        
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [toast, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const completionRate = stats ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-hero rounded-xl p-4 lg:p-6 text-white shadow-elevated">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl lg:text-2xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
            <p className="text-white/90 text-sm lg:text-base">Ready to continue your learning journey?</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-300" />
                <span className="text-sm text-white/90">{stats?.streak || 0} day streak</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-300" />
                <span className="text-sm text-white/90">{stats?.pointsEarned || 0} points</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="text-center bg-white/10 rounded-lg p-3">
              <div className="text-xl lg:text-2xl font-bold flex items-center gap-1">
                <Crown className="h-5 w-5 text-yellow-300" />
                #{stats?.rank || '-'}
              </div>
              <div className="text-xs lg:text-sm text-white/80">Class Rank</div>
            </div>
            <div className="text-center bg-white/10 rounded-lg p-3">
              <div className="text-xl lg:text-2xl font-bold">{completionRate}%</div>
              <div className="text-xs lg:text-sm text-white/80">Completion</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAssignments || 0}</div>
            <p className="text-xs text-muted-foreground">Assigned to you</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats?.completedAssignments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageScore || 0}%</div>
            <p className="text-xs text-muted-foreground">Across all assignments</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges</CardTitle>
            <Award className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.badges?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Earned achievements</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Progress Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Progress Overview
            </CardTitle>
            <CardDescription>Your learning progress this semester</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Assignment Completion</span>
                <span className="text-sm text-muted-foreground">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Average Performance</span>
                <span className="text-sm text-muted-foreground">{stats?.averageScore || 0}%</span>
              </div>
              <Progress value={stats?.averageScore || 0} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Materials Explored</span>
                <span className="text-sm text-muted-foreground">{stats?.materialsViewed || 0}</span>
              </div>
              <Progress value={Math.min((stats?.materialsViewed || 0) * 4, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Class Leaderboard */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Class Leaderboard
            </CardTitle>
            <CardDescription>Top performers in your class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.slice(0, 5).map((student, index) => (
                <div key={student.rank} className={`flex items-center gap-3 p-2 rounded-lg ${
                  student.isCurrentUser ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/30'
                } transition-colors`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    student.rank === 1 ? 'bg-yellow-500 text-white' :
                    student.rank === 2 ? 'bg-gray-400 text-white' :
                    student.rank === 3 ? 'bg-amber-600 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {student.rank === 1 ? '👑' : student.rank}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={student.avatar} />
                    <AvatarFallback className="text-xs">
                      {student.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      student.isCurrentUser ? 'text-primary' : ''
                    }`}>
                      {student.name} {student.isCurrentUser ? '(You)' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">{student.points} points</p>
                  </div>
                  {student.rank <= 3 && (
                    <Medal className={`h-4 w-4 ${
                      student.rank === 1 ? 'text-yellow-500' :
                      student.rank === 2 ? 'text-gray-400' :
                      'text-amber-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Badges & Achievements */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Badges & Achievements
            </CardTitle>
            <CardDescription>Your earned accomplishments and milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Consistent Learner Badge */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                <div className="p-2 rounded-full bg-yellow-500/20">
                  <Award className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-yellow-800">Consistent Learner</p>
                  <p className="text-sm text-yellow-600">Maintained 7-day study streak</p>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">New</Badge>
              </div>

              {/* Mathematics Master Badge */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <div className="p-2 rounded-full bg-blue-500/20">
                  <Star className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-blue-800">Mathematics Master</p>
                  <p className="text-sm text-blue-600">Scored 95% in Mathematics Quiz</p>
                </div>
                <Badge variant="outline" className="border-blue-200 text-blue-700">3 days ago</Badge>
              </div>

              {/* Assignment Ace Badge */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                <div className="p-2 rounded-full bg-green-500/20">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-800">Assignment Ace</p>
                  <p className="text-sm text-green-600">Completed 5 assignments on time</p>
                </div>
                <Badge variant="outline" className="border-green-200 text-green-700">1 week ago</Badge>
              </div>

              {/* Material Explorer Badge */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200">
                <div className="p-2 rounded-full bg-purple-500/20">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-purple-800">Material Explorer</p>
                  <p className="text-sm text-purple-600">Downloaded 10+ study materials</p>
                </div>
                <Badge variant="outline" className="border-purple-200 text-purple-700">2 weeks ago</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classroom Status */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            My Classrooms
          </CardTitle>
          <CardDescription>Joined classrooms and quick actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classrooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {classrooms.map((classroom: any) => (
                  <div 
                    key={classroom._id || classroom.id} 
                    className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/classrooms/${classroom._id || classroom.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{classroom.name}</p>
                        <p className="text-sm text-muted-foreground">{classroom.subject}</p>
                      </div>
                      <Badge variant="secondary">{classroom.teacher || 'Teacher'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">You haven't joined any classrooms yet</p>
                <JoinClassroomModal onClassroomJoined={() => {
                  // Refresh dashboard data
                  window.location.reload();
                }}>
                  <Button className="bg-gradient-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Join Classroom
                  </Button>
                </JoinClassroomModal>
              </div>
            )}
            
            {classrooms.length > 0 && (
              <div className="flex justify-center pt-2">
                <JoinClassroomModal onClassroomJoined={() => {
                  window.location.reload();
                }}>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Join Another Classroom
                  </Button>
                </JoinClassroomModal>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump to your most important tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => navigate('/materials')}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Browse Materials</p>
                  <p className="text-sm text-muted-foreground">Access study resources ({materials.length})</p>
                </div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => navigate('/assignments')}
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-secondary" />
                <div className="text-left">
                  <p className="font-medium">View Assignments</p>
                  <p className="text-sm text-muted-foreground">Check pending tasks ({assignments.filter(a => a.status === 'pending').length})</p>
                </div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => navigate('/statistics')}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-accent" />
                <div className="text-left">
                  <p className="font-medium">View Statistics</p>
                  <p className="text-sm text-muted-foreground">Track your progress</p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsResponse, activityResponse, submissionsResponse, classroomsResponse] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getRecentActivity(),
          apiService.getTeacherSubmissions(),
          apiService.getClassrooms()
        ]);

        if (statsResponse.success) {
          setStats(statsResponse.data);
        } else {
          console.error('Failed to fetch stats:', statsResponse.error);
        }

        if (activityResponse.success) {
          setRecentActivity(activityResponse.data || []);
        } else {
          console.error('Failed to fetch recent activity:', activityResponse.error);
        }

        if (submissionsResponse.success) {
          setSubmissions(submissionsResponse.data || []);
        } else {
          console.error('Failed to fetch submissions:', submissionsResponse.error);
        }

        if (classroomsResponse.success) {
          setClassrooms(classroomsResponse.data || []);
        } else {
          console.error('Failed to fetch classrooms:', classroomsResponse.error);
          // Fallback to mock classrooms for testing
          const mockClassrooms = [
            {
              id: '1',
              name: 'Mathematics Advanced',
              subject: 'Mathematics',
              studentCount: 25,
              description: 'Advanced mathematics course covering calculus and algebra'
            },
            {
              id: '2',
              name: 'Physics Fundamentals',
              subject: 'Physics',
              studentCount: 18,
              description: 'Basic physics principles and laws of motion'
            },
            {
              id: '3',
              name: 'Chemistry Lab',
              subject: 'Chemistry',
              studentCount: 22,
              description: 'Hands-on chemistry laboratory experiments'
            },
            {
              id: '4',
              name: 'History Timeline',
              subject: 'History',
              studentCount: 30,
              description: 'World history from ancient to modern times'
            }
          ];
          setClassrooms(mockClassrooms);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
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
      {/* Welcome Section */}
      <div className="bg-gradient-secondary rounded-xl p-6 text-white shadow-elevated">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Good day, {user?.name}! 👨‍🏫</h1>
            <p className="text-white/90">Manage your classes and inspire learning</p>
          </div>
          <Avatar className="h-16 w-16 border-4 border-white/20">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="bg-white/20 text-white text-lg">
              {user?.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Teacher Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* First Row - Basic Stats */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classrooms</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeClassrooms || 0}</div>
            <p className="text-xs text-muted-foreground">Currently teaching</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.recentActivity?.newStudentsThisWeek || 0} joined this week
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments Created</CardTitle>
            <ClipboardList className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats?.assignmentsCreated || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.recentActivity?.assignmentsThisWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materials Uploaded</CardTitle>
            <BookOpen className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats?.materialsUploaded || 0}</div>
            <p className="text-xs text-muted-foreground">Resources shared</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.totalSubmissions || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.recentActivity?.submissionsThisWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.pendingSubmissions || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.averageScore || 0}%</div>
            <p className="text-xs text-muted-foreground">Class performance</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.completionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Assignment completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Student Submissions by Subject */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Student Submissions by Subject
              </CardTitle>
              <CardDescription>Monitor assignment submissions across all subjects</CardDescription>
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Subjects</option>
              {Array.from(new Set(submissions.map(s => s.subject))).map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {submissions
              .filter(submission => selectedSubject === 'all' || submission.subject === selectedSubject)
              .slice(0, 6)
              .map((submission, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        submission.status === 'submitted' ? 'bg-blue-100 text-blue-600' :
                        submission.status === 'graded' ? 'bg-green-100 text-green-600' :
                        submission.status === 'late' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {submission.status === 'submitted' && <Clock className="h-5 w-5" />}
                        {submission.status === 'graded' && <CheckCircle className="h-5 w-5" />}
                        {submission.status === 'late' && <AlertCircle className="h-5 w-5" />}
                        {submission.status === 'pending' && <Clock className="h-5 w-5" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">{submission.assignmentTitle}</p>
                        <Badge variant="outline" className="text-xs">
                          {submission.subject}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        By {submission.studentName} • {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'Not submitted'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {submission.score && (
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{submission.score}/{submission.totalPoints}</p>
                        <p className="text-xs text-gray-500">{Math.round((submission.score / submission.totalPoints) * 100)}%</p>
                      </div>
                    )}
                    <Badge variant={
                      submission.status === 'graded' ? 'default' :
                      submission.status === 'submitted' ? 'secondary' :
                      submission.status === 'late' ? 'destructive' :
                      'outline'
                    }>
                      {submission.status}
                    </Badge>
                  </div>
                </div>
              ))}
            {submissions.filter(s => selectedSubject === 'all' || s.subject === selectedSubject).length === 0 && (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No submissions found for the selected subject</p>
              </div>
            )}
            {submissions.filter(s => selectedSubject === 'all' || s.subject === selectedSubject).length > 6 && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/assignments')}
                  className="text-primary hover:text-primary-dark"
                >
                  View All Submissions ({submissions.filter(s => selectedSubject === 'all' || s.subject === selectedSubject).length})
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Classroom Management with PIN Generation */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-secondary" />
            Classroom Management
          </CardTitle>
          <CardDescription>Generate PINs for students to join your classrooms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classrooms.map((classroom) => (
              <div key={classroom.id} className="p-4 rounded-lg border border-gray-200 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{classroom.name}</h3>
                    <p className="text-sm text-gray-600">{classroom.subject}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {classroom.studentCount || 0} students
                  </Badge>
                </div>
                <div className="space-y-2">
                  <GeneratePinModal 
                    classroomId={classroom.id} 
                    classroomName={classroom.name}
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      Generate PIN
                    </Button>
                  </GeneratePinModal>
                  <p className="text-xs text-gray-500 text-center">
                    Students can join using the generated PIN
                  </p>
                </div>
              </div>
            ))}
            {classrooms.length === 0 && (
              <div className="col-span-full text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No classrooms found</p>
                <ManageClassroomsModal>
                  <Button variant="outline">Create Your First Classroom</Button>
                </ManageClassroomsModal>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest classroom updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'assignment' ? 'bg-success/10' :
                    activity.type === 'material' ? 'bg-primary/10' :
                    activity.type === 'student' ? 'bg-secondary/10' :
                    'bg-muted/10'
                  }`}>
                    {activity.type === 'assignment' && <CheckCircle className="h-4 w-4 text-success" />}
                    {activity.type === 'material' && <BookOpen className="h-4 w-4 text-primary" />}
                    {activity.type === 'student' && <Users className="h-4 w-4 text-secondary" />}
                  </div>
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Teacher Tools</CardTitle>
            <CardDescription>Quick access to your teaching resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                className="w-full justify-start gap-3 h-12 bg-gradient-primary"
                onClick={() => navigate('/assignments')}
              >
                <ClipboardList className="h-5 w-5" />
                Create New Assignment
              </Button>
              
              <UploadMaterialModal onUploadSuccess={() => {
                // Refresh dashboard data after successful upload
                const refreshData = async () => {
                  try {
                    const [statsResponse, activityResponse] = await Promise.all([
                      apiService.getDashboardStats(),
                      apiService.getRecentActivity()
                    ]);
                    if (statsResponse.success) setStats(statsResponse.data);
                    if (activityResponse.success) setRecentActivity(activityResponse.data || []);
                  } catch (error) {
                    console.error('Error refreshing dashboard:', error);
                  }
                };
                refreshData();
              }}>
                <Button variant="outline" className="w-full justify-start gap-3 h-12">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Upload Learning Material
                </Button>
              </UploadMaterialModal>
              
              <ManageClassroomsModal>
                <Button variant="outline" className="w-full justify-start gap-3 h-12">
                  <Users className="h-5 w-5 text-secondary" />
                  Manage Classrooms
                </Button>
              </ManageClassroomsModal>
              
              <SimpleManageModal>
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-green-200 text-green-700 hover:bg-green-50">
                  <Users className="h-5 w-5 text-green-600" />
                  Test Simple Manager
                </Button>
              </SimpleManageModal>
              
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <TrendingUp className="h-5 w-5 text-accent" />
                View Student Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'student') {
    return <StudentDashboard />;
  }

  if (user?.role === 'teacher') {
    return <TeacherDashboard />;
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-muted-foreground">Loading dashboard...</p>
    </div>
  );
};

export default Dashboard;