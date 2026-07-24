import React, { useState } from "react";
import { FiUploadCloud, FiFileText, FiCheck, FiX } from "react-icons/fi";
import { uploadVendorDigitalFile, uploadVendorImage } from "../../services/vendorService";
import toast from "react-hot-toast";

export default function StepDigitalUpload({ formData, onChange }) {
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingPreview, setIsUploadingPreview] = useState(false);

  const digitalConfig = formData.digitalConfig || {};

  const updateConfig = (updates) => {
    onChange({
      digitalConfig: {
        ...digitalConfig,
        ...updates
      }
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const response = await uploadVendorDigitalFile(file);
      const data = response.data || response;
      if (data?.url) {
        const sizeInMb = (file.size / (1024 * 1024)).toFixed(2) + " MB";
        const fileExt = file.name.split(".").pop().toUpperCase();
        
        updateConfig({
          digitalFile: data.url,
          fileSize: sizeInMb,
          fileType: fileExt
        });
        toast.success("Digital file uploaded successfully");
      } else {
        toast.error("Upload failed: No URL returned");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload digital file");
    } finally {
      setIsUploadingFile(false);
      e.target.value = "";
    }
  };

  const handlePreviewUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPreview(true);
    try {
      const response = await uploadVendorImage(file, "vendors/products/digital/previews");
      const data = response.data || response;
      if (data?.url) {
        updateConfig({ previewFile: data.url });
        toast.success("Preview asset uploaded successfully");
      } else {
        toast.error("Upload failed: No URL returned");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload preview asset");
    } finally {
      setIsUploadingPreview(false);
      e.target.value = "";
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Upload Digital Assets</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Configure digital product files, preview displays, and download usage rules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Digital Product File Selection */}
        <div className="border border-dashed border-gray-200 hover:border-primary-400 p-6 rounded-2xl bg-gray-50/50 flex flex-col items-center justify-center text-center transition-colors">
          <FiUploadCloud className="w-10 h-10 text-gray-400 mb-3" />
          <h3 className="text-sm font-bold text-gray-800">Primary Product Asset</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
            Upload PDF, ZIP, SVG, MP3, MP4, EPUB files (Max 50MB)
          </p>

          <input
            type="file"
            id="digital-product-file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploadingFile}
          />

          <label
            htmlFor="digital-product-file"
            className={`mt-4 px-4 py-2 bg-primary-600 text-white font-bold rounded-xl text-xs hover:bg-primary-700 transition-colors shadow-sm cursor-pointer ${
              isUploadingFile ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {isUploadingFile ? "Uploading File..." : "Select File *"}
          </label>

          {digitalConfig.digitalFile && (
            <div className="mt-4 flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg max-w-xs">
              <FiFileText className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div className="text-left text-[11px] leading-tight">
                <p className="font-bold text-green-800 truncate">Asset Ready</p>
                <p className="text-gray-400 font-medium mt-0.5">
                  Size: {digitalConfig.fileSize} | Type: {digitalConfig.fileType}
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateConfig({ digitalFile: "", fileSize: "", fileType: "" })}
                className="text-red-500 hover:text-red-600 ml-auto"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Preview File Selection */}
        <div className="border border-dashed border-gray-200 hover:border-purple-400 p-6 rounded-2xl bg-gray-50/50 flex flex-col items-center justify-center text-center transition-colors">
          <FiUploadCloud className="w-10 h-10 text-gray-400 mb-3" />
          <h3 className="text-sm font-bold text-gray-800">Preview Asset (Watermarked / Demo File)</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
            Upload sample image/mockup to showcase to clients (Max 5MB)
          </p>

          <input
            type="file"
            id="digital-preview-file"
            className="hidden"
            onChange={handlePreviewUpload}
            disabled={isUploadingPreview}
            accept="image/*, image/avif, .avif"
          />

          <label
            htmlFor="digital-preview-file"
            className={`mt-4 px-4 py-2 bg-purple-600 text-white font-bold rounded-xl text-xs hover:bg-purple-700 transition-colors shadow-sm cursor-pointer ${
              isUploadingPreview ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {isUploadingPreview ? "Uploading Preview..." : "Select Preview *"}
          </label>

          {digitalConfig.previewFile && (
            <div className="mt-4 flex items-center gap-2 p-1.5 bg-green-50 border border-green-200 rounded-lg">
              <img
                src={digitalConfig.previewFile}
                alt="preview"
                className="w-10 h-10 rounded object-cover border"
              />
              <span className="text-[11px] font-bold text-green-800">Preview Ready</span>
              <button
                type="button"
                onClick={() => updateConfig({ previewFile: "" })}
                className="text-red-500 hover:text-red-600 ml-auto"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Metadata Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
        {/* License Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            License Type *
          </label>
          <select
            value={digitalConfig.license || "personal"}
            onChange={e => updateConfig({ license: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700 font-semibold"
          >
            <option value="personal">Personal Use Only</option>
            <option value="commercial">Standard Commercial</option>
            <option value="extended">Extended Commercial / Resell</option>
            <option value="public_domain">Public Domain / CC0</option>
          </select>
        </div>

        {/* Download Limit */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Download Limit per Purchase
          </label>
          <input
            type="number"
            min="1"
            value={digitalConfig.downloadLimit || ""}
            onChange={e => updateConfig({ downloadLimit: e.target.value === "" ? "" : Number(e.target.value) })}
            placeholder="Unlimited downloads"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>

        {/* Version */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Release Version
          </label>
          <input
            type="text"
            value={digitalConfig.version || "1.0.0"}
            onChange={e => updateConfig({ version: e.target.value })}
            placeholder="e.g. 1.0.0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
