import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAssignments } from '../../hooks/useAssignments';
import { batchAssignmentService } from '../../services/batchAssignmentService';
import { batchService } from '../../services/batchService';
import { Assignment } from '../../types';
import { LoadingSkeleton } from '../common/Loading';

export function ReadingTab() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { fetchPublishedAssignments, loading: professorLoading } = useAssignments();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [batchName, setBatchName] = useState<string | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);

  // Check if user is a professor
  const isProfessor = user?.organizationMemberships?.some(
    (membership) => membership.role === 'org:professor'
  ) ?? false;

  // Combined loading state: professorLoading for professors, studentLoading for students
  const loading = isProfessor ? professorLoading : studentLoading;

  useEffect(() => {
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProfessor]);

  const loadAssignments = async () => {
    try {
      const getTokenWrapper = async () => getToken();
      
      if (isProfessor) {
        // Professors see all published assignments
        const published = await fetchPublishedAssignments('reading');
        if (published) {
          setAssignments(published);
        }
      } else {
        // Students see only their batch-assigned assessments
        setStudentLoading(true);
        const batchData = await batchService.getMyBatch(getTokenWrapper);
        if (batchData) {
          setBatchName(batchData.name);
          const assigned = await batchAssignmentService.getAssignedAssignments(getTokenWrapper);
          const readingAssignments = assigned
            .map((ba: any) => ba.assignment)
            .filter((a: any) => a && a.type === 'reading');
          setAssignments(readingAssignments);
        } else {
          setAssignments([]);
        }
        setStudentLoading(false);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
      setStudentLoading(false);
    }
  };

  const handleStartAssignment = (assignment: Assignment) => {
    if (!assignment.taskId) {
      alert(t('practice.assignmentNoQuestions'));
      return;
    }
    // Navigate to exam view with assignment task
    navigate(`/exam/reading?taskId=${assignment.taskId}&assignmentId=${assignment.assignmentId}`);
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-lg"
            >
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg md:rounded-xl" />
              </div>
              <LoadingSkeleton variant="text" width="80%" height={20} className="mb-2 bg-white/30" />
              <LoadingSkeleton variant="text" width="100%" height={14} className="mb-1 bg-white/20" />
              <LoadingSkeleton variant="text" width="70%" height={14} className="mb-2 md:mb-3 bg-white/20" />
              <div className="flex items-center justify-between">
                <LoadingSkeleton variant="rectangular" width={80} height={16} className="bg-white/30" />
                <LoadingSkeleton variant="rectangular" width={50} height={16} className="bg-white/30" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">
          {isProfessor 
            ? t('practice.noReadingAssignments')
            : batchName
              ? t('batches.noAssignmentsYet')
              : t('batches.noBatchAssignedDescription')
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {assignments.map((assignment) => (
          <div
            key={assignment.assignmentId}
            className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all group cursor-pointer"
            onClick={() => handleStartAssignment(assignment)}
          >
            <div className="flex items-start justify-between mb-2 md:mb-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-xl group-hover:scale-110 transition-transform">📖</div>
            </div>
            <h3 className="text-sm md:text-lg font-bold text-white mb-1 md:mb-1.5">
              {assignment.title}
            </h3>
            <p className="text-blue-100 text-xs leading-relaxed mb-2 md:mb-3 line-clamp-2">
              {assignment.prompt}
            </p>
            <div className="flex items-center justify-between text-white text-xs">
              <span className="font-semibold">
                {assignment.settings.numberOfQuestions} {t('practice.questions')}
              </span>
              <span className="font-bold">{t('practice.start')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
