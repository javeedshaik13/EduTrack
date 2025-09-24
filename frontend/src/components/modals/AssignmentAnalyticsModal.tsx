import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  FileText,
  Download,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  BookOpen,
  Star,
  AlertCircle,
  Info,
  Lightbulb
} from 'lucide-react';

interface AssignmentAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: any;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

const AssignmentAnalyticsModal: React.FC<AssignmentAnalyticsModalProps> = ({
  isOpen,
  onClose,
  assignment
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && assignment) {
      fetchAnalytics();
    }
  }, [isOpen, assignment]);

  const fetchAnalytics = async () => {
    if (!assignment?._id) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.analyzeAssignment(assignment._id);
      if (response.success) {
        setAnalytics(response.data);
      } else {
        setError(response.error || 'Failed to load analytics');
        toast({
          title: "Failed to load analytics",
          description: response.error || "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      setError('Network error occurred');
      toast({
        title: "Network error",
        description: "Failed to load analytics. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'concern': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'concern': return 'bg-red-100 text-red-800 border-red-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const exportAnalytics = () => {
    if (!analytics) return;

    const exportData = {
      assignment: analytics.assignmentInfo,
      generatedAt: new Date().toISOString(),
      summary: {
        submissionRate: `${analytics.submissionStats.submissionRate.toFixed(1)}%`,
        averageScore: `${analytics.scoreAnalysis.averagePercentage.toFixed(1)}%`,
        totalStudents: analytics.submissionStats.totalStudents,
        submittedCount: analytics.submissionStats.submittedCount
      },
      insights: analytics.insights,
      recommendations: analytics.recommendations
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assignment-analytics-${assignment.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Analytics Exported",
      description: "Assignment analytics have been downloaded as JSON file."
    });
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-muted-foreground">Analyzing assignment submissions...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <Button onClick={fetchAnalytics}>Retry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!analytics) return null;

  // Prepare chart data
  const gradeDistributionData = Object.entries(analytics.gradeDistribution).map(([grade, count]) => ({
    grade,
    count: count as number,
    percentage: analytics.submissionStats.submittedCount > 0 
      ? ((count as number) / analytics.submissionStats.submittedCount * 100).toFixed(1)
      : '0'
  }));

  const performanceData = Object.entries(analytics.performanceCategories).map(([category, count]) => ({
    name: category.replace('_', ' ').toUpperCase(),
    value: count as number
  }));

  const difficultyData = Object.entries(analytics.difficultyAnalysis).map(([level, data]: [string, any]) => ({
    difficulty: level.toUpperCase(),
    attempted: data.attempted,
    correct: data.correct,
    accuracy: data.percentage.toFixed(1)
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Assignment Analytics: {analytics.assignmentInfo.title}
          </DialogTitle>
          <DialogDescription>
            Comprehensive analysis of student submissions and performance
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-muted-foreground">
            Generated on {new Date(analytics.generatedAt).toLocaleString()}
          </div>
          <Button onClick={exportAnalytics} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export Report
          </Button>
        </div>

        <Tabs defaultValue="overview" className="flex-1">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[70vh] mt-4">
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analytics.submissionStats.submissionRate.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Submission Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100">
                        <Target className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analytics.scoreAnalysis.averagePercentage.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Class Average</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-100">
                        <Clock className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analytics.timeAnalysis.averageTimeFormatted}</p>
                        <p className="text-xs text-muted-foreground">Avg Time</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-orange-100">
                        <Award className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analytics.scoreAnalysis.highestScore}</p>
                        <p className="text-xs text-muted-foreground">Highest Score</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Submission Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submission Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Submitted: {analytics.submissionStats.submittedCount}/{analytics.submissionStats.totalStudents}</span>
                      <span>{analytics.submissionStats.submissionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={analytics.submissionStats.submissionRate} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <span>Graded: {analytics.submissionStats.gradedCount}/{analytics.submissionStats.submittedCount}</span>
                      <span>{analytics.submissionStats.gradingProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={analytics.submissionStats.gradingProgress} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Grade Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Grade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gradeDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grade" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [value, 'Students']}
                        labelFormatter={(label) => `Grade ${label}`}
                      />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Categories Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={performanceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {performanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Score Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Score Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 rounded-lg bg-green-50">
                        <div className="text-2xl font-bold text-green-600">{analytics.scoreAnalysis.highestScore}</div>
                        <div className="text-sm text-muted-foreground">Highest</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-blue-50">
                        <div className="text-2xl font-bold text-blue-600">{analytics.scoreAnalysis.averageScore.toFixed(1)}</div>
                        <div className="text-sm text-muted-foreground">Average</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-purple-50">
                        <div className="text-2xl font-bold text-purple-600">{analytics.scoreAnalysis.medianScore}</div>
                        <div className="text-sm text-muted-foreground">Median</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-red-50">
                        <div className="text-2xl font-bold text-red-600">{analytics.scoreAnalysis.lowestScore}</div>
                        <div className="text-sm text-muted-foreground">Lowest</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Difficulty Analysis */}
              {difficultyData.some(d => d.attempted > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Difficulty Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={difficultyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="difficulty" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="attempted" fill="#8884d8" name="Attempted" />
                        <Bar dataKey="correct" fill="#82ca9d" name="Correct" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Submission Timing */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submission Timing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-green-50">
                      <div className="text-2xl font-bold text-green-600">{analytics.submissionTiming.onTimeSubmissions}</div>
                      <div className="text-sm text-muted-foreground">On Time</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-red-50">
                      <div className="text-2xl font-bold text-red-600">{analytics.submissionTiming.lateSubmissions}</div>
                      <div className="text-sm text-muted-foreground">Late</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-blue-50">
                      <div className="text-2xl font-bold text-blue-600">{analytics.submissionTiming.lateSubmissionRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Late Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="questions" className="space-y-6">
              {analytics.questionAnalysis.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Question-wise Analysis</CardTitle>
                    <CardDescription>Performance breakdown by individual questions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.questionAnalysis.map((question: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium">Question {question.questionNumber}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">{question.questionText}</p>
                            </div>
                            <Badge variant={question.accuracyRate >= 70 ? "default" : question.accuracyRate >= 50 ? "secondary" : "destructive"}>
                              {question.accuracyRate.toFixed(1)}% Accuracy
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mt-3">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-blue-600">{question.totalResponses}</div>
                              <div className="text-xs text-muted-foreground">Responses</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-green-600">{question.correctAnswers}</div>
                              <div className="text-xs text-muted-foreground">Correct</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-red-600">{question.incorrectAnswers}</div>
                              <div className="text-xs text-muted-foreground">Incorrect</div>
                            </div>
                          </div>
                          
                          <Progress value={question.accuracyRate} className="mt-3 h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No question-wise analysis available for this assignment.</p>
                    <p className="text-sm text-muted-foreground mt-2">This feature is available for quiz-type assignments with structured questions.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="students" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.topPerformers.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.topPerformers.map((student: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <p className="font-medium">{student.studentName}</p>
                              <p className="text-sm text-muted-foreground">{student.studentId}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">{student.percentage.toFixed(1)}%</p>
                              <p className="text-xs text-muted-foreground">{student.score} points</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No graded submissions yet</p>
                    )}
                  </CardContent>
                </Card>

                {/* Struggling Students */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Students Needing Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.strugglingStudents.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.strugglingStudents.map((student: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div>
                              <p className="font-medium">{student.studentName}</p>
                              <p className="text-sm text-muted-foreground">{student.studentId}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-red-600">{student.percentage.toFixed(1)}%</p>
                              <p className="text-xs text-muted-foreground">{student.score} points</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">All students performing well!</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              {/* AI Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    AI-Powered Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.insights.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.insights.map((insight: any, index: number) => (
                        <div key={index} className="flex gap-3 p-4 rounded-lg border">
                          {getInsightIcon(insight.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{insight.title}</h4>
                              <Badge className={getInsightBadgeColor(insight.type)} variant="outline">
                                {insight.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{insight.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No specific insights generated for this assignment.</p>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.recommendations.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.recommendations.map((recommendation: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No specific recommendations at this time.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentAnalyticsModal;
