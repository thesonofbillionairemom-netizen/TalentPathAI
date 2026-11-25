import { useState, type ChangeEvent } from 'react';
import {
  AlertTriangle,
  Eye,
  FileText,
  FolderUp,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import type { DocumentRecord, EvidenceSummary } from '../types';
import { apiRequest, fetchProtectedDocumentBlob, uploadDocumentWithProgress } from '../lib/api';
import { CompletenessRing } from '../components/MotionPrimitives';
import { TrustBadge } from '../components/TrustBadge';

interface DocumentsPageProps {
  documents: DocumentRecord[];
  evidence: EvidenceSummary;
  onRefresh: () => Promise<void>;
}

const CATEGORIES: Array<{ value: DocumentRecord['category']; label: string }> = [
  { value: 'cv', label: 'Curriculum Vitae (CV)' },
  { value: 'academic_certificate', label: 'Academic Certificate / Transcript' },
  { value: 'professional_certificate', label: 'Professional Certificate' },
  { value: 'reference_letter', label: 'Reference Letter' },
  { value: 'employment_record', label: 'Employment Record / Contract' },
  { value: 'work_sample', label: 'Work Sample / Portfolio File' },
  { value: 'training_certificate', label: 'Training Certificate' },
  { value: 'other', label: 'Other Supporting Evidence' },
];

export function DocumentsPage({ documents, evidence, onRefresh }: DocumentsPageProps) {
  const [category, setCategory] = useState<DocumentRecord['category']>('cv');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const [previewDoc, setPreviewDoc] = useState<{
    name: string;
    mimeType: string;
    url: string;
    textContent?: string;
  } | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    setNotice(null);

    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds the 10 MB size limit.');
      return;
    }

    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.type)) {
      setError('Unsupported file format. Please upload PDF, PNG, JPG, TXT, or DOCX.');
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const res = (await uploadDocumentWithProgress(file, category, setProgress)) as {
        analysisMode?: string;
        demoNotice?: string;
      };
      await onRefresh();
      setNotice(
        res.demoNotice ||
          `Document "${file.name}" saved privately and analyzed (${res.analysisMode === 'gemini' ? 'Gemini AI' : 'Demo Mode'}).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handlePreview = async (doc: DocumentRecord) => {
    setError(null);
    try {
      const blob = await fetchProtectedDocumentBlob(doc.id);
      if (blob.mimeType.startsWith('text/')) {
        const text = await (await fetch(blob.url)).text();
        setPreviewDoc({ name: doc.original_name, mimeType: blob.mimeType, url: blob.url, textContent: text });
      } else {
        setPreviewDoc({ name: doc.original_name, mimeType: blob.mimeType, url: blob.url });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open protected document.');
    }
  };

  const closePreview = () => {
    if (previewDoc?.url) {
      URL.revokeObjectURL(previewDoc.url);
    }
    setPreviewDoc(null);
  };

  const handleReanalyze = async (id: string) => {
    setAnalyzingId(id);
    setError(null);
    try {
      const res = await apiRequest<{ demoNotice?: string }>(`/api/documents/${id}/analyze`, { method: 'POST' });
      await onRefresh();
      if (res.demoNotice) setNotice(res.demoNotice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Re-analysis failed.');
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
            Document &amp; Evidence Centre
          </h1>
          <p className="mt-1 text-sm text-[#475569]">
            Files are stored in private server storage accessible only to your account. Automated extraction never equals official verification.
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-[#0FB5AE]/30 bg-[#0FB5AE]/10 px-4 py-3 text-sm text-[#0B1F3A]">
          {notice}
        </div>
      )}

      {/* Evidence Strength + Upload Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center gap-5">
            <CompletenessRing score={evidence.score} label="Evidence" color="#7C5CFC" />
            <div>
              <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Evidence Strength</h2>
              <p className="mt-1 text-xs text-[#475569]">
                {documents.length} stored document(s) across {evidence.categoriesPresent.length} category(ies).
              </p>
            </div>
          </div>

          {evidence.missingCategories.length > 0 ? (
            <div className="rounded-xl border border-[#F5A524]/40 bg-[#F5A524]/10 p-4 text-xs text-[#0B1F3A]">
              <div className="flex items-center gap-2 font-semibold text-[#B45309]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Missing Recommended Evidence</span>
              </div>
              <p className="mt-1.5 text-[#475569] leading-relaxed">
                Consider uploading or substituting via RPL: {evidence.missingCategories.map((c) => c.replace(/_/g, ' ')).join(', ')}.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 p-4 text-xs text-[#15803D]">
              Core supporting evidence categories are present. Ready for recognition checklist preparation.
            </div>
          )}
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Upload New Supporting Document</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="doc-category" className="block text-xs font-semibold text-[#0B1F3A]">
                Document Category
              </label>
              <select
                id="doc-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentRecord['category'])}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-semibold text-[#0B1F3A]">Allowed Files (Max 10 MB)</span>
              <p className="mt-2 text-xs text-[#475569]">PDF, PNG, JPG, TXT, DOCX</p>
            </div>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-[#F6F9FC] p-6 text-center hover:border-[#0FB5AE] transition-colors">
            <FolderUp className="h-8 w-8 text-[#0FB5AE]" />
            <span className="mt-2 text-sm font-semibold text-[#0B1F3A]">
              {uploading ? `Uploading... ${progress}%` : 'Choose file to upload privately'}
            </span>
            <span className="mt-1 text-xs text-[#475569]">
              Stored privately under your user ID with automated skill extraction
            </span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.txt,.docx"
              disabled={uploading}
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {uploading && (
            <div className="space-y-1.5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full bg-[#0FB5AE] transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="font-mono-tabular text-right text-xs text-[#475569]">{progress}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Your Stored Documents</h2>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#475569]">
            <ShieldAlert className="h-4 w-4 text-[#7C5CFC]" />
            <span>AI extraction is informational only</span>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-[#475569]">
            No documents uploaded yet. Start by uploading your CV, training certificate, or a reference letter above.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {documents.map((doc) => {
              const extractedSkills = JSON.parse(doc.extracted_skills_json || '[]') as string[];
              const gaps = JSON.parse(doc.evidence_gaps_json || '[]') as string[];
              return (
                <div key={doc.id} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <FileText className="h-4 w-4 text-[#0FB5AE] shrink-0" />
                        <h3 className="font-display text-base font-bold text-[#0B1F3A] truncate">
                          {doc.original_name}
                        </h3>
                        {doc.is_demo === 1 && <TrustBadge variant="demo_data" label="SAMPLE DATA" />}
                        <TrustBadge variant="extracted" label={doc.status} />
                      </div>
                      <p className="text-xs text-[#475569] capitalize">
                        Category: {doc.category.replace(/_/g, ' ')} · {(doc.file_size / 1024).toFixed(1)} KB
                      </p>
                      <p className="text-sm leading-relaxed text-[#0B1F3A]">{doc.extracted_summary}</p>
                      {extractedSkills.length > 0 && (
                        <p className="text-xs text-[#475569]">
                          <strong className="text-[#0B1F3A]">Extracted skills:</strong> {extractedSkills.join(' · ')}
                        </p>
                      )}
                      {gaps.length > 0 && (
                        <p className="text-xs text-[#B45309]">
                          <strong>Gap note:</strong> {gaps.join(' ')}
                        </p>
                      )}
                      {doc.confidence_note && (
                        <p className="text-[11px] text-[#475569]">{doc.confidence_note}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePreview(doc)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-[#0B1F3A] hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        disabled={analyzingId === doc.id}
                        onClick={() => handleReanalyze(doc.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-[#0B1F3A] hover:bg-slate-50 disabled:opacity-60"
                      >
                        {analyzingId === doc.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        <span>Re-analyze</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await apiRequest(`/api/documents/${doc.id}`, { method: 'DELETE' });
                          await onRefresh();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F3A]/70 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <p className="font-display text-base font-bold text-[#0B1F3A] truncate">{previewDoc.name}</p>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Close document preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto p-6 bg-[#F6F9FC]">
              {previewDoc.textContent !== undefined ? (
                <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-5 text-xs leading-relaxed text-[#0B1F3A] font-mono">
                  {previewDoc.textContent}
                </pre>
              ) : previewDoc.mimeType.startsWith('image/') ? (
                <img src={previewDoc.url} alt={previewDoc.name} className="mx-auto max-h-[65vh] rounded-xl" />
              ) : previewDoc.mimeType === 'application/pdf' ? (
                <iframe src={previewDoc.url} title={previewDoc.name} className="h-[65vh] w-full rounded-xl border" />
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-[#475569]">Preview is not rendered inline for this file format.</p>
                  <a
                    href={previewDoc.url}
                    download={previewDoc.name}
                    className="mt-3 inline-block rounded-xl bg-[#0FB5AE] px-4 py-2 text-sm font-semibold text-[#0B1F3A]"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
