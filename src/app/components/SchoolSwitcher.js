'use client';

import { useState, useEffect } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export function SchoolSwitcher({ currentSchoolId, onSchoolSwitch, isAdmin = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSchool, setCurrentSchool] = useState(null);

  // Only show for admin and learning-specialist
  // Don't hide immediately if not admin - let it attempt to load first
  const shouldShow = isAdmin === true;

  useEffect(() => {
    // If not admin, don't fetch schools
    if (!shouldShow) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchAccessibleSchools = async () => {
      try {
        setLoading(true);
        setError(null);
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
          setError('User ID not found');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/school/switch', {
          headers: {
            'x-user-id': userId,
          },
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          const fetchedSchools = data.data.schools || [];
          setSchools(fetchedSchools);
          
          // Find and set current school from fetched list
          if (fetchedSchools.length > 0) {
            const schoolIdToFind = currentSchoolId || localStorage.getItem('schoolId');
            if (schoolIdToFind) {
              const current = fetchedSchools.find(s => s._id === schoolIdToFind);
              if (current) {
                setCurrentSchool(current);
              }
            }
          }
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch schools');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching schools:', err);
          setError('Failed to load schools');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAccessibleSchools();

    return () => {
      isMounted = false;
    };
  }, [shouldShow, currentSchoolId]);

  // Hide if not admin
  if (!shouldShow) {
    return null;
  }

  // Show even with no schools for admins - they might not have schools assigned yet
  // Only hide on error or while loading indefinitely

  const handleSwitchSchool = async (schoolId) => {
    try {
      const userId = localStorage.getItem('userId');
      
      const response = await fetch('/api/school/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ schoolId }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('schoolId', schoolId);
        setCurrentSchool(data.data.school);
        setIsOpen(false);
        toast.success(`Switched to ${data.data.school.name}`);
        onSchoolSwitch?.(schoolId);
        
        // Reload page to update all data
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to switch school');
      }
    } catch (err) {
      console.error('Error switching school:', err);
      toast.error('Failed to switch school');
    }
  };

  // Refetch schools when dropdown opens
  const handleOpenDropdown = async () => {
    // If closing, just toggle
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    // If opening, refetch fresh school list
    try {
      setLoading(true);
      setError(null);
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        setError('User ID not found');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/school/switch?t=${Date.now()}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedSchools = data.data.schools || [];
        console.log('Fetched schools:', fetchedSchools);
        setSchools(fetchedSchools);
        
        // Find and set current school from fetched list
        if (fetchedSchools.length > 0) {
          const schoolIdToFind = currentSchoolId || localStorage.getItem('schoolId');
          if (schoolIdToFind) {
            const current = fetchedSchools.find(s => s._id === schoolIdToFind);
            if (current) {
              setCurrentSchool(current);
            }
          }
        }
        setIsOpen(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch schools');
      }
    } catch (err) {
      console.error('Error fetching schools:', err);
      setError('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpenDropdown}
        disabled={loading || error}
        className={`flex items-center gap-2 px-1 md:px-3 py-2 bg-white border rounded-lg transition ${
          error
            ? 'border-red-300 bg-red-50 cursor-not-allowed'
            : loading
            ? 'border-gray-300 opacity-50 cursor-not-allowed'
            : 'border-gray-300 hover:bg-gray-50'
        }`}
        title={error ? `Error: ${error}` : 'Switch school'}
      >
        <Building2 className={`w-4 h-4 ${error ? 'text-red-600' : 'text-gray-600'} ${loading ? 'animate-spin' : ''}`} />
        <span className={`text-sm font-medium truncate max-w-xs ${error ? 'text-red-700' : 'text-gray-700'}`}>
          {loading ? 'Loading...' : error ? 'Error Loading' : schools.length === 0 ? 'No Schools' : (currentSchool?.name || 'Select School')}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !error && !loading && (
        <div className="absolute top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            {schools.length > 0 ? (
              <>
                <p className="text-xs font-semibold text-gray-600 px-2 py-1 mb-1">
                  Available Schools ({schools.length})
                </p>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {schools.map((school) => (
                    <button
                      key={school._id}
                      onClick={() => handleSwitchSchool(school._id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                        currentSchool?._id === school._id
                          ? 'bg-blue-100 text-blue-900'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="font-medium">{school.name}</div>
                      {school.email && (
                        <div className="text-xs text-gray-500">{school.email}</div>
                      )}
                      {school.location && (
                        <div className="text-xs text-gray-500">{school.location}</div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="px-2 py-4 text-center">
                <p className="text-sm text-gray-600">No schools assigned yet</p>
                <p className="text-xs text-gray-500 mt-1">Contact your administrator to assign schools to your account</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
