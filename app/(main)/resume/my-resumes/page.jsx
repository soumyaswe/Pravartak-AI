'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getUserResumes } from '@/lib/data-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Edit, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function getTimeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInDays = Math.floor((now - past) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return past.toLocaleDateString();
}

export default function MyResumesPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResumes() {
      if (!user?.uid) return;
      
      try {
        const { resumes: userResumes } = await getUserResumes(user.uid);
        setResumes(userResumes);
      } catch (error) {
        console.error('Error loading resumes:', error);
        toast.error('Failed to load resumes');
      } finally {
        setLoading(false);
      }
    }

    loadResumes();
  }, [user]);

  const deleteResume = async (resumeId) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    
    try {
      const response = await fetch(`/api/resumes?id=${resumeId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setResumes(resumes.filter(r => r.id !== resumeId));
        toast.success('Resume deleted successfully');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete resume');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold gradient-title">My Resumes</h1>
          <p className="text-muted-foreground mt-2">
            Manage all your saved resumes
          </p>
        </div>
        <Link href="/resume">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Resume
          </Button>
        </Link>
      </div>

      {resumes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No resumes yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first resume to get started
            </p>
            <Link href="/resume">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Resume
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <Card key={resume.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {resume.title || 'Untitled Resume'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getTimeAgo(resume.updatedAt)}
                    </p>
                  </div>
                  <Badge variant={resume.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                    {resume.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Resume Preview */}
                  <div className="h-20 bg-muted/30 rounded p-3 overflow-hidden">
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {resume.content?.markdown?.substring(0, 150) || 'Resume content...'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/resume?id=${resume.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteResume(resume.id)}
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
      )}
    </div>
  );
}
