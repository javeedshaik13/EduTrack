import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { 
  Settings, 
  Users, 
  Shield, 
  Bell, 
  Key, 
  Trash2, 
  Save, 
  Loader2,
  Copy,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface ClassroomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: any;
  onSettingsUpdated?: () => void;
}

const ClassroomSettingsModal: React.FC<ClassroomSettingsModalProps> = ({
  isOpen,
  onClose,
  classroom,
  onSettingsUpdated
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingPin, setGeneratingPin] = useState(false);
  const [settings, setSettings] = useState({
    name: '',
    description: '',
    subject: '',
    grade: '',
    maxStudents: 50,
    allowStudentDiscussion: true,
    allowAnonymousQuestions: true,
    autoGrading: true,
    showLeaderboard: true,
    allowLateSubmissions: true,
    isActive: true
  });
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (isOpen && classroom) {
      setSettings({
        name: classroom.name || '',
        description: classroom.description || '',
        subject: classroom.subject || '',
        grade: classroom.grade || '',
        maxStudents: classroom.settings?.maxStudents || 50,
        allowStudentDiscussion: classroom.settings?.allowStudentDiscussion ?? true,
        allowAnonymousQuestions: classroom.settings?.allowAnonymousQuestions ?? true,
        autoGrading: classroom.settings?.autoGrading ?? true,
        showLeaderboard: classroom.settings?.showLeaderboard ?? true,
        allowLateSubmissions: classroom.settings?.allowLateSubmissions ?? true,
        isActive: classroom.isActive ?? true
      });
      setPin(classroom.pin || '');
    }
  }, [isOpen, classroom]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await apiService.updateClassroom(classroom._id, {
        name: settings.name,
        description: settings.description,
        subject: settings.subject,
        grade: settings.grade,
        isActive: settings.isActive,
        settings: {
          maxStudents: settings.maxStudents,
          allowStudentDiscussion: settings.allowStudentDiscussion,
          allowAnonymousQuestions: settings.allowAnonymousQuestions,
          autoGrading: settings.autoGrading,
          showLeaderboard: settings.showLeaderboard,
          allowLateSubmissions: settings.allowLateSubmissions
        }
      });

      if (response.success) {
        toast({
          title: "Settings saved",
          description: "Classroom settings have been updated successfully.",
        });
        onSettingsUpdated?.();
      } else {
        toast({
          title: "Failed to save settings",
          description: response.error || "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Failed to save settings. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePin = async () => {
    setGeneratingPin(true);
    try {
      const response = await apiService.generateClassroomPin(classroom._id);
      if (response.success) {
        setPin(response.data.pin);
        toast({
          title: "New PIN generated",
          description: "A new classroom PIN has been generated.",
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
        title: "Network error",
        description: "Failed to generate PIN. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setGeneratingPin(false);
    }
  };

  const handleCopyPin = async () => {
    if (pin) {
      try {
        await navigator.clipboard.writeText(pin);
        toast({
          title: "PIN copied",
          description: "Classroom PIN has been copied to clipboard.",
        });
      } catch (error) {
        toast({
          title: "Failed to copy",
          description: "Please copy the PIN manually.",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteClassroom = async () => {
    if (window.confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) {
      try {
        const response = await apiService.deleteClassroom(classroom._id);
        if (response.success) {
          toast({
            title: "Classroom deleted",
            description: "The classroom has been deleted successfully.",
          });
          onClose();
          onSettingsUpdated?.();
        } else {
          toast({
            title: "Failed to delete classroom",
            description: response.error || "Please try again",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Network error",
          description: "Failed to delete classroom. Please check your connection.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Classroom Settings
          </DialogTitle>
          <DialogDescription>
            Manage your classroom configuration, permissions, and access settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Update your classroom's basic details and information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Classroom Name</Label>
                    <Input
                      id="name"
                      value={settings.name}
                      onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter classroom name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={settings.subject}
                      onChange={(e) => setSettings(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter subject"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade/Level</Label>
                    <Input
                      id="grade"
                      value={settings.grade}
                      onChange={(e) => setSettings(prev => ({ ...prev, grade: e.target.value }))}
                      placeholder="Enter grade or level"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxStudents">Maximum Students</Label>
                    <Input
                      id="maxStudents"
                      type="number"
                      min="1"
                      max="200"
                      value={settings.maxStudents}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 50 }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={settings.description}
                    onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter classroom description (optional)"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={settings.isActive}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Classroom is active</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Permissions</CardTitle>
                <CardDescription>
                  Configure what students can do in this classroom.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Student Discussions</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow students to participate in classroom discussions
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowStudentDiscussion}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowStudentDiscussion: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Anonymous Questions</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow students to ask questions anonymously
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowAnonymousQuestions}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowAnonymousQuestions: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Late Submissions</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow students to submit assignments after the deadline
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowLateSubmissions}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowLateSubmissions: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Leaderboard</Label>
                    <p className="text-sm text-muted-foreground">
                      Display class leaderboard to students
                    </p>
                  </div>
                  <Switch
                    checked={settings.showLeaderboard}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showLeaderboard: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Grading</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically grade assignments when possible
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoGrading}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoGrading: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Classroom Access</CardTitle>
                <CardDescription>
                  Manage how students can join your classroom.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Classroom PIN</Label>
                      <p className="text-sm text-muted-foreground">
                        Students use this PIN to join your classroom
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {pin ? (
                        <>
                          <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                            {pin}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCopyPin}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="secondary">No PIN generated</Badge>
                      )}
                      <Button
                        size="sm"
                        onClick={handleGeneratePin}
                        disabled={generatingPin}
                      >
                        {generatingPin ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        {pin ? 'Regenerate' : 'Generate'} PIN
                      </Button>
                    </div>
                  </div>

                  {pin && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Key className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900">Share this PIN with students</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Students can use this PIN to join your classroom. Keep it secure and only share with intended students.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger" className="space-y-6">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions for this classroom.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-red-900">Delete Classroom</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Permanently delete this classroom and all associated data. This action cannot be undone.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteClassroom}
                      className="ml-4"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Classroom
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClassroomSettingsModal;
