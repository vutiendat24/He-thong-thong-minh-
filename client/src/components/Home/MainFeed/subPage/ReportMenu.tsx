import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

type Props = {
  targetId: string;
  targetType?: string;
  onReported?: () => void;
};

type ReasonKey = "fake_news" | "toxic" | "violence" | "spam" | "other";

const REASONS: Record<ReasonKey, string> = {
  fake_news: "Tin giả",
  toxic: "Độc hại / Gây hại",
  violence: "Bạo lực",
  spam: "Spam / Quảng cáo",
  other: "Khác",
};

export default function ReportMenu({
  targetId,
  targetType = "post",
  onReported,
}: Props) {
  const [open, setOpen] = useState(false);
  
  const [selectedReason, setSelectedReason] = useState<ReasonKey | null>(null);
  
  const [otherText, setOtherText] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!open) return;
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleReasonChange = (k: ReasonKey) => {
    setSelectedReason(k);
    setMessage(null);
  };

  const onSubmit = async () => {
    if (!selectedReason) {
      setMessage("Vui lòng chọn một lý do báo cáo.");
      return;
    }

    const payload = {
      targetId,
      targetType,
      reasons: [selectedReason], 
      comment: selectedReason === "other" ? otherText.trim() : undefined,
      reportedAt: new Date().toISOString(),
    };

    try {
      setSending(true);
      setMessage(null);
      const res = await axios.post(`http://localhost:3000/melody/admin/report`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (res.status >= 200 && res.status < 300) {
        setMessage("Báo cáo đã gửi. Cảm ơn bạn đã phản ánh.");
        setTimeout(() => {
            setOpen(false);
            setSelectedReason(null);
            setOtherText("");
            onReported && onReported();
        }, 1000);
        
      } else {
        setMessage("Gửi báo cáo thất bại. Vui lòng thử lại sau.");
      }
    } catch (err: any) {
      console.error("Report send error:", err);
      setMessage(
        err?.response?.data?.message || "Có lỗi khi gửi báo cáo. Vui lòng thử lại."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        aria-label="Mở menu"
        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-600"
        >
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-40">
          <div
            ref={modalRef}
            className="w-80 bg-white dark:bg-neutral-900 border rounded-lg shadow-lg p-4"
          >
            <h3 className="text-lg font-semibold">Báo cáo</h3>
            <p className="text-sm text-gray-500 mb-3">Chọn lý do cho báo cáo</p>

            <div className="space-y-2">
              {(Object.keys(REASONS) as ReasonKey[]).map((k) => (
                <label
                  key={k}
                  className="flex items-center gap-2 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-neutral-800 p-1 rounded"
                >
                  <input
                    type="radio" 
                    name="reportReason" 
                    checked={selectedReason === k}
                    onChange={() => handleReasonChange(k)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{REASONS[k]}</span>
                </label>
              ))}

              {selectedReason === "other" && (
                <textarea
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="Mô tả thêm (không bắt buộc)"
                  className="w-full mt-1 p-2 border rounded-md text-sm resize-y min-h-[64px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
            </div>

            {message && (
              <div className={`mt-3 text-sm ${message.includes("thành công") || message.includes("Cảm ơn") ? "text-green-600" : "text-red-600"}`}>
                {message}
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className="px-3 py-1 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                onClick={() => setOpen(false)}
                disabled={sending}
              >
                Hủy
              </button>
              <button
                onClick={onSubmit}
                disabled={sending || !selectedReason} 
                className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? "Đang gửi..." : "Gửi báo cáo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}