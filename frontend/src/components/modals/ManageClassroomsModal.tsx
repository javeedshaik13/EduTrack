import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Share, Settings, Loader2, Copy, CheckCircle, UserPlus, Eye, BarChart3, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ClassroomSettingsModal from './ClassroomSettingsModal';

interface Classroom {
  _id: string;
  name: string;
  subject: string;
  description?: string;
  studentCount: number;
  inviteCode: string;
  isActive: boolean;
  createdAt: string;
}

interface ManageClassroomsModalProps {
  children: React.ReactNode;
}

const ManageClassroomsModal: React.FC<ManageClassroomsModalProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [showClassroomDetails, setShowClassroomDetails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [newClassroom, setNewClassroom] = useState({
    name: '',
    subject: '',
    description: '',
    grade: ''
  });
  const { toast } = useToast();

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const response = await apiService.getClassrooms();
      console.log('fetchClassrooms response:', response);
      if (response.success) {
        console.log('Classrooms data:', response.data);
        setClassrooms(response.data || []);
      } else {
        console.error('Failed to load classrooms:', response.error);
        toast({
          title: "Failed to load classrooms",
          description: response.error || "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Network error loading classrooms:', error);
      toast({
        title: "Network error",
        description: "Failed to load classrooms. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClassroom.name.trim() || !newClassroom.subject.trim() || !newClassroom.grade.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in the classroom name, subject, and grade",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const response = await apiService.createClassroom(newClassroom);
      if (response.success) {
        toast({
          title: "Classroom created successfully",
          description: `${newClassroom.name} has been created and is ready for students`,
        });
        
        setNewClassroom({ name: '', subject: '', description: '', grade: '' });
        setShowCreateForm(false);
        fetchClassrooms(); // Refresh the list
      } else {
        toast({
          title: "Failed to create classroom",
          description: response.error || "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Failed to create classroom. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleShareClassroom = async (classroomId: string) => {
    try {
      const response = await apiService.generateClassroomPin(classroomId);
      if (response.success && response.data?.pin) {
        await navigator.clipboard.writeText(response.data.pin);
        toast({
          title: "PIN copied!",
          description: "The classroom PIN has been copied to your clipboard",
        });
      } else {
        toast({
          title: "Failed to generate PIN",
          description: response.error || "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Failed to copy PIN",
        description: "Please try again or copy the PIN manually",
        variant: "destructive"
      });
    }
  };

  const fetchClassroomStudents = async (classroomId: string) => {
    console.log('fetchClassroomStudents called for classroomId:', classroomId);
    setLoadingStudents(true);
    try {
      const response = await apiService.getClassroomStudents(classroomId);
      console.log('getClassroomStudents response:', response);
      if (response.success) {
        setStudents(response.data || []);
        console.log('Students set:', response.data);
      } else {
        console.error('Failed to load students:', response.error);
        toast({
          title: "Failed to load students",
          description: response.error || "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Network error fetching students:', error);
      toast({
        title: "Network error",
        description: "Failed to load students. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleManageClassroom = async (classroom: Classroom) => {
    console.log('handleManageClassroom called with:', classroom);
    setSelectedClassroom(classroom);
    setShowClassroomDetails(true);
    console.log('Modal state set, fetching students for classroom:', classroom._id);
    await fetchClassroomStudents(classroom._id);
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClassroom) return;
    
    try {
      const response = await apiService.removeStudentFromClassroom(selectedClassroom._id, studentId);
      if (response.success) {
        toast({
          title: "Student removed",
          description: "Student has been removed from the classroom",
        });
        await fetchClassroomStudents(selectedClassroom._id);
        await fetchClassrooms(); // Refresh classroom list to update student count
      } else {
        toast({
          title: "Failed to remove student",
          description: response.error || "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Failed to remove student. Please check your connection.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (open) {
      fetchClassrooms();
    }
  }, [open]);

  useEffect(() => {
    console.log('Modal state changed:', { showClassroomDetails, selectedClassroom: selectedClassroom?.name });
  }, [showClassroomDetails, selectedClassroom]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-secondary" />
            Manage Classrooms
          </DialogTitle>
          <DialogDescription>
            View and manage your classrooms, create new ones, and share invite codes with students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create New Classroom Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Classrooms</h3>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Classroom
            </Button>
          </div>

          {/* Create Classroom Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create New Classroom</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateClassroom} className="space-y-3">
                  <div>
                    <Input
                      placeholder="Classroom name (e.g., Mathematics Grade 10)"
                      value={newClassroom.name}
                      onChange={(e) => setNewClassroom(prev => ({ ...prev, name: e.target.value }))}
                      disabled={creating}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Subject (e.g., Mathematics, Physics)"
                      value={newClassroom.subject}
                      onChange={(e) => setNewClassroom(prev => ({ ...prev, subject: e.target.value }))}
                      disabled={creating}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Grade (e.g., Grade 10, Class 12, Year 1)"
                      value={newClassroom.grade}
                      onChange={(e) => setNewClassroom(prev => ({ ...prev, grade: e.target.value }))}
                      disabled={creating}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Description (optional)"
                      value={newClassroom.description}
                      onChange={(e) => setNewClassroom(prev => ({ ...prev, description: e.target.value }))}
                      disabled={creating}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={creating || !newClassroom.name.trim() || !newClassroom.subject.trim() || !newClassroom.grade.trim()}
                      className="bg-gradient-secondary"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Classroom'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Classrooms List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading classrooms...</span>
              </div>
            </div>
          ) : classrooms.length > 0 ? (
            <div className="space-y-3">
              {classrooms.map((classroom) => (
                <Card key={classroom._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{classroom.name}</h4>
                          <Badge variant={classroom.isActive ? "default" : "secondary"}>
                            {classroom.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{classroom.subject}</p>
                        {classroom.description && (
                          <p className="text-sm text-muted-foreground mb-2">{classroom.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {classroom.studentCount} students
                          </span>
                          <span className="text-muted-foreground">
                            Created {new Date(classroom.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShareClassroom(classroom._id)}
                        >
                          <Share className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            console.log('Manage button clicked for:', classroom.name);
                            handleManageClassroom(classroom);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            console.log('Settings button clicked for:', classroom.name);
                            setSelectedClassroom(classroom);
                            setShowSettings(true);
                          }}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Settings
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No classrooms yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first classroom to start teaching and managing students.
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Classroom
              </Button>
            </div>
          )}

          {/* Classroom Details View */}
          {showClassroomDetails && selectedClassroom && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]" onClick={(e) => {
              // Close modal if clicking on backdrop
              if (e.target === e.currentTarget) {
                setShowClassroomDetails(false);
                setSelectedClassroom(null);
                setStudents([]);
              }
            }}>
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedClassroom.name}</h2>
                    <p className="text-muted-foreground">{selectedClassroom.subject}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowClassroomDetails(false);
                      setSelectedClassroom(null);
                      setStudents([]);
                    }}
                  >
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="text-2xl font-bold">{students.length}</p>
                          <p className="text-sm text-muted-foreground">Total Students</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-sm text-muted-foreground">Assignments</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-purple-500" />
                        <div>
                          <p className="text-2xl font-bold">0%</p>
                          <p className="text-sm text-muted-foreground">Avg Score</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Students</h3>
                    <Button
                      onClick={() => handleShareClassroom(selectedClassroom._id)}
                      className="bg-gradient-primary"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Generate PIN to Add Students
                    </Button>
                  </div>

                  {loadingStudents ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading students...</span>
                      </div>
                    </div>
                  ) : students.length > 0 ? (
                    <div className="space-y-3">
                      {students.map((student) => (
                        <Card key={student._id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                  {student.name?.charAt(0)?.toUpperCase() || 'S'}
                                </div>
                                <div>
                                  <p className="font-medium">{student.name || 'Unknown Student'}</p>
                                  <p className="text-sm text-muted-foreground">{student.email || 'No email'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Joined: {student.joinedAt ? new Date(student.joinedAt).toLocaleDateString() : 'Unknown'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={student.isActive ? "default" : "secondary"}>
                                  {student.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveStudent(student._id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No students yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Generate a PIN and share it with students to let them join this classroom.
                      </p>
                      <Button
                        onClick={() => handleShareClassroom(selectedClassroom._id)}
                        className="bg-gradient-primary"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Generate PIN
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Classroom Settings Modal */}
      <ClassroomSettingsModal
        isOpen={showSettings}
        onClose={() => {
          setShowSettings(false);
          setSelectedClassroom(null);
        }}
        classroom={selectedClassroom}
        onSettingsUpdated={() => {
          fetchClassrooms();
        }}
      />
    </Dialog>
  );
};

export default ManageClassroomsModal;
