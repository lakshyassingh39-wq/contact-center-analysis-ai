import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { callsAPI } from '../services/api';
import { Upload as UploadIcon, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Upload = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [metadata, setMetadata] = useState({
    customerInfo: '',
    agentInfo: '',
    callDate: '',
    callType: 'inbound'
  });

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach((file) => {
      const error = file.errors[0];
      if (error.code === 'file-too-large') {
        toast.error(`File "${file.file.name}" is too large. Maximum size is 50MB.`);
      } else if (error.code === 'file-invalid-type') {
        toast.error(`File "${file.file.name}" is not a supported audio format.`);
      } else {
        toast.error(`Error with file "${file.file.name}": ${error.message}`);
      }
    });

    // Add accepted files
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'ready',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.wav', '.mp3', '.m4a', '.flac', '.aac']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleMetadataChange = (e) => {
    setMetadata(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(async (fileItem) => {
        const formData = new FormData();
        formData.append('audio', fileItem.file);
        formData.append('metadata', JSON.stringify(metadata));

        try {
          const response = await callsAPI.upload(formData);
          
          // Update file status
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'uploaded', callId: response.data.call.id }
              : f
          ));

          return response.data;
        } catch (error) {
          // Update file status on error
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'error', error: error.response?.data?.message || 'Upload failed' }
              : f
          ));
          throw error;
        }
      });

      const results = await Promise.allSettled(uploadPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        toast.success(`${successful} file(s) uploaded successfully!`);
        
        // If only one file was uploaded successfully, navigate to its detail page
        if (successful === 1 && files.length === 1) {
          const uploadedFile = files.find(f => f.status === 'uploaded');
          if (uploadedFile) {
            setTimeout(() => {
              navigate(`/call/${uploadedFile.callId}`);
            }, 2000);
          }
        }
      }

      if (failed > 0) {
        toast.error(`${failed} file(s) failed to upload`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getFileStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <File className="h-5 w-5 text-gray-400" />;
      case 'uploaded':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <File className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload Call Recording</h1>
        <p className="text-gray-600 mt-1">
          Upload audio files to analyze call quality and generate coaching plans
        </p>
      </div>

      {/* Upload Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Upload */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Audio Files</h2>
            
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200
                ${isDragActive 
                  ? 'border-primary-400 bg-primary-50' 
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }
              `}
            >
              <input {...getInputProps()} />
              <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-primary-600 font-medium">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 font-medium mb-2">
                    Drag & drop audio files here, or click to select files
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports: WAV, MP3, M4A, FLAC, AAC (max 50MB each)
                  </p>
                </div>
              )}
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Selected Files</h3>
                <div className="space-y-2">
                  {files.map((fileItem) => (
                    <div 
                      key={fileItem.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center flex-1">
                        {getFileStatusIcon(fileItem.status)}
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {fileItem.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(fileItem.file.size)}
                            {fileItem.status === 'error' && (
                              <span className="text-red-500 ml-2">
                                • {fileItem.error}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {fileItem.status === 'ready' && (
                        <button
                          onClick={() => removeFile(fileItem.id)}
                          className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metadata Form */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Call Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Customer Information</label>
                <input
                  type="text"
                  name="customerInfo"
                  value={metadata.customerInfo}
                  onChange={handleMetadataChange}
                  className="input-field"
                  placeholder="Customer name or ID (optional)"
                />
              </div>

              <div>
                <label className="label">Agent Information</label>
                <input
                  type="text"
                  name="agentInfo"
                  value={metadata.agentInfo}
                  onChange={handleMetadataChange}
                  className="input-field"
                  placeholder="Agent name (optional)"
                />
              </div>

              <div>
                <label className="label">Call Date</label>
                <input
                  type="datetime-local"
                  name="callDate"
                  value={metadata.callDate}
                  onChange={handleMetadataChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Call Type</label>
                <select
                  name="callType"
                  value={metadata.callType}
                  onChange={handleMetadataChange}
                  className="input-field"
                >
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              </div>
            </div>
          </div>

          {/* Upload Button */}
          <div className="mt-6">
            <button
              onClick={uploadFiles}
              disabled={files.length === 0 || uploading}
              className="w-full btn-primary flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Upload Files
                </>
              )}
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Processing Pipeline</h4>
            <div className="text-xs text-blue-600 space-y-1">
              <p>1. Audio transcription (1-2 minutes)</p>
              <p>2. Quality analysis (30-60 seconds)</p>
              <p>3. Coaching plan generation (1-2 minutes)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
