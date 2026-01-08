import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface Student {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface StudentSelectDropdownProps {
  students: Student[];
  selectedStudentId: string;
  onSelect: (studentId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function StudentSelectDropdown({
  students,
  selectedStudentId,
  onSelect,
  placeholder = 'Select a student...',
  disabled = false,
}: StudentSelectDropdownProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter students based on search query
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim().toLowerCase();
    const email = student.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const selectedStudent = students.find((s) => s.userId === selectedStudentId);

  const getDisplayName = (student: Student) => {
    const name = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    return name || student.email;
  };

  const handleSelect = (studentId: string) => {
    onSelect(studentId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 text-left rounded-lg border transition-all
          ${disabled
            ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
            : isOpen
              ? 'bg-white dark:bg-slate-800 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20'
              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <span className={`
            text-sm font-medium
            ${selectedStudent
              ? 'text-slate-800 dark:text-slate-100'
              : 'text-slate-500 dark:text-slate-400'
            }
          `}>
            {selectedStudent ? (
              <div className="flex items-center gap-2">
                <span>{getDisplayName(selectedStudent)}</span>
                {selectedStudent.firstName || selectedStudent.lastName ? (
                  <span className="text-slate-400 dark:text-slate-500 text-xs">
                    ({selectedStudent.email})
                  </span>
                ) : null}
              </div>
            ) : (
              placeholder
            )}
          </span>
          <svg
            className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className={`
          absolute z-50 w-full mt-2 rounded-lg border shadow-lg
          bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700
          max-h-80 overflow-hidden
        `}>
          {/* Search Input */}
          <div className="p-2 border-b border-slate-200 dark:border-slate-700">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Student List */}
          <div className="overflow-y-auto max-h-64">
            {filteredStudents.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {searchQuery ? 'No students found' : 'No students available'}
                </p>
              </div>
            ) : (
              <div className="py-1">
                {filteredStudents.map((student) => {
                  const isSelected = student.userId === selectedStudentId;
                  const displayName = getDisplayName(student);
                  
                  return (
                    <button
                      key={student.userId}
                      type="button"
                      onClick={() => handleSelect(student.userId)}
                      className={`
                        w-full px-4 py-3 text-left transition-colors
                        ${isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{displayName}</div>
                          {(student.firstName || student.lastName) && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {student.email}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <svg
                            className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}