import React from 'react';

const SpeakerList = ({ speakers = [], status = 'completed' }) => {
  if (status === 'processing' || status === 'queued' || status === 'pending') {
    return (
      <div className="py-6 text-center text-xs text-[#475467] bg-[#F9FAFB] rounded-xl border border-[#E4E7EC]">
        <span className="font-mono text-[#7C3AED] font-semibold">Analysis pending...</span>
      </div>
    );
  }

  if (!speakers || speakers.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-[#475467] space-y-1 bg-[#F9FAFB] rounded-xl border border-[#E4E7EC]">
        <div className="text-[#111827] font-bold">No speakers identified in this transcript.</div>
        <p className="text-xs text-[#667085] max-w-xs mx-auto">
          The transcript does not contain explicit uppercase speaker prefixes (e.g. "NAME: Dialogue").
        </p>
      </div>
    );
  }

  const totalLines = speakers.reduce((acc, curr) => acc + (curr.lineCount || 0), 0);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-[#E4E7EC] bg-white shadow-saas">
        <table className="w-full text-left text-xs saas-table">
          <thead>
            <tr className="bg-[#F9FAFB] border-b border-[#EAECF0] text-[#475467]">
              <th className="font-bold py-2.5 px-3.5">Speaker</th>
              <th className="font-bold text-center w-28 py-2.5 px-3.5">Dialogue Lines</th>
              <th className="font-bold w-40 py-2.5 px-3.5">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAECF0]">
            {speakers.map((spk, idx) => {
              const count = spk.lineCount || 0;
              const share = totalLines > 0 ? Math.round((count / totalLines) * 100) : 0;

              return (
                <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="font-medium text-[#111827] py-2.5 px-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] flex items-center justify-center text-[10px] font-bold uppercase flex-shrink-0">
                        {spk.speaker ? spk.speaker.charAt(0) : 'U'}
                      </div>
                      <span className="font-bold text-[#111827]">{spk.speaker}</span>
                    </div>
                  </td>

                  <td className="text-center font-mono font-bold text-[#111827] tabular-nums py-2.5 px-3.5">
                    {count} {count === 1 ? 'line' : 'lines'}
                  </td>

                  <td className="py-2.5 px-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-[#F2F4F7] rounded-full h-2 overflow-hidden border border-[#E4E7EC]">
                        <div
                          className="bg-[#7C3AED] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#111827] font-mono w-9 text-right tabular-nums font-bold">
                        {share}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SpeakerList;
