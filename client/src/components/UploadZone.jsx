import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, Code2, Sparkles, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SAMPLE_SCRIPTS = {
  matrix: {
    title: "The Matrix — Mainframe Extraction Scene",
    fileName: "matrix_script.txt",
    text: `INT. HEART O' THE CITY HOTEL - NIGHT

A cold, dark room. Neon signs pulse outside the cracked window.
A glowing green phosphorescent light emanates from a computer terminal.

TRINITY:
I'm inside the mainframe. They're onto us.

CYPHER:
(over comms)
I told you this was dangerous. You should have waited for Morpheus.

TRINITY:
Morpheus believes he is the One. We don't have time to hesitate.

CYPHER:
If Agent Smith catches you, there won't be anything Morpheus can do.

TRINITY:
Smith doesn't know about the backdoor in the subway system. I'm extracting the encrypted cipher keys now.

CYPHER:
Good luck, Trinity. You're going to need it.

EXT. CITY STREET - NIGHT

Rain lashes against the asphalt. Black police cruisers screech around the corner.
AGENT SMITH steps out of the lead vehicle, adjusting his dark sunglasses under the street lamp.

AGENT SMITH:
Lieutenant, your men are already dead.

LIEUTENANT:
That's impossible! We sent two squads into that hotel!

AGENT SMITH:
No, Lieutenant. Your men entered a combat zone they do not comprehend. Order your units to seal the perimeter. The anomaly must not escape.`
  },
  goodwill: {
    title: "Good Will Hunting — Psychology & Literature Scene",
    fileName: "good_will_hunting.txt",
    text: `INT. SEAN'S OFFICE - DAY

DR. SEAN MAGUIRE sits across from WILL HUNTING in Cambridge, Massachusetts.

SEAN:
You know what occurred to me yesterday? You're just a kid. You don't have the faintest idea what you're talking about.

WILL:
Why, because I haven't been to Paris? Because I haven't read Michelangelo's biography at Harvard University?

SEAN:
If I ask you about art, you'd probably give me the skinny on every art book ever written. Michelangelo, you know a lot about him. But I bet you can't tell me what it smells like in the Sistine Chapel.

WILL:
I know how the paint dries.

SEAN:
You've never actually stood there and looked up at that beautiful ceiling. If I asked you about women, you'd probably give me a syllabus on your personal favorites. But you can't tell me what it feels like to wake up next to a woman and feel truly happy.

WILL:
I appreciate the lecture, Sean.

SEAN:
I look at you; I don't see an intelligent, confident man; I see a cocky, scared kid. But you're a genius, Will. No one denies that.`
  },
  interview: {
    title: "Senior AI Engineer Technical System Architecture Interview",
    fileName: "tech_interview.txt",
    text: `INTERVIEWER:
Welcome Alex. Thanks for joining us today for the Senior AI Engineer technical discussion at Cognizant.

ALEX:
Thank you, Sarah. I'm excited to be here and discuss natural language processing architectures.

INTERVIEWER:
Great. Let's start with transformer models. How do you approach fine-tuning large language models for domain-specific entity extraction?

ALEX:
When approaching domain-specific NER, I typically begin by evaluating whether zero-shot inference with RoBERTa or spaCy transformers suffices. If the domain terminology is specialized, we curate an annotated dataset and fine-tune token classification heads with focal loss.

INTERVIEWER:
That makes sense. How do you handle latency and throughput in real-time inference microservices?

ALEX:
We leverage model quantization, ONNX runtime acceleration, and batching mechanisms in FastAPI or Triton.`
  }
};

