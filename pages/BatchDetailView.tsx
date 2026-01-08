import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useBatches } from '../hooks/useBatches';
import { useBatchAssignments } from '../hooks/useBatchAssignments';
import { batchService } from '../services/batchService';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AssignmentList } from '../components/assignments/AssignmentList';
import { StudentSelectDropdown } from '../components/batches/StudentSelectDropdown';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { Assignment } from '../types';

type TabType = 'students' | 'assignments';

export function BatchDetailView() {
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { getToken } = useAuth();
  const { batches: allBatches, getBatch, updateBatch, deleteBatch, removeStudent, addStudent, getStudents } = useBatches();
  const { assignToBatch, unassignFromBatch, getAssessmentBank } = useBatchAssignments();
  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [batch, setBatch] = useState<any>(null);
  const [assignments, setAssignments] = useState<(Assignment & { batchAssignmentId?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [availableStudents, setAvailableStudents] = useState<Array<{ userId: string; email: string; firstName?: string; lastName?: string }>>([]);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [deleteBatchModal, setDeleteBatchModal] = useState(false);
  const [removeStudentModal, setRemoveStudentModal] = useState<{ isOpen: boolean; studentId: string | null }>({ isOpen: false, studentId: null });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assessmentBank, setAssessmentBank] = useState<Assignment[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());
  const [assignModalTab, setAssignModalTab] = useState<'reading' | 'listening'>('reading');

  useEffect(() => {
    if (batchId) {
      loadBatch();
    }
  }, [batchId]);

  const loadBatch = async () => {
    if (!batchId) return;
    try {
      setLoading(true);
      const batchData = await getBatch(batchId);
      setBatch(batchData);
      setNewName(batchData.name);

      // Load assignments
      const getTokenWrapper = async () => getToken();
      const batchAssignments = await batchService.getBatchAssignments(batchId, getTokenWrapper);
      setAssignments(batchAssignments.map((ba: any) => ({ ...ba.assignment, batchAssignmentId: ba.batchAssignmentId })).filter((a: any) => a.assignmentId));

      // Load student details for display
      try {
        const students = await getStudents();
        setAvailableStudents(students);
      } catch (err) {
        // Silently fail - student names are optional
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load batch');
      navigate('/dashboard/batches');
    } finally {
      setLoading(false);
    }
  };

  // Sync batch from hook's state when it updates
  useEffect(() => {
    if (batchId && allBatches.length > 0) {
      const updatedBatch = allBatches.find(b => b.batchId === batchId);
      if (updatedBatch && (!batch || updatedBatch.updatedAt !== batch.updatedAt)) {
        setBatch(updatedBatch);
      }
    }
  }, [allBatches, batchId]);

  const handleUpdateName = async () => {
    if (!batchId || !newName.trim()) return;
    try {
      const updated = await updateBatch(batchId, newName.trim());
      // Update local state - optimistic update already applied
      setBatch(updated);
      setEditingName(false);
    } catch (err: any) {
      // Rollback name on error
      setNewName(batch?.name || '');
      alert(err.message || 'Failed to update batch name');
    }
  };

  const handleDelete = async () => {
    if (!batchId) return;
    try {
      await deleteBatch(batchId);
      navigate('/dashboard/batches');
    } catch (err: any) {
      alert(err.message || 'Failed to delete batch');
    }
  };

  const handleOpenAddStudentModal = async () => {
    setShowAddStudentModal(true);
    try {
      const students = await getStudents();
      // Merge with existing students to preserve info for students already in batch
      setAvailableStudents(prev => {
        const merged = new Map();
        // Add existing students
        prev.forEach(s => merged.set(s.userId, s));
        // Add/update with new students
        students.forEach(s => merged.set(s.userId, s));
        return Array.from(merged.values());
      });
    } catch (err: any) {
      alert(err.message || 'Failed to load students');
    }
  };

  const handleAddStudent = async () => {
    if (!batchId || !selectedStudentId) return;
    try {
      const updated = await addStudent(batchId, selectedStudentId);
      // Update local batch state optimistically
      setBatch(updated);
      setSelectedStudentId('');
      setShowAddStudentModal(false);
      // No need to reload - optimistic update already applied
    } catch (err: any) {
      alert(err.message || 'Failed to add student');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!batchId) return;
    try {
      await removeStudent(batchId, studentId);
      // Update local batch state - the hook already updated it optimistically
      // Just refresh from the hook's state
      const updatedBatch = batches.find(b => b.batchId === batchId);
      if (updatedBatch) {
        setBatch(updatedBatch);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove student');
    }
  };

  const handleOpenAssignModal = async () => {
    setShowAssignModal(true);
    setAssignModalTab('reading');
    setSelectedAssignments(new Set());
    await loadAssessmentBank();
  };

  const loadAssessmentBank = async () => {
    try {
      // Load all assessments (no type filter)
      const bank = await getAssessmentBank();
      // Filter out already assigned
      const assignedIds = new Set(assignments.map(a => a.assignmentId));
      const available = bank.filter(a => !assignedIds.has(a.assignmentId));
      setAssessmentBank(available);
    } catch (err: any) {
      alert(err.message || 'Failed to load assessment bank');
    }
  };

  const handleAssignModalTabChange = (tab: 'reading' | 'listening') => {
    setAssignModalTab(tab);
    // No need to reload, just change the active tab
  };

  const handleAssign = async () => {
    if (!batchId || selectedAssignments.size === 0) return;
    
    // Optimistically update assignments list
    const assignmentIds = Array.from(selectedAssignments);
    const previousAssignments = [...assignments];
    const newAssignments = assignmentIds.map(id => {
      const assignment = assessmentBank.find(a => a.assignmentId === id);
      return assignment ? { ...assignment, batchAssignmentId: `temp-${Date.now()}-${id}` } : null;
    }).filter(Boolean) as any[];

    setAssignments(prev => [...prev, ...newAssignments]);
      setSelectedAssignments(new Set());
      setShowAssignModal(false);

    try {
      // Perform actual assignments
      for (const assignmentId of assignmentIds) {
        await assignToBatch(batchId, assignmentId);
      }
      // Reload to get actual batchAssignmentIds from server
      const getTokenWrapper = async () => getToken();
      const batchAssignments = await batchService.getBatchAssignments(batchId, getTokenWrapper);
      setAssignments(batchAssignments.map((ba: any) => ({ ...ba.assignment, batchAssignmentId: ba.batchAssignmentId })).filter((a: any) => a.assignmentId));
    } catch (err: any) {
      // Rollback on error
      setAssignments(previousAssignments);
      alert(err.message || 'Failed to assign assessments');
    }
  };

  const handleUnassign = async (batchAssignmentId: string) => {
    // Optimistically remove from list
    const assignmentToRemove = assignments.find(a => a.batchAssignmentId === batchAssignmentId);
    const previousAssignments = [...assignments];
    setAssignments(prev => prev.filter(a => a.batchAssignmentId !== batchAssignmentId));

    try {
      await unassignFromBatch(batchAssignmentId);
      // No need to reload - optimistic update already applied
    } catch (err: any) {
      // Rollback on error
      setAssignments(previousAssignments);
      alert(err.message || 'Failed to unassign assessment');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-10">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="mt-4 text-slate-500 dark:text-slate-400">{t('batches.loadingBatch')}</p>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (!batch) {
    return null;
  }

  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8 lg:space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2 md:space-y-3">
            <button
              onClick={() => navigate('/dashboard/batches')}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
            >
              ← {t('batches.myBatches')}
            </button>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 bg-transparent border-b-2 border-indigo-500 px-2"
                  onBlur={handleUpdateName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateName();
                    if (e.key === 'Escape') {
                      setNewName(batch.name);
                      setEditingName(false);
                    }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <h1
                className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 cursor-pointer hover:text-indigo-500"
                onClick={() => setEditingName(true)}
              >
                {batch.name}
              </h1>
            )}
          </div>
          <button
            onClick={() => setDeleteBatchModal(true)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors text-sm"
          >
            {t('batches.deleteBatch')}
          </button>
        </div>

        {/* Tabs */}
        <div className={`
          flex gap-2 p-1 rounded-xl
          ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}
        `}>
          <button
            onClick={() => setActiveTab('students')}
            className={`
              flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all
              ${activeTab === 'students'
                ? theme === 'dark'
                  ? 'bg-indigo-900/50 text-indigo-400 shadow-sm'
                  : 'bg-indigo-100 text-indigo-600 shadow-sm'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }
            `}
          >
            👥 {t('batches.students')} ({batch.studentIds.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`
              flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all
              ${activeTab === 'assignments'
                ? theme === 'dark'
                  ? 'bg-indigo-900/50 text-indigo-400 shadow-sm'
                  : 'bg-indigo-100 text-indigo-600 shadow-sm'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }
            `}
          >
            📋 {t('batches.assignments')} ({assignments.length})
          </button>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('batches.students')}</h2>
              <button
                onClick={handleOpenAddStudentModal}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors text-sm"
              >
                + {t('batches.addStudent')}
              </button>
            </div>
            {batch.studentIds.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">{t('batches.noStudents')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {batch.studentIds.map((studentId: string) => {
                  // Try to find student details from available students list
                  const studentInfo = availableStudents.find(s => s.userId === studentId);
                  const displayName = studentInfo
                    ? `${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim() || studentInfo.email
                    : studentId;
                  
                  return (
                    <div
                      key={studentId}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex justify-between items-center"
                    >
                      <div>
                        <span className="text-slate-800 dark:text-slate-100 font-medium">{displayName}</span>
                        {studentInfo && studentInfo.email !== displayName && (
                          <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">({studentInfo.email})</span>
                        )}
                      </div>
                      <button
                        onClick={() => setRemoveStudentModal({ isOpen: true, studentId })}
                        className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-semibold transition-colors text-sm"
                      >
                        {t('batches.remove')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Assigned Assessments</h2>
              <button
                onClick={handleOpenAssignModal}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors text-sm"
              >
                + Assign Assessment
              </button>
            </div>

            {/* Assigned Assessments List */}
            {assignments.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">No assignments in this batch yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.assignmentId}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-5 md:p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 break-words">
                            {assignment.title}
                          </h3>
                          <span
                            className={`px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-bold whitespace-nowrap ${
                              assignment.type === 'reading'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                            }`}
                          >
                            {assignment.type === 'reading' ? 'Reading' : 'Listening'}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 break-words">
                          {assignment.prompt}
                        </p>
                      </div>
                      <button
                        onClick={() => assignment.batchAssignmentId && handleUnassign(assignment.batchAssignmentId)}
                        className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-semibold transition-colors whitespace-nowrap"
                      >
                        {t('batches.unassign')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Student Modal */}
        {showAddStudentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{t('batches.addStudent')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {t('batches.selectStudent')}
              </p>
              {(() => {
                // Filter to only show students not already in batch
                const availableForSelection = availableStudents.filter(s => !batch?.studentIds.includes(s.userId));
                
                if (availableForSelection.length === 0) {
                  return (
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                      {t('batches.noAvailableStudents')}
                    </p>
                  );
                }
                
                return (
                  <div className="mb-4">
                    <StudentSelectDropdown
                      students={availableForSelection}
                      selectedStudentId={selectedStudentId}
                      onSelect={setSelectedStudentId}
                      placeholder={t('batches.selectStudent')}
                    />
                  </div>
                );
              })()}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setSelectedStudentId('');
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg font-semibold"
                >
                  {t('batches.cancel')}
                </button>
                <button
                  onClick={handleAddStudent}
                  disabled={!selectedStudentId || availableStudents.length === 0}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('batches.add')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Batch Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteBatchModal}
          onClose={() => setDeleteBatchModal(false)}
          onConfirm={handleDelete}
          title="Delete Batch"
          message="Are you sure you want to delete this batch? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonStyle="danger"
        />

        {/* Remove Student Confirmation Modal */}
        <ConfirmationModal
          isOpen={removeStudentModal.isOpen}
          onClose={() => setRemoveStudentModal({ isOpen: false, studentId: null })}
          onConfirm={() => {
            if (removeStudentModal.studentId) {
              handleRemoveStudent(removeStudentModal.studentId);
            }
          }}
          title={t('batches.removeStudent')}
          message={t('batches.removeStudentConfirm')}
          confirmText={t('batches.remove')}
          cancelText={t('batches.cancel')}
          confirmButtonStyle="danger"
        />

        {/* Assign Assessment Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{t('batches.assignAssessment')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {t('batches.selectAssessments')}
              </p>

              {/* Tabs */}
              <div className={`
                flex gap-2 p-1 rounded-xl mb-4
                ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}
              `}>
                <button
                  onClick={() => handleAssignModalTabChange('reading')}
                  className={`
                    flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all
                    ${assignModalTab === 'reading'
                      ? theme === 'dark'
                        ? 'bg-indigo-900/50 text-indigo-400 shadow-sm'
                        : 'bg-indigo-100 text-indigo-600 shadow-sm'
                      : theme === 'dark'
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }
                  `}
                >
                  📖 {t('batches.reading')} ({assessmentBank.filter(a => a.type === 'reading').length})
                </button>
                <button
                  onClick={() => handleAssignModalTabChange('listening')}
                  className={`
                    flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all
                    ${assignModalTab === 'listening'
                      ? theme === 'dark'
                        ? 'bg-indigo-900/50 text-indigo-400 shadow-sm'
                        : 'bg-indigo-100 text-indigo-600 shadow-sm'
                      : theme === 'dark'
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }
                  `}
                >
                  🎧 {t('batches.listening')} ({assessmentBank.filter(a => a.type === 'listening').length})
                </button>
              </div>

              {/* Assessment List */}
              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {(() => {
                  const filteredByType = assessmentBank.filter(a => a.type === assignModalTab);
                  if (filteredByType.length === 0) {
                    return (
                      <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                        {t('batches.noAvailableAssessments', { type: assignModalTab === 'reading' ? t('batches.reading') : t('batches.listening') })}
                      </p>
                    );
                  }
                  return filteredByType.map((assignment) => (
                    <label
                      key={assignment.assignmentId}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAssignments.has(assignment.assignmentId)}
                        onChange={(e) => {
                          const newSet = new Set(selectedAssignments);
                          if (e.target.checked) {
                            newSet.add(assignment.assignmentId);
                          } else {
                            newSet.delete(assignment.assignmentId);
                          }
                          setSelectedAssignments(newSet);
                        }}
                        className="w-4 h-4 text-indigo-500 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-100 break-words">
                          {assignment.title}
                        </div>
                        {assignment.prompt && (
                          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {assignment.prompt}
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap flex-shrink-0 ${
                          assignment.type === 'reading'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        }`}
                      >
                        {assignment.type === 'reading' ? 'Reading' : 'Listening'}
                      </span>
                    </label>
                  ));
                })()}
              </div>

              {/* Footer Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedAssignments(new Set());
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  {t('batches.cancel')}
                </button>
                <button
                  onClick={handleAssign}
                  disabled={selectedAssignments.size === 0}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('batches.assign')} ({selectedAssignments.size})
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}