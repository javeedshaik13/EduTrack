import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Calendar,
  FileText,
  Eye,
  MessageSquare,
  GraduationCap,
  MessageCircle,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CreateAssignmentModal from '@/components/modals/CreateAssignmentModal';
import ViewSubmissionsModal from '@/components/modals/ViewSubmissionsModal';
import DoubtSectionModal from '@/components/modals/DoubtSectionModal';
import AssignmentAnalyticsModal from '@/components/modals/AssignmentAnalyticsModal';

type Assignment = any; // Replace with your real assignment type

// Helpers for styling
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-warning text-warning-foreground';
    case 'submitted':
      return 'bg-primary text-primary-foreground';
    case 'graded':
      return 'bg-success text-success-foreground';
    case 'overdue':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (String(difficulty).toLowerCase()) {
    case 'easy':
      return 'bg-success/10 text-success border-success/20';
    case 'medium':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'hard':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const Assignments: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Teacher states
  const [creating, setCreating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [answeringDoubt, setAnsweringDoubt] = useState(false);
  const [gradeInput, setGradeInput] = useState('');
  const [doubtAnswer, setDoubtAnswer] = useState('');

  // Global modal controllers used by teacher portal
  const [viewSubmissionsModal, setViewSubmissionsModal] = useState(false);
  const [doubtSectionModal, setDoubtSectionModal] = useState(false);
  const [analyticsModal, setAnalyticsModal] = useState(false);
  const [modalAssignment, setModalAssignment] = useState<Assignment | null>(null);

  // Student mock states
  const [submissionText, setSubmissionText] = useState('');
  const [newDoubt, setNewDoubt] = useState('');

  // Mock student assignments (fallback)
  const mockStudentAssignments: Assignment[] = [
    {
      id: 1,
      title: 'Calculus Problem Set #3',
      subject: 'Mathematics',
      dueDate: '2025-09-15',
      status: 'pending',
      difficulty: 'Medium',
      points: 100,
      description: 'Solve integration problems and show your work step by step.',
      doubts: [
        {
          id: 1,
          studentName: 'Alice Johnson',
          question: "I'm having trouble with integration by parts. Could you explain step 3?",
          answer: 'Sure! In step 3, you need to identify u and dv...',
          timestamp: '2025-09-12',
        },
        {
          id: 2,
          studentName: 'David Brown',
          question: "What's the difference between definite and indefinite integrals?",
          answer: null,
          timestamp: '2025-09-14',
        },
      ],
    },
    {
      id: 2,
      title: 'Physics Lab Report',
      subject: 'Physics',
      dueDate: '2025-09-10',
      status: 'graded',
      difficulty: 'Hard',
      points: 150,
      score: 142,
      description: 'Analyze the results of the pendulum experiment.',
      doubts: [],
    },
    {
      id: 3,
      title: 'Chemistry Quiz',
      subject: 'Chemistry',
      dueDate: '2025-09-20',
      status: 'pending',
      difficulty: 'Easy',
      points: 50,
      description: 'Multiple choice questions on atomic structure.',
      doubts: [],
    },
    {
      id: 4,
      title: 'Historical Essay',
      subject: 'History',
      dueDate: '2025-08-30',
      status: 'graded',
      difficulty: 'Medium',
      points: 100,
      score: 89,
      description: 'Write about the causes of World War I.',
      doubts: [],
    },
    {
      id: 5,
      title: 'Literary Analysis',
      subject: 'English',
      dueDate: '2025-08-25',
      status: 'submitted',
      difficulty: 'Medium',
      points: 100,
      score: null,
      description: "Analyze the main themes in 'To Kill a Mockingbird'.",
      doubts: [],
    },
  ];

  // Fetch assignments (teacher) or student assignments (student)
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError(null);

        let response: any | undefined;
        if (user?.role === 'teacher') {
          response = await apiService.getAssignments();
        } else if (user?.role === 'student') {
          response = await apiService.getStudentAssignments();
        }

        if (response?.success) {
          setAssignments(response.data || []);
        } else {
          // fallback for student
          if (user?.role === 'student') {
            setAssignments(mockStudentAssignments);
          } else {
            setError(response?.error || 'Failed to load assignments');
            toast({
              title: 'Failed to load assignments',
              description: response?.error || 'Please try again',
              variant: 'destructive',
            });
          }
        }
      } catch (err) {
        if (user?.role === 'student') {
          setAssignments(mockStudentAssignments);
        } else {
          setError('Network error occurred');
          toast({
            title: 'Network error',
            description: 'Failed to load assignments. Please check your connection.',
            variant: 'destructive',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.role) {
      fetchAssignments();
    }
  }, [user, toast]);

  // Loading / error UI
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground">Loading assignments...</p>
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

  // ----------------------
  // STUDENT PORTAL
  // ----------------------
  if (user?.role === 'student') {
    const pendingAssignments = assignments.filter((a) => a.status === 'pending');
    const completedAssignments = assignments.filter((a) => a.status !== 'pending');

    const gradedAssignments = assignments.filter(
      (a) => typeof a.score === 'number' && typeof a.points === 'number' && a.points > 0
    );
    const avgScore =
      gradedAssignments.length > 0
        ? Math.round(
            (gradedAssignments.reduce((sum, a) => sum + a.score / a.points, 0) / gradedAssignments.length) * 100
          )
        : 0;

    const isDueSoon = (dueDateStr: string | undefined) => {
      if (!dueDateStr) return false;
      const due = new Date(dueDateStr);
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);
      // include due today
      return due >= today && due <= sevenDaysFromNow;
    };
    const dueSoonCount = assignments.filter((a) => a.status === 'pending' && isDueSoon(a.dueDate)).length;

    // Student mock handlers
    const handleMockSubmit = () => {
      toast({
        title: '✅ Assignment Submitted Successfully!',
        description: 'Your assignment has been submitted and is now under review.',
      });
      setSubmissionText('');
    };

    const handleMockAskDoubt = () => {
      toast({
        title: 'Question Submitted!',
        description: 'Your doubt has been posted. The teacher will respond soon.',
      });
      setNewDoubt('');
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">Track your assignments and submissions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-warning/10">
                  <Clock className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingAssignments.length}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedAssignments.length}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{avgScore}%</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-secondary/10">
                  <Calendar className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dueSoonCount}</p>
                  <p className="text-xs text-muted-foreground">Due Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Assignments */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Pending Assignments
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingAssignments.map((assignment) => (
              <Card key={assignment._id || assignment.id} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <CardDescription>{assignment.subject}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(assignment.status)} variant="secondary">
                      {assignment.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{assignment.description}</p>

                  {/* Dialog: View Details */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="mb-2">
                        View Details
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{assignment.title}</DialogTitle>
                        <DialogDescription>{assignment.subject}</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-sm">{assignment.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 rounded-lg bg-primary/5">
                            <div className="text-lg font-semibold text-primary">{assignment.points}</div>
                            <div className="text-xs text-muted-foreground">Points</div>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-warning/5">
                            <div className="text-lg font-semibold text-warning">
                              {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '—'}
                            </div>
                            <div className="text-xs text-muted-foreground">Due Date</div>
                          </div>
                        </div>

                        {/* Doubts */}
                        <div className="space-y-4">
                          <h4 className="font-medium flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Questions & Doubts
                          </h4>

                          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {assignment.doubts && assignment.doubts.length > 0 ? (
                              assignment.doubts.map((doubt: any) => (
                                <Card key={doubt.id} className="shadow-card">
                                  <CardContent className="p-3">
                                    <div className="space-y-2">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <p className="text-sm font-medium">{doubt.studentName}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {doubt.timestamp ? new Date(doubt.timestamp).toLocaleString() : ''}
                                          </p>
                                        </div>
                                        <Badge variant={doubt.answer ? 'secondary' : 'outline'}>
                                          {doubt.answer ? 'Answered' : 'Pending'}
                                        </Badge>
                                      </div>

                                      <div className="p-2 rounded bg-muted/30">
                                        <p className="text-sm">{doubt.question}</p>
                                      </div>

                                      {doubt.answer && (
                                        <div className="p-2 rounded bg-success/5">
                                          <p className="text-sm text-success font-medium">Teacher's Answer:</p>
                                          <p className="text-sm">{doubt.answer}</p>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No questions have been asked yet.</p>
                            )}
                          </div>

                          {/* Ask New Question */}
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Ask a question about this assignment..."
                              value={newDoubt}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDoubt(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleMockAskDoubt} disabled={!newDoubt.trim()}>
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Ask Question
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSubmissionText(''); // clear
                                  handleMockSubmit();
                                }}
                              >
                                Submit Assignment
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Completed Assignments */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Completed Assignments
          </h2>

          <div className="space-y-3">
            {completedAssignments.map((assignment) => (
              <Card key={assignment._id || assignment.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${assignment.status === 'graded' ? 'bg-success/10' : 'bg-primary/10'}`}>
                        <CheckCircle className={`h-4 w-4 ${assignment.status === 'graded' ? 'text-success' : 'text-primary'}`} />
                      </div>

                      <div>
                        <h4 className="font-medium">{assignment.title}</h4>
                        <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {assignment.score != null && (
                        <div className="text-right">
                          <p className="font-medium text-success">
                            {assignment.score}/{assignment.points}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((assignment.score / assignment.points) * 100)}%
                          </p>
                        </div>
                      )}

                      <Badge className={getStatusColor(assignment.status)} variant="secondary">
                        {assignment.status}
                      </Badge>
                    </div>
                  </div>

                  {assignment.score != null && (
                    <div className="mt-4">
                      <Progress value={(assignment.score / assignment.points) * 100} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------
  // TEACHER PORTAL
  // ----------------------
  // handlers used by teacher portal
  const handleAssignmentCreated = async () => {
    try {
      const refreshResponse = await apiService.getAssignments();
      if (refreshResponse?.success) {
        setAssignments(refreshResponse.data || []);
      }
    } catch (err) {
      console.error('Failed to refresh assignments:', err);
    }
  };

  const handleScoreAssignment = async (submissionId: number | string, score: number) => {
    setGrading(true);
    try {
      const response = await apiService.gradeSubmission(String(submissionId), { score });
      if (response?.success) {
        toast({ title: 'Assignment graded successfully' });
        const refreshResponse = await apiService.getAssignments();
        if (refreshResponse?.success) setAssignments(refreshResponse.data || []);
        setGradeInput('');
      } else {
        toast({ title: 'Failed to grade assignment', description: response?.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Network error', description: 'Could not grade assignment.', variant: 'destructive' });
    } finally {
      setGrading(false);
    }
  };

  const handleAnswerDoubt = async (doubtId: number | string, answer: string) => {
    setAnsweringDoubt(true);
    try {
      const response = await apiService.answerDoubt(String(doubtId), answer);
      if (response?.success) {
        toast({ title: 'Doubt answered successfully' });
        const refreshResponse = await apiService.getAssignments();
        if (refreshResponse?.success) setAssignments(refreshResponse.data || []);
        setDoubtAnswer('');
      } else {
        toast({ title: 'Failed to answer doubt', description: response?.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Network error', description: 'Could not answer doubt.', variant: 'destructive' });
    } finally {
      setAnsweringDoubt(false);
    }
  };

  // Teacher view
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">Manage assignments and student submissions</p>
        </div>

        <CreateAssignmentModal onAssignmentCreated={handleAssignmentCreated} isCreating={creating}>
          <Button className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        </CreateAssignmentModal>
      </div>

      {/* Top stats for teacher */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <ClipboardList className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.length}</p>
                <p className="text-xs text-muted-foreground">Total Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.reduce((sum, a) => sum + (a.submittedCount || 0), 0)}</p>
                <p className="text-xs text-muted-foreground">Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/10">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.reduce((sum, a) => sum + (a.pendingCount || 0), 0)}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.reduce((sum, a) => sum + (a.overdueCount || 0), 0)}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List for teacher */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No assignments found. Create one to get started.</p>
            <CreateAssignmentModal onAssignmentCreated={handleAssignmentCreated} isCreating={creating}>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Assignment
              </Button>
            </CreateAssignmentModal>
          </div>
        ) : (
          assignments.map((assignment: Assignment) => {
            const totalStudents = assignment.totalStudents || 0;
            const submittedCount = assignment.submittedCount || 0;
            const pendingCount = assignment.pendingCount || 0;
            const overdueCount = assignment.overdueCount || 0;
            const submissionProgress = totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0;

            return (
              <Card key={assignment._id || assignment.id} className="shadow-card hover:shadow-elevated transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{assignment.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span>{assignment.subject}</span>
                        <span>•</span>
                        <span>Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '—'}</span>
                      </CardDescription>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{assignment.description}</p>
                    </div>

                    <Badge
                      variant={assignment.isOverdue ? 'destructive' : assignment.status === 'active' ? 'default' : 'secondary'}
                      className={assignment.isOverdue ? 'bg-destructive text-destructive-foreground' : ''}
                    >
                      {assignment.isOverdue ? 'overdue' : assignment.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="text-lg font-bold text-primary">{totalStudents}</div>
                      <div className="text-xs text-muted-foreground">Total Students</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-success/5 border border-success/10">
                      <div className="text-lg font-bold text-success">{submittedCount}</div>
                      <div className="text-xs text-muted-foreground">Submitted</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-warning/5 border border-warning/10">
                      <div className="text-lg font-bold text-warning">{pendingCount}</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                      <div className="text-lg font-bold text-destructive">{overdueCount}</div>
                      <div className="text-xs text-muted-foreground">Overdue</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Submission Progress</span>
                      <span className="font-medium">{Math.round(submissionProgress)}%</span>
                    </div>
                    <Progress value={submissionProgress} className="h-2" />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        setModalAssignment(assignment);
                        setViewSubmissionsModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Submissions ({submittedCount})
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                      disabled={submittedCount === 0}
                      onClick={() => {
                        setModalAssignment(assignment);
                        setAnalyticsModal(true);
                      }}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analyze Assignment
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                      disabled={submittedCount === 0}
                      onClick={() => {
                        toast({
                          title: 'Grade All',
                          description: `Opening grading interface for ${assignment.title}`,
                        });
                        // optionally open a grade-all modal
                      }}
                    >
                      <GraduationCap className="h-4 w-4 mr-1" />
                      Grade All ({submittedCount})
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setModalAssignment(assignment);
                        setDoubtSectionModal(true);
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modals */}
      <ViewSubmissionsModal
        isOpen={viewSubmissionsModal}
        onClose={() => {
          setViewSubmissionsModal(false);
          setModalAssignment(null);
        }}
        assignment={modalAssignment}
      />

      <DoubtSectionModal
        isOpen={doubtSectionModal}
        onClose={() => {
          setDoubtSectionModal(false);
          setModalAssignment(null);
        }}
        assignment={modalAssignment}
      />

      <AssignmentAnalyticsModal
        isOpen={analyticsModal}
        onClose={() => {
          setAnalyticsModal(false);
          setModalAssignment(null);
        }}
        assignment={modalAssignment}
      />
    </div>
  );
};

export default Assignments;