const UploadZone = ({ onUploadSubmit, isSubmitting = false }) => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [customTitle, setCustomTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds the 5MB limit.');
        return;
      }
      setSelectedFile(file);
      if (!customTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setCustomTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  }, [customTitle]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/json': ['.json']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleClearFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  const handleLoadSample = (sampleKey) => {
    const sample = SAMPLE_SCRIPTS[sampleKey];
    if (!sample) return;

    setActiveTab('paste');
    setCustomTitle(sample.title);
    setPastedText(sample.text);
    setSelectedFile(null);
    toast.success(`Loaded "${sample.title}" preset`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (activeTab === 'upload') {
      if (!selectedFile) {
        toast.error('Please select a .txt or .json transcript file.');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      if (customTitle.trim()) {
        formData.append('title', customTitle.trim());
      }
      onUploadSubmit({ isFile: true, payload: formData });
    } else {
      if (!pastedText.trim()) {
        toast.error('Please paste raw transcript text.');
        return;
      }
      if (pastedText.trim().length < 20) {
        toast.error('Transcript is too short. Please provide at least 20 characters.');
        return;
      }

      const finalTitle = customTitle.trim() || `Pasted Transcript (${new Date().toLocaleTimeString()})`;
      onUploadSubmit({
        isFile: false,
        payload: {
          title: finalTitle,
          text: pastedText.trim()
        }
      });
    }
  };

  const pastedLinesCount = pastedText.split(/\r\n|\r|\n/).length;

  return (
    <div className="space-y-4 text-left">
      {/* Compact Preset Quick-Load Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#DCE5F2]">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#0F172A]">
          <Sparkles className="w-4 h-4 text-[#2563EB]" />
          <span>Demo Presets:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleLoadSample('matrix')}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#EFF6FF] text-xs font-bold text-[#334155] hover:text-[#2563EB] border border-[#DCE5F2] hover:border-[#BFDBFE] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Matrix Scene</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('goodwill')}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#EFF6FF] text-xs font-bold text-[#334155] hover:text-[#2563EB] border border-[#DCE5F2] hover:border-[#BFDBFE] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Good Will Hunting</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('interview')}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#EFF6FF] text-xs font-bold text-[#334155] hover:text-[#2563EB] border border-[#DCE5F2] hover:border-[#BFDBFE] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Tech Interview</span>
          </button>
        </div>
      </div>

      {/* Segmented Control Switcher */}
      <div className="flex border-b border-[#DCE5F2]">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'upload'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload File (.txt, .json)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('paste')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'paste'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Paste Raw Text</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-bold text-[#334155] mb-1.5">
            Transcript Title <span className="text-[#64748B] font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="e.g. Q3 Executive Strategy Review or Good Will Hunting Dialogue"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE5F2] hover:border-[#94A3B8] text-[#0F172A] placeholder-[#94A3B8] text-xs sm:text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
          />
        </div>

        {activeTab === 'upload' ? (
          <div>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-[#2563EB] bg-[#EFF6FF]/60'
                  : selectedFile
                  ? 'border-[#16A34A] bg-[#DCFCE7]/40'
                  : 'border-[#DCE5F2] hover:border-[#2563EB] bg-[#F8FAFC] hover:bg-[#EFF6FF]/30'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-white border border-[#DCE5F2] text-[#2563EB] flex items-center justify-center shadow-sm">
                <UploadCloud className="w-5 h-5" />
              </div>

              {selectedFile ? (
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#DCE5F2] shadow-sm">
                    <Check className="w-4 h-4 text-[#16A34A]" />
                    <span className="text-xs font-bold text-[#0F172A]">{selectedFile.name}</span>
                    <span className="text-[11px] text-[#64748B] font-mono">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="ml-1 p-0.5 text-[#94A3B8] hover:text-[#DC2626] transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Click or drag another file to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-[#0F172A]">
                    {isDragActive ? 'Drop file to upload' : 'Drag & drop transcript file here, or click to browse'}
                  </p>
                  <p className="text-xs text-[#64748B]">
                    Supports <span className="font-mono text-[#0F172A] font-bold">.txt</span> and{' '}
                    <span className="font-mono text-[#0F172A] font-bold">.json</span> files up to 5 MB
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1.5">
              Raw Transcript Text <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste dialogue with speaker labels (e.g. TRINITY: ...) or scene headings (e.g. INT. SCENE - DAY)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE5F2] hover:border-[#94A3B8] text-[#0F172A] placeholder-[#94A3B8] text-xs font-mono focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all leading-relaxed"
            />
            <div className="flex justify-between text-xs text-[#64748B] mt-1 font-mono font-bold">
              <span>{pastedLinesCount} lines</span>
              <span>{pastedText.length} characters</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || (activeTab === 'upload' && !selectedFile) || (activeTab === 'paste' && !pastedText.trim())}
          className="w-full h-11 sm:h-12 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:bg-[#CBD5E1] disabled:text-[#94A3B8] disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Transcript...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Analyze Transcript</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default UploadZone;
