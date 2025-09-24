import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { Users, Settings, Loader2, Trash2 } from 'lucide-react';

interface SimpleManageModalProps {
  children: React.ReactNode;
}

const SimpleManageModal: React.FC<SimpleManageModalProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const { toast } = useToast();

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      console.log('Fetching classrooms...');
      const response = await apiService.getClassrooms();
      console.log('Classrooms response:', response);
      
      if (response.success) {
        setClassrooms(response.data || []);
        toast({
          title: "Success",
          description: `Loaded ${response.data?.length || 0} classrooms`,
        });
      } else {
        console.error('Failed to load classrooms:', response.error);
        toast({
          title: "Error",
          description: response.error || "Failed to load classrooms",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Network error:', error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classroomId: string) => {
    setLoadingStudents(true);
    try {
      console.log('Fetching students for classroom:', classroomId);
      const response = await apiService.getClassroomStudents(classroomId);
      console.log('Students response:', response);
      
      if (response.success) {
        setStudents(response.data || []);
        toast({
          title: "Success",
          description: `Loaded ${response.data?.length || 0} students`,
        });
      } else {
        console.error('Failed to load students:', response.error);
        toast({
          title: "Error",
          description: response.error || "Failed to load students",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Network error fetching students:', error);
      toast({
        title: "Network Error",
        description: "Failed to fetch students",
        variant: "destructive"
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleManageClassroom = (classroom: any) => {
    console.log('Managing classroom:', classroom);
    setSelectedClassroom(classroom);
    fetchStudents(classroom._id);
  };

  useEffect(() => {
    if (open) {
      fetchClassrooms();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Simple Classroom Manager</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading classrooms...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Your Classrooms</h3>
                {classrooms.length > 0 ? (
                  <div className="space-y-2">
                    {classrooms.map((classroom) => (
                      <Card key={classroom._id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{classroom.name}</h4>
                              <p className="text-sm text-muted-foreground">{classroom.subject}</p>
                              <p className="text-xs text-muted-foreground">
                                Students: {classroom.students?.length || 0}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleManageClassroom(classroom)}
                              disabled={selectedClassroom?._id === classroom._id && loadingStudents}
                            >
                              {selectedClassroom?._id === classroom._id && loadingStudents ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Settings className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No classrooms found</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {selectedClassroom ? `Students in ${selectedClassroom.name}` : 'Select a classroom'}
                </h3>
                {selectedClassroom ? (
                  loadingStudents ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading students...
                    </div>
                  ) : students.length > 0 ? (
                    <div className="space-y-2">
                      {students.map((student) => (
                        <Card key={student._id}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{student.name || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">{student.email || 'No email'}</p>
                              </div>
                              <Badge variant={student.isActive ? "default" : "secondary"}>
                                {student.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No students in this classroom</p>
                  )
                ) : (
                  <p className="text-muted-foreground">Click on a classroom to view its students</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleManageModal;
