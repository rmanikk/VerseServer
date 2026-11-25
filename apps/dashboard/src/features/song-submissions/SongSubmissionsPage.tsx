import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  FileAudio,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

import { apiRequest, ApiError } from "../../lib/api";
import "./SongSubmissionsPage.css";

type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";

type SubmissionArtist = {
  id: string;
  name: string;
  slug: string;
};

type AudioAsset = {
  id: string;
  originalFilename: string;
  contentType: string;
  fileSizeBytes: string;
  status: string;
  codec?: string | null;
  bitrateKbps?: number | null;
  sampleRateHz?: number | null;
  channels?: number | null;
  durationSeconds?: number | null;
  versionLabel?: string | null;
  isDefault?: boolean;
  createdAt?: string;
};

type Song = {
  id: string;
  title: string;
  slug: string;
  status: string;
  durationSeconds?: number | null;
  releaseDate?: string | null;
  isExplicit?: boolean;
  artists: {
    role: string;
    artist: SubmissionArtist;
  }[];
  audioAssets: AudioAsset[];
  genres?: { id: string; name: string; slug: string }[];
  moods?: { id: string; name: string; slug: string }[];
};

type Submission = {
  id: string;
  songId: string;
  artistId: string;
  submittedByUserId: string;
  rightsConfirmed: boolean;
  rightsConfirmedAt?: string | null;
  rightsDeclarationVersion?: string | null;
  status: SubmissionStatus;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  artist: SubmissionArtist;
  song: Song;
  reviewedByAdmin?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type SubmissionListResponse = {
  submissions: Submission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const statuses: (SubmissionStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
];

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: string) {
  const size = Number(bytes);

  if (!Number.isFinite(size)) return "Unknown size";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds?: number | null) {
  if (!seconds || seconds < 0) return "—";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`submission-status status-${status.toLowerCase()}`}>
      <span />
      {status.replace("_", " ")}
    </span>
  );
}

