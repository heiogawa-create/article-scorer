import { useRef, useState } from 'react';
import { extractText } from '../utils/htmlParser.js';

export default function FileUpload({ onTextExtracted, onHtmlLoaded, activeTab, setActiveTab }) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [pdfText, setPdfText] = useState('');
  const htmlFileRef = useRef(null);
  const pdfFileRef = useRef(null);

  function handleHtmlFile(file) {
    if (!file || !file.name.endsWith('.html')) {
      alert('.htmlファイルを選択してください');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const htmlString = e.target.result;
      const text = extractText(htmlString);
      onTextExtracted(text);
      onHtmlLoaded(htmlString);
      const blob = new Blob([htmlString], { type: 'text/html' });
      setPreviewUrl(URL.createObjectURL(blob));
    };
    reader.readAsText(file, 'utf-8');
  }

  async function handlePdfFile(file) {
    if (!file || file.type !== 'application/pdf') {
      alert('.pdfファイルを選択してください');
      return;
    }
    setFileName(file.name);
    try {
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      if (!pdfjsLib) {
        alert('pdf.jsの読み込みに失敗しました。ページをリロードしてください。');
        return;
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      setPdfText(fullText);
      onTextExtracted(fullText);
    } catch (err) {
      alert('PDFの読み込みに失敗しました: ' + err.message);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (activeTab === 'html') handleHtmlFile(file);
    if (activeTab === 'pdf') handlePdfFile(file);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[
          { id: 'html', label: '📄 HTMLファイル' },
          { id: 'pdf', label: '📑 PDFファイル' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setFileName('');
              setPreviewUrl('');
              setPdfText('');
            }}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (activeTab === 'html') htmlFileRef.current?.click();
          if (activeTab === 'pdf') pdfFileRef.current?.click();
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
          isDragging
            ? 'border-cyan-400 bg-cyan-400/10'
            : 'border-slate-600 hover:border-slate-400 hover:bg-slate-800/50'
        }`}
      >
        <div className="text-4xl mb-3">{activeTab === 'html' ? '📄' : '📑'}</div>
        {fileName ? (
          <p className="font-bold text-cyan-300">{fileName} を読み込みました</p>
        ) : (
          <>
            <p className="font-bold text-slate-200">
              {activeTab === 'html' ? 'HTMLファイル' : 'PDFファイル'}をドロップ
            </p>
            <p className="mt-1 text-sm text-slate-400">またはクリックして選択</p>
          </>
        )}
        <input
          ref={htmlFileRef}
          type="file"
          accept=".html"
          className="hidden"
          onChange={(e) => handleHtmlFile(e.target.files[0])}
        />
        <input
          ref={pdfFileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handlePdfFile(e.target.files[0])}
        />
      </div>

      {activeTab === 'html' && previewUrl && (
        <div className="rounded-2xl border border-slate-700 overflow-hidden">
          <p className="px-4 py-2 text-xs text-slate-400 bg-slate-800">プレビュー</p>
          <iframe
            src={previewUrl}
            className="w-full h-96 bg-white"
            title="HTMLプレビュー"
          />
        </div>
      )}

      {activeTab === 'pdf' && pdfText && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 max-h-48 overflow-y-auto">
          <p className="text-xs text-slate-400 mb-2">抽出テキスト（先頭500文字）</p>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{pdfText.slice(0, 500)}...</p>
        </div>
      )}
    </div>
  );
}
