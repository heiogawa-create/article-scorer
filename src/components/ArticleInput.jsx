import { useRef, useState } from 'react';
import { extractText } from '../utils/htmlParser.js';

const tabs = [
  { key: 'text', label: 'テキスト入力' },
  { key: 'html', label: 'HTMLファイル' },
  { key: 'pdf', label: 'PDFファイル' },
];

const PDF_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDF_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function DropZone({ accept, description, fileName, isLoading, onFileSelected }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    const [file] = event.dataTransfer.files;

    if (file) {
      onFileSelected(file);
    }
  }

  return (
    <div
      className={`rounded-3xl border-2 border-dashed p-8 text-center transition ${
        isDragging ? 'border-cyan-300 bg-cyan-400/10' : 'border-slate-600 bg-slate-950/50 hover:border-cyan-400/70'
      }`}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept={accept}
        onChange={(event) => {
          const [file] = event.target.files;
          if (file) {
            onFileSelected(file);
          }
          event.target.value = '';
        }}
      />
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-cyan-400/10 text-3xl">📄</div>
      <p className="text-lg font-bold text-white">ドラッグ&ドロップ、またはクリックしてアップロード</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      {fileName && <p className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm text-cyan-200">選択中: {fileName}</p>}
      <button
        className="mt-5 rounded-2xl bg-slate-100 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-200"
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
      >
        ファイルを選択
      </button>
    </div>
  );
}

function loadPdfJs() {
  if (window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${PDF_JS_URL}"]`);

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.pdfjsLib), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('pdf.jsの読み込みに失敗しました。')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = PDF_JS_URL;
    script.async = true;
    script.onload = () => resolve(window.pdfjsLib);
    script.onerror = () => reject(new Error('pdf.jsの読み込みに失敗しました。'));
    document.head.appendChild(script);
  }).then((pdfjsLib) => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
    return pdfjsLib;
  });
}

async function extractPdfText(file) {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(' '));
  }

  return pages.join('\n\n').trim();
}

export default function ArticleInput({
  article,
  inputMode,
  htmlFileName,
  htmlPreview,
  pdfFileName,
  onArticleChange,
  onInputModeChange,
  onHtmlLoaded,
  onPdfLoaded,
  onScore,
  onError,
  isLoading,
}) {
  const characterCount = article.length;
  const canScore = article.trim().length > 0 && !isLoading;

  async function handleHtmlFile(file) {
    if (!file.name.toLowerCase().endsWith('.html') && file.type !== 'text/html') {
      onError('HTMLファイル（.html）をアップロードしてください。');
      return;
    }

    try {
      const htmlString = await file.text();
      const extractedText = extractText(htmlString);

      if (!extractedText) {
        onError('HTMLのbody内から採点できるテキストを抽出できませんでした。');
        return;
      }

      onHtmlLoaded({ fileName: file.name, htmlString, extractedText });
    } catch (error) {
      onError(error.message || 'HTMLファイルの読み込みに失敗しました。');
    }
  }

  async function handlePdfFile(file) {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      onError('PDFファイル（.pdf）をアップロードしてください。');
      return;
    }

    try {
      const extractedText = await extractPdfText(file);

      if (!extractedText) {
        onError('PDFから採点できるテキストを抽出できませんでした。');
        return;
      }

      onPdfLoaded({ fileName: file.name, extractedText });
    } catch (error) {
      onError(error.message || 'PDFファイルの読み込みに失敗しました。');
    }
  }

  return (
    <section className="rounded-3xl border border-slate-700 bg-[#1e293b]/95 p-5 shadow-2xl shadow-slate-950/30 md:p-7">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-300">Article Input</p>
          <h2 className="text-2xl font-bold text-white">記事入力</h2>
        </div>
        <span className="rounded-full bg-slate-900 px-4 py-2 text-sm text-slate-300">
          {characterCount.toLocaleString()} 文字
        </span>
      </div>

      <div className="mb-5 grid gap-2 rounded-2xl bg-slate-950/60 p-2 sm:grid-cols-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
              inputMode === tab.key ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            type="button"
            onClick={() => onInputModeChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {inputMode === 'text' && (
        <textarea
          className="min-h-[30rem] w-full resize-y rounded-2xl border border-slate-600 bg-slate-950/70 p-4 leading-7 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
          rows={20}
          value={article}
          onChange={(event) => onArticleChange(event.target.value)}
          placeholder="note.com向けの長文記事をここに貼り付けてください。タイトル、見出し、本文、CTAを含めるとより正確に採点できます。"
        />
      )}

      {inputMode === 'html' && (
        <div className="space-y-5">
          <DropZone
            accept=".html,text/html"
            description="body内のテキストのみを採点に使用します。img・table・style・scriptは抽出対象から除外します。"
            fileName={htmlFileName}
            isLoading={isLoading}
            onFileSelected={handleHtmlFile}
          />
          {htmlPreview && (
            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
              <h3 className="mb-3 font-bold text-white">HTMLプレビュー</h3>
              <iframe
                className="h-[34rem] w-full rounded-xl bg-white"
                title="アップロードHTMLプレビュー"
                sandbox=""
                srcDoc={htmlPreview}
              />
            </div>
          )}
        </div>
      )}

      {inputMode === 'pdf' && (
        <div className="space-y-5">
          <DropZone
            accept=".pdf,application/pdf"
            description="pdf.js（CDN）でPDF内のテキストを抽出し、採点に使用します。修正後はプレーンテキストでダウンロードできます。"
            fileName={pdfFileName}
            isLoading={isLoading}
            onFileSelected={handlePdfFile}
          />
          {article && (
            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
              <h3 className="mb-3 font-bold text-white">抽出テキスト</h3>
              <div className="max-h-[28rem] overflow-auto whitespace-pre-wrap leading-7 text-slate-300">{article}</div>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">6項目×20点で、合計120点満点としてAIが採点します。</p>
        <button
          className="rounded-2xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={onScore}
          disabled={!canScore}
        >
          採点する
        </button>
      </div>
    </section>
  );
}