export default function SongSubmissionsPage() {
  const [status, setStatus] = useState<SubmissionStatus | "ALL">("PENDING");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SubmissionListResponse | null>(null);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [notice, setNotice] = useState("");

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });

      if (status !== "ALL") {
        params.set("status", status);
      }

      const response = await apiRequest<SubmissionListResponse>(
        `/api/v1/song-submissions/admin?${params.toString()}`,
      );

      setResult(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load song submissions.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  async function openDetails(submissionId: string) {
    setSelected(null);
    setDetailLoading(true);
    setReviewNotes("");
    setReviewError("");
    setNotice("");

    try {
      const response = await apiRequest<Submission>(
        `/api/v1/song-submissions/admin/${encodeURIComponent(submissionId)}`,
      );

      setSelected(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load submission details.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function reviewSubmission(action: "APPROVE" | "REJECT") {
    if (!selected || reviewing) return;

    if (action === "REJECT" && !reviewNotes.trim()) {
      setReviewError("Please provide a reason before rejecting this submission.");
      return;
    }

    const confirmed = window.confirm(
      action === "APPROVE"
        ? `Approve "${selected.song.title}" and add it to the catalogue?`
        : `Reject "${selected.song.title}"?`,
    );

    if (!confirmed) return;

    setReviewing(true);
    setReviewError("");

    try {
      const body =
        action === "REJECT"
          ? { action, reviewNotes: reviewNotes.trim() }
          : { action };

      const response = await apiRequest<Submission>(
        `/api/v1/song-submissions/admin/${encodeURIComponent(selected.id)}/review`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
      );

      setNotice(response.message || "Submission reviewed successfully.");
      setSelected(response.data);
      setReviewNotes("");

      await loadSubmissions();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setReviewError(
          `${err.message} Refresh the list to see the latest status.`,
        );
      } else {
        setReviewError(
          err instanceof Error
            ? err.message
            : "Unable to review this submission.",
        );
      }
    } finally {
      setReviewing(false);
    }
  }

  const pagination = result?.pagination;

  return (
    <section className="submissions-page">
      <div className="submission-toolbar">
        <div className="submission-filters">
          {statuses.map((item) => (
            <button
              key={item}
              className={`filter-button ${status === item ? "selected" : ""}`}
              onClick={() => {
                setStatus(item);
                setPage(1);
                setSelected(null);
                setNotice("");
              }}
            >
              {item === "ALL" ? "All submissions" : item.replace("_", " ")}
            </button>
          ))}
        </div>

        <button
          className="submission-refresh"
          onClick={() => void loadSubmissions()}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </div>

      {notice && (
        <div className="submission-notice">
          <Check size={17} />
          {notice}
          <button
            aria-label="Dismiss message"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="submission-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => void loadSubmissions()}>Try again</button>
        </div>
      )}

      <div className="submission-summary">
        <div>
          <span className="summary-label">
            {status === "ALL" ? "Total submissions" : `${status.toLowerCase()} submissions`}
          </span>
          <strong>{pagination?.total ?? "—"}</strong>
        </div>

        <div>
          <span className="summary-label">Current page</span>
          <strong>
            {pagination ? `${pagination.page} / ${Math.max(pagination.totalPages, 1)}` : "—"}
          </strong>
        </div>
      </div>

      <div className="submission-table-wrap">
        {loading ? (
          <div className="submission-state">
            <LoaderCircle className="spin" size={26} />
            <span>Loading submissions...</span>
          </div>
        ) : result && result.submissions.length > 0 ? (
          <table className="submission-table">
            <thead>
              <tr>
                <th>Song</th>
                <th>Submitting artist</th>
                <th>Audio</th>
                <th>Submitted</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {result.submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>
                    <div className="submission-song-cell">
                      <div className="submission-song-icon">
                        <FileAudio size={18} />
                      </div>
                      <div>
                        <strong>{submission.song.title}</strong>
                        <span>
                          {formatDuration(submission.song.durationSeconds)}
                          {submission.song.isExplicit ? " · Explicit" : ""}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="submission-artist-cell">
                      <strong>{submission.artist.name}</strong>
                      <span>{submission.artist.slug}</span>
                    </div>
                  </td>

                  <td>
                    <span className="submission-audio-count">
                      {submission.song.audioAssets.length} file(s)
                    </span>
                  </td>

                  <td>
                    <span className="submission-date">
                      {formatDate(submission.createdAt)}
                    </span>
                  </td>

                  <td>
                    <StatusBadge status={submission.status} />
                  </td>

                  <td>
                    <button
                      className="submission-view-button"
                      onClick={() => void openDetails(submission.id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="submission-state">
            <FileAudio size={28} />
            <strong>No submissions found</strong>
            <span>There are no submissions matching this filter.</span>
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="submission-pagination">
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <div>
            <button
              aria-label="Previous page"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft size={18} />
            </button>

            <button
              aria-label="Next page"
              disabled={page >= pagination.totalPages || loading}
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.totalPages, current + 1),
                )
              }
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {(detailLoading || selected) && (
        <div
          className="submission-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !reviewing) {
              setSelected(null);
              setDetailLoading(false);
            }
          }}
        >
          <section
            className="submission-detail-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Song submission details"
          >
            <div className="detail-header">
              <button
                className="detail-back-button"
                onClick={() => {
                  setSelected(null);
                  setDetailLoading(false);
                }}
                disabled={reviewing}
              >
                <ArrowLeft size={18} />
                Back to submissions
              </button>

              <button
                className="detail-close-button"
                aria-label="Close details"
                onClick={() => {
                  setSelected(null);
                  setDetailLoading(false);
                }}
                disabled={reviewing}
              >
                <X size={19} />
              </button>
            </div>

            {detailLoading || !selected ? (
              <div className="submission-state detail-loading">
                <LoaderCircle size={26} className="spin" />
                <span>Loading submission details...</span>
              </div>
            ) : (
              <div className="detail-content">
                <div className="detail-title-row">
                  <div className="submission-song-icon large">
                    <FileAudio size={23} />
                  </div>
                  <div>
                    <span className="detail-eyebrow">SONG SUBMISSION</span>
                    <h3>{selected.song.title}</h3>
                    <span>{selected.artist.name}</span>
                  </div>
                </div>

                <div className="detail-status-row">
                  <StatusBadge status={selected.status} />
                  <span>Submitted {formatDate(selected.createdAt)}</span>
                </div>

                <div className="detail-section">
                  <h4>Song information</h4>
                  <div className="detail-grid">
                    <div>
                      <span>Song ID</span>
                      <strong>{selected.songId}</strong>
                    </div>
                    <div>
                      <span>Duration</span>
                      <strong>{formatDuration(selected.song.durationSeconds)}</strong>
                    </div>
                    <div>
                      <span>Release date</span>
                      <strong>
                        {selected.song.releaseDate
                          ? new Date(selected.song.releaseDate).toLocaleDateString()
                          : "Not specified"}
                      </strong>
                    </div>
                    <div>
                      <span>Explicit content</span>
                      <strong>{selected.song.isExplicit ? "Yes" : "No"}</strong>
                    </div>
                    <div>
                      <span>Song status</span>
                      <strong>{selected.song.status}</strong>
                    </div>
                    <div>
                      <span>Submitted by user ID</span>
                      <strong>{selected.submittedByUserId}</strong>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Credited artists</h4>
                  {selected.song.artists.map((credit) => (
                    <div className="detail-list-row" key={credit.artist.id}>
                      <span>{credit.artist.name}</span>
                      <small>{credit.role}</small>
                    </div>
                  ))}
                </div>

                <div className="detail-section">
                  <h4>Genres and moods</h4>
                  <div className="detail-tags">
                    {[...(selected.song.genres ?? []), ...(selected.song.moods ?? [])].length ? (
                      [...(selected.song.genres ?? []), ...(selected.song.moods ?? [])].map((item) => (
                        <span key={item.id}>{item.name}</span>
                      ))
                    ) : (
                      <span className="detail-muted">No genres or moods specified</span>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Audio assets</h4>
                  {selected.song.audioAssets.map((asset) => (
                    <div className="detail-audio-card" key={asset.id}>
                      <div className="detail-audio-icon">
                        <FileAudio size={19} />
                      </div>
                      <div className="detail-audio-info">
                        <strong>{asset.originalFilename}</strong>
                        <span>
                          {asset.contentType} · {formatFileSize(asset.fileSizeBytes)}
                        </span>
                        {asset.bitrateKbps && (
                          <span>
                            {asset.bitrateKbps} kbps
                            {asset.sampleRateHz ? ` · ${asset.sampleRateHz} Hz` : ""}
                            {asset.channels ? ` · ${asset.channels} channel(s)` : ""}
                          </span>
                        )}
                      </div>
                      <span className={`asset-status asset-${asset.status.toLowerCase()}`}>
                        {asset.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="detail-section rights-section">
                  <h4>Rights declaration</h4>
                  <div className="rights-confirmation">
                    <ShieldCheck size={19} />
                    <div>
                      <strong>
                        {selected.rightsConfirmed
                          ? "Rights declaration confirmed"
                          : "Rights declaration not confirmed"}
                      </strong>
                      <span>
                        Version: {selected.rightsDeclarationVersion || "Not available"}
                      </span>
                    </div>
                  </div>
                </div>

                {selected.status === "PENDING" ? (
                  <div className="detail-review-section">
                    <h4>Admin review</h4>
                    <label htmlFor="review-notes">
                      Review notes
                      <span>Required when rejecting</span>
                    </label>
                    <textarea
                      id="review-notes"
                      value={reviewNotes}
                      onChange={(event) => {
                        setReviewNotes(event.target.value);
                        setReviewError("");
                      }}
                      maxLength={3000}
                      placeholder="Enter feedback or a reason for rejection..."
                      rows={4}
                    />

                    {reviewError && (
                      <div className="review-error" role="alert">
                        <AlertCircle size={16} />
                        {reviewError}
                      </div>
                    )}

                    <div className="detail-review-actions">
                      <button
                        className="reject-button"
                        onClick={() => void reviewSubmission("REJECT")}
                        disabled={reviewing}
                      >
                        {reviewing ? <LoaderCircle size={16} className="spin" /> : <X size={16} />}
                        Reject
                      </button>

                      <button
                        className="approve-button"
                        onClick={() => void reviewSubmission("APPROVE")}
                        disabled={reviewing}
                      >
                        {reviewing ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}
                        Approve and publish
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="detail-section">
                    <h4>Review information</h4>
                    <div className="detail-grid">
                      <div>
                        <span>Reviewed at</span>
                        <strong>
                          {selected.reviewedAt
                            ? formatDate(selected.reviewedAt)
                            : "Not available"}
                        </strong>
                      </div>
                      <div>
                        <span>Reviewed by</span>
                        <strong>{selected.reviewedByAdmin?.name || "Not available"}</strong>
                      </div>
                    </div>
                    {selected.reviewNotes && (
                      <div className="review-notes-display">
                        <span>Review notes</span>
                        <p>{selected.reviewNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}