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
  if (!isAdmin) return null;

  useEffect(() => {
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
          
          // Set current school
          if (currentSchoolId && fetchedSchools) {
            const current = fetchedSchools.find(s => s._id === currentSchoolId);
            setCurrentSchool(current);
          } else if (fetchedSchools.length > 0) {
            setCurrentSchool(fetchedSchools[0]);
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
  }, [currentSchoolId]);

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

  // Only hide if there are no schools after loading AND no error
  if (!loading && !error && schools.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (!loading && !error) setIsOpen(!isOpen);
        }}
        disabled={loading || error}
        className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-lg transition ${
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
          {loading ? 'Loading...' : error ? 'Error Loading' : (currentSchool?.name || 'Select School')}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !error && schools.length > 0 && (
        <div className="absolute top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
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
          </div>
        </div>
      )}
    </div>
  );
}
