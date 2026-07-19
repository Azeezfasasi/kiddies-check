'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import { uploadImageToCloudinary } from '@/app/utils/galleryApi';

const COLOR_OPTIONS = ['indigo', 'blue', 'green', 'yellow', 'pink'];

export default function CompanyOverviewManager() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('companyInfo');
  const [expandedSections, setExpandedSections] = useState({
    companyInfo: true,
    vision: false,
    mission: false,
    coreValues: false,
  });
  const [uploading, setUploading] = useState(false);

  // Form states
  const [companyInfoForm, setCompanyInfoForm] = useState({ title: '', image: '', imagePreview: '', paragraphs: [] });
  const [visionForm, setVisionForm] = useState({ title: '', description: '' });
  const [missionForm, setMissionForm] = useState({ title: '', description: '' });
  const [coreValuesForm, setCoreValuesForm] = useState([]);
  const [editingValueIdx, setEditingValueIdx] = useState(null);
  const [newValue, setNewValue] = useState({ name: '', description: '', color: 'indigo' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/company-overview');
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        setCompanyInfoForm({
          title: result.data.companyInfo.title,
          image: result.data.companyInfo.image,
          imagePreview: result.data.companyInfo.image,
          paragraphs: result.data.companyInfo.paragraphs || [],
        });
        setVisionForm({
          title: result.data.vision.title,
          description: result.data.vision.description,
        });
        setMissionForm({
          title: result.data.mission.title,
          description: result.data.mission.description,
        });
        setCoreValuesForm(result.data.coreValues || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load company overview');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImageToCloudinary(file, 'company-overview');
      setCompanyInfoForm(prev => ({
        ...prev,
        image: result.url,
        imagePreview: result.url,
      }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleAddParagraph = () => {
    setCompanyInfoForm(prev => ({
      ...prev,
      paragraphs: [...prev.paragraphs, { text: '', order: prev.paragraphs.length }],
    }));
  };

  const handleUpdateParagraph = (idx, text) => {
    setCompanyInfoForm(prev => {
      const newParagraphs = [...prev.paragraphs];
      newParagraphs[idx].text = text;
      return { ...prev, paragraphs: newParagraphs };
    });
  };

  const handleDeleteParagraph = (idx) => {
    setCompanyInfoForm(prev => ({
      ...prev,
      paragraphs: prev.paragraphs.filter((_, i) => i !== idx).map((p, i) => ({ ...p, order: i })),
    }));
  };

  const handleAddCoreValue = () => {
    if (!newValue.name || !newValue.description) {
      toast.error('Please fill in all fields');
      return;
    }

    if (editingValueIdx !== null) {
      const updatedValues = [...coreValuesForm];
      updatedValues[editingValueIdx] = { ...newValue, order: editingValueIdx };
      setCoreValuesForm(updatedValues);
      setEditingValueIdx(null);
    } else {
      setCoreValuesForm([...coreValuesForm, { ...newValue, order: coreValuesForm.length }]);
    }

    setNewValue({ name: '', description: '', color: 'indigo' });
  };

  const handleEditCoreValue = (idx) => {
    setNewValue(coreValuesForm[idx]);
    setEditingValueIdx(idx);
  };

  const handleDeleteCoreValue = (idx) => {
    setCoreValuesForm(coreValuesForm.filter((_, i) => i !== idx).map((v, i) => ({ ...v, order: i })));
  };

  const saveCompanyInfo = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/company-overview', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'companyInfo',
          data: {
            title: companyInfoForm.title,
            image: companyInfoForm.image,
            paragraphs: companyInfoForm.paragraphs,
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Company info saved successfully');
        await fetchData();
      } else {
        toast.error('Failed to save company info');
      }
    } catch (error) {
      toast.error('Failed to save company info');
    } finally {
      setSaving(false);
    }
  };

  const saveVision = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/company-overview', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'vision',
          data: visionForm,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Vision saved successfully');
        await fetchData();
      } else {
        toast.error('Failed to save vision');
      }
    } catch (error) {
      toast.error('Failed to save vision');
    } finally {
      setSaving(false);
    }
  };

  const saveMission = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/company-overview', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'mission',
          data: missionForm,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Mission saved successfully');
        await fetchData();
      } else {
        toast.error('Failed to save mission');
      }
    } catch (error) {
      toast.error('Failed to save mission');
    } finally {
      setSaving(false);
    }
  };

  const saveCoreValues = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/company-overview', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'coreValues',
          data: coreValuesForm,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Core values saved successfully');
        await fetchData();
      } else {
        toast.error('Failed to save core values');
      }
    } catch (error) {
      toast.error('Failed to save core values');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'learning-specialist']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'learning-specialist']}>
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">Company Overview Manager</h1>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['companyInfo', 'vision', 'mission', 'coreValues'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tab === 'companyInfo' && 'Company Info'}
                {tab === 'vision' && 'Vision'}
                {tab === 'mission' && 'Mission'}
                {tab === 'coreValues' && 'Core Values'}
              </button>
            ))}
          </div>

          {/* Company Info Section */}
          {activeTab === 'companyInfo' && (
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Section Title</label>
                <input
                  type="text"
                  value={companyInfoForm.title}
                  onChange={(e) => setCompanyInfoForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Section Image</label>
                <div className="space-y-3">
                  <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                    <span className="text-sm font-medium text-gray-700">
                      {uploading ? 'Uploading...' : 'Choose Image'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                  </label>
                  {companyInfoForm.imagePreview && (
                    <div className="w-40 h-40 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                      <img src={companyInfoForm.imagePreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">Paragraphs</label>
                  <button onClick={handleAddParagraph} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded text-sm font-medium hover:bg-green-100">
                    <Plus className="w-4 h-4" />
                    Add Paragraph
                  </button>
                </div>
                <div className="space-y-3">
                  {companyInfoForm.paragraphs.map((para, idx) => (
                    <div key={idx} className="flex gap-2">
                      <textarea
                        value={para.text}
                        onChange={(e) => handleUpdateParagraph(idx, e.target.value)}
                        rows="3"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={() => handleDeleteParagraph(idx)} className="text-red-600 hover:text-red-700 pt-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={saveCompanyInfo} disabled={saving} className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader className="w-4 h-4 animate-spin" />}
                Save Company Info
              </button>
            </div>
          )}

          {/* Vision Section */}
          {activeTab === 'vision' && (
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vision Title</label>
                <input
                  type="text"
                  value={visionForm.title}
                  onChange={(e) => setVisionForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vision Description</label>
                <textarea
                  value={visionForm.description}
                  onChange={(e) => setVisionForm(prev => ({ ...prev, description: e.target.value }))}
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button onClick={saveVision} disabled={saving} className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader className="w-4 h-4 animate-spin" />}
                Save Vision
              </button>
            </div>
          )}

          {/* Mission Section */}
          {activeTab === 'mission' && (
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mission Title</label>
                <input
                  type="text"
                  value={missionForm.title}
                  onChange={(e) => setMissionForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mission Description</label>
                <textarea
                  value={missionForm.description}
                  onChange={(e) => setMissionForm(prev => ({ ...prev, description: e.target.value }))}
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button onClick={saveMission} disabled={saving} className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader className="w-4 h-4 animate-spin" />}
                Save Mission
              </button>
            </div>
          )}

          {/* Core Values Section */}
          {activeTab === 'coreValues' && (
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              {/* Add/Edit Value Form */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h3 className="font-semibold text-gray-900">{editingValueIdx !== null ? 'Edit Core Value' : 'Add New Core Value'}</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={newValue.name}
                    onChange={(e) => setNewValue(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Excellence"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newValue.description}
                    onChange={(e) => setNewValue(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this value"
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewValue(prev => ({ ...prev, color }))}
                        className={`w-10 h-10 rounded-lg border-2 ${
                          newValue.color === color ? 'border-gray-900' : 'border-gray-200'
                        }`}
                        style={{
                          backgroundColor: {
                            indigo: '#4f46e5',
                            blue: '#2563eb',
                            green: '#16a34a',
                            yellow: '#ca8a04',
                            pink: '#db2777',
                          }[color],
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddCoreValue}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    {editingValueIdx !== null ? 'Update Value' : 'Add Value'}
                  </button>
                  {editingValueIdx !== null && (
                    <button
                      onClick={() => {
                        setEditingValueIdx(null);
                        setNewValue({ name: '', description: '', color: 'indigo' });
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Core Values List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Core Values ({coreValuesForm.length})</h3>
                <div className="space-y-2">
                  {coreValuesForm.map((value, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                      <div
                        className="w-8 h-8 rounded-lg flex-shrink-0"
                        style={{
                          backgroundColor: {
                            indigo: '#4f46e5',
                            blue: '#2563eb',
                            green: '#16a34a',
                            yellow: '#ca8a04',
                            pink: '#db2777',
                          }[value.color],
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{value.name}</p>
                        <p className="text-sm text-gray-600">{value.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditCoreValue(idx)} className="text-blue-600 hover:text-blue-700">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteCoreValue(idx)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={saveCoreValues} disabled={saving} className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader className="w-4 h-4 animate-spin" />}
                Save Core Values
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
