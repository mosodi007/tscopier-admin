import { useNavigate } from 'react-router-dom';
import { User, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface UserLinkProps {
  userId: string;
  displayName?: string | null;
}

export function UserLink({ userId, displayName }: UserLinkProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(userId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex items-center gap-1.5 group">
      <button
        onClick={() => navigate(`/users/${userId}`)}
        className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium transition-colors"
      >
        <User className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate max-w-[160px]">
          {displayName ?? userId.slice(0, 8)}
        </span>
      </button>
      <button
        onClick={handleCopy}
        title="Copy user ID"
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        {copied ? <Check className="w-3 h-3 text-success-500" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}
