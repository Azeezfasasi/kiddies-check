"use client";

import { useState, useEffect } from "react";
import { X, Loader, Upload, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function StudentModal({ studentData, schoolId, userId, classes, onClose, onSave }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    enrollmentNo: "",
    gender: "male",
    class: "",
    phone: "",
    dateOfBirth: "",
    schoolType: "",
    picture: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [picturePreview, setPicturePreview] = useState("");

  useEffect(() => {
    if (studentData) {
      const schoolType = studentData.schoolType || studentData.school?.schoolType || "";
      const picture = studentData.picture || studentData.profilePicture || "";
      
      setFormData({
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        email: studentData.email || "",
        enrollmentNo: studentData.enrollmentNo || "",
        gender: studentData.gender || "male",
        class: studentData.class?._id || "",
        phone: studentData.phone || "",
        dateOfBirth: studentData.dateOfBirth ? studentData.dateOfBirth.split("T")[0] : "",
        schoolType: schoolType,
        picture: picture,
      });
      
      // Set picture preview
      if (picture) {
        setPicturePreview(picture);
      }
    }
  }, [studentData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingPicture(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileData = event.target?.result;

        // Upload to Cloudinary
        const response = await fetch("/api/cloudinary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData,
            folderName: "rayob/students",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || "Upload failed");
        }

        setFormData((prev) => ({
          ...prev,
          picture: data.url,
        }));
        setPicturePreview(data.url);
        toast.success("Picture uploaded successfully");
      };

      reader.onerror = () => {
        toast.error("Failed to read file");
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Picture upload error:", error);
      toast.error(error.message || "Failed to upload picture");
    } finally {
      setUploadingPicture(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("First and last name are required");
      return;
    }

    if (!formData.class) {
      toast.error("Please select a class");
      return;
    }

    setLoading(true);
    try {
      const url = studentData
        ? `/api/teacher/students/${studentData._id}?schoolId=${schoolId}`
        : `/api/teacher/students`;

      const method = studentData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          schoolId,
          classId: formData.class,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          enrollmentNo: formData.enrollmentNo,
          gender: formData.gender,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth || undefined,
          class: formData.class,
          schoolType: formData.schoolType,
          picture: formData.picture || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save student");
      }

      toast.success(studentData ? "Student updated successfully" : "Student created successfully");
      onSave();
    } catch (error) {
      console.error("Error saving student:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[450px] md:max-h-[550px] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">
            {studentData ? "Edit Student" : "Add New Student"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Picture Upload Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Student Picture</label>
            <div className="flex gap-3 items-start">
              {/* Preview */}
              <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {picturePreview ? (
                  <img src={picturePreview} alt="Preview" className="w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { e.target.src = ""; e.target.parentNode.innerHTML = `<div class='w-8 h-8 text-gray-400'></div>`; }} />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>

              {/* Upload Input */}
              <div className="flex-1 min-w-0">
                <input
                  type="file"
                  id="picture-input"
                  accept="image/*"
                  onChange={handlePictureChange}
                  disabled={uploadingPicture}
                  className="hidden"
                />
                <label
                  htmlFor="picture-input"
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {uploadingPicture ? "Uploading..." : "Choose Image"}
                  </span>
                </label>
                {picturePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, picture: "" }));
                      setPicturePreview("");
                      toast.success("Picture removed");
                    }}
                    className="text-xs text-red-600 hover:text-red-800 mt-1 block"
                  >
                    Remove
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-1">Max 5MB • JPG, PNG, GIF</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            {/* school type */}
            <label className="block text-sm font-semibold text-gray-700 mb-2">School Type</label>
            <select
              name="schoolType"
              value={formData.schoolType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select school type</option>
              <option value="my-childs-school">My Child's School</option>
              <option value="home-school">Home School</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Class *
            </label>
            <select
              name="class"
              value={formData.class}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="student@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 234 567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Enrollment No.</label>
              <input
                type="text"
                name="enrollmentNo"
                value={formData.enrollmentNo}
                disabled
                placeholder="Auto-generated"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
              />
              <span className="text-xs text-blue-600">
                Auto-generated
              </span>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {studentData ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
