import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  Send,
  Loader2,
  FileText,
  Timer
} from 'lucide-react';

interface Question {
  _id: string;
  type: 'mcq' | 'short_answer' | 'long_answer' | 'true_false';
  question: string;
  options?: { text: string; isCorrect: boolean }[];
  points: number;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  questions: Question[];
  totalPoints: number;
  dueDate: string;
  timeLimit?: number;
}

const AssignmentSubmission: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (assignmentId) {
      initializeSubmission();
    }
  }, [assignmentId]);

  useEffect(() => {
    if (assignment?.timeLimit && timeRemaining !== null) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [assignment?.timeLimit, timeRemaining]);

  const initializeSubmission = async () => {
    try {
      setLoading(true);
      
      // Get assignment details
      const assignmentResponse = await apiService.getAssignmentById(assignmentId!);
      if (!assignmentResponse.success) {
        throw new Error('Assignment not found');
      }
      
      setAssignment(assignmentResponse.data);

      // Start or get existing submission
      const submissionResponse = await apiService.startSubmission(assignmentId!);
      if (submissionResponse.success) {
        setSubmission(submissionResponse.data);
        
        // Set time limit if applicable
        if (assignmentResponse.data.timeLimit) {
          setTimeRemaining(assignmentResponse.data.timeLimit * 60); // Convert minutes to seconds
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load assignment",
        variant: "destructive"
      });
      navigate('/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: any, questionType: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        questionType,
        answer,
        selectedOption: questionType === 'mcq' ? answer : undefined
      }
    }));
  };

  const handleSubmit = async () => {
    if (!submission) return;

    try {
      setSubmitting(true);

      // Convert answers to array format
      const answersArray = Object.values(answers).map((answer: any) => ({
        ...answer,
        maxPoints: assignment?.questions.find(q => q._id === answer.questionId)?.points || 1
      }));

      const response = await apiService.submitAssignment(submission._id, answersArray);
      
      if (response.success) {
        toast({
          title: "Success!",
          description: "Assignment submitted successfully",
        });
        navigate('/assignments');
      } else {
        throw new Error(response.error || 'Submission failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit assignment",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    if (Object.keys(answers).length > 0) {
      handleSubmit();
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question: Question, index: number) => {
    const questionAnswer = answers[question._id];

    return (
      <Card key={question._id} className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg">
                Question {index + 1}
                <Badge variant="outline" className="ml-2">
                  {question.points} {question.points === 1 ? 'point' : 'points'}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                {question.question}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {question.type === 'mcq' && question.options && (
            <RadioGroup
              value={questionAnswer?.answer || ''}
              onValueChange={(value) => handleAnswerChange(question._id, value, 'mcq')}
            >
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.text} id={`${question._id}-${optionIndex}`} />
                  <Label htmlFor={`${question._id}-${optionIndex}`} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {question.type === 'true_false' && (
            <RadioGroup
              value={questionAnswer?.answer || ''}
              onValueChange={(value) => handleAnswerChange(question._id, value, 'true_false')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`${question._id}-true`} />
                <Label htmlFor={`${question._id}-true`} className="cursor-pointer">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`${question._id}-false`} />
                <Label htmlFor={`${question._id}-false`} className="cursor-pointer">False</Label>
              </div>
            </RadioGroup>
          )}

          {question.type === 'short_answer' && (
            <Input
              placeholder="Enter your answer..."
              value={questionAnswer?.answer || ''}
              onChange={(e) => handleAnswerChange(question._id, e.target.value, 'short_answer')}
              className="mt-2"
            />
          )}

          {question.type === 'long_answer' && (
            <Textarea
              placeholder="Enter your detailed answer..."
              value={questionAnswer?.answer || ''}
              onChange={(e) => handleAnswerChange(question._id, e.target.value, 'long_answer')}
              className="mt-2 min-h-[120px]"
            />
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Assignment Not Found</h3>
          <p className="text-muted-foreground mb-4">The assignment you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/assignments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>
        </div>
      </div>
    );
  }

  const answeredQuestions = Object.keys(answers).length;
  const totalQuestions = assignment.questions.length;
  const isComplete = answeredQuestions === totalQuestions;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/assignments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignments
        </Button>
        
        {timeRemaining !== null && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
            <Timer className="h-4 w-4 text-orange-600" />
            <span className="font-mono text-orange-700">
              Time Remaining: {formatTime(timeRemaining)}
            </span>
          </div>
        )}
      </div>

      {/* Assignment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {assignment.title}
          </CardTitle>
          <CardDescription>{assignment.description}</CardDescription>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Total Points: {assignment.totalPoints}</span>
            <span>Questions: {totalQuestions}</span>
            {assignment.dueDate && (
              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {answeredQuestions} of {totalQuestions} questions answered
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(answeredQuestions / totalQuestions) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-6">
        {assignment.questions.map((question, index) => renderQuestion(question, index))}
      </div>

      {/* Submit Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isComplete ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-500" />
              )}
              <span className="text-sm">
                {isComplete 
                  ? "All questions answered. Ready to submit!" 
                  : `${totalQuestions - answeredQuestions} questions remaining`
                }
              </span>
            </div>
            
            <Button 
              onClick={handleSubmit}
              disabled={submitting || answeredQuestions === 0}
              className="min-w-[120px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Assignment
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentSubmission;
