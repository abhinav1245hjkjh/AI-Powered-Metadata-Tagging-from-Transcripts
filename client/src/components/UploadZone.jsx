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
    <div className="space-y-4">
      {/* Compact Preset Quick-Load Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#475467]">
          <Sparkles className="w-4 h-4 text-[#3157D5]" />
          <span>Demo Presets:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleLoadSample('matrix')}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#F9FAFB] text-xs font-semibold text-[#344054] hover:text-[#101828] border border-[#D0D5DD] transition-colors flex items-center gap-1.5 cursor-pointer shadow-saas"
          >
            <FileText className="w-3.5 h-3.5 text-[#3157D5]" />
            <span>Matrix Scene</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('goodwill')}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#F9FAFB] text-xs font-semibold text-[#344054] hover:text-[#101828] border border-[#D0D5DD] transition-colors flex items-center gap-1.5 cursor-pointer shadow-saas"
          >
            <FileText className="w-3.5 h-3.5 text-[#3157D5]" />
            <span>Good Will Hunting</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('interview')}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#F9FAFB] text-xs font-semibold text-[#344054] hover:text-[#101828] border border-[#D0D5DD] transition-colors flex items-center gap-1.5 cursor-pointer shadow-saas"
          >
            <FileText className="w-3.5 h-3.5 text-[#3157D5]" />
            <span>Tech Interview</span>
          </button>
        </div>
      </div>

      {/* Segmented Control Switcher */}
      <div className="flex border-b border-[#E4E7EC]">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'upload'
              ? 'border-[#3157D5] text-[#3157D5]'
              : 'border-transparent text-[#475467] hover:text-[#101828]'
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
              ? 'border-[#3157D5] text-[#3157D5]'
              : 'border-transparent text-[#475467] hover:text-[#101828]'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Paste Raw Text</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-bold text-[#475467] mb-1.5">
            Transcript Title <span className="text-[#667085] font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="e.g. Q3 Executive Strategy Review or Good Will Hunting Dialogue"
            className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D0D5DD] text-[#101828] placeholder-[#667085] text-xs sm:text-sm focus:outline-none focus:border-[#3157D5] focus:ring-1 focus:ring-[#3157D5] transition-all"
          />
        </div>

        {activeTab === 'upload' ? (
          <div>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-[#3157D5] bg-[#EEF3FF]/50'
                  : selectedFile
                  ? 'border-[#067647] bg-[#ECFDF3]/40'
                  : 'border-[#D0D5DD] hover:border-[#3157D5] bg-[#F9FAFB] hover:bg-[#EEF3FF]/20'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-white border border-[#E4E7EC] text-[#3157D5] flex items-center justify-center shadow-saas">
                <UploadCloud className="w-5 h-5" />
              </div>

              {selectedFile ? (
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E4E7EC] shadow-saas">
                    <Check className="w-4 h-4 text-[#067647]" />
                    <span className="text-xs font-bold text-[#101828]">{selectedFile.name}</span>
                    <span className="text-[11px] text-[#475467] font-mono">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="ml-1 p-0.5 text-[#667085] hover:text-[#B42318] transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-[#344054]">
                    Click or drag another file to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-[#101828]">
                    {isDragActive ? 'Drop file to upload' : 'Drag & drop transcript file here, or click to browse'}
                  </p>
                  <p className="text-xs text-[#344054]">
                    Supports <span className="font-mono text-[#101828] font-bold">.txt</span> and{' '}
                    <span className="font-mono text-[#101828] font-bold">.json</span> files up to 5 MB
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-[#475467] mb-1.5">
              Raw Transcript Text <span className="text-[#B42318]">*</span>
            </label>
            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste dialogue with speaker labels (e.g. TRINITY: ...) or scene headings (e.g. INT. SCENE - DAY)..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D0D5DD] text-[#101828] placeholder-[#667085] text-xs font-mono focus:outline-none focus:border-[#3157D5] focus:ring-1 focus:ring-[#3157D5] transition-all leading-relaxed"
            />
            <div className="flex justify-between text-xs text-[#475467] mt-1 font-mono font-bold">
              <span>{pastedLinesCount} lines</span>
              <span>{pastedText.length} characters</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || (activeTab === 'upload' && !selectedFile) || (activeTab === 'paste' && !pastedText.trim())}
          className="w-full h-11 px-4 rounded-lg bg-[#3157D5] hover:bg-[#2446B8] disabled:bg-[#E4E7EC] disabled:text-[#667085] disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm transition-all shadow-saas flex items-center justify-center gap-2 cursor-pointer"
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
