# PresentationAI Local

A local-first AI document generator that creates editable PowerPoint, Word, and PDF files from a prompt.

## What it does now

- Uses Ollama for local AI planning/content when Ollama is running.
- Falls back to deterministic content generation when Ollama is offline.
- Generates advanced editable `.pptx` files using `PptxGenJS` with designed cards, charts, diagram layouts, timelines, visual panels, footers, and speaker notes.
- Generates editable `.docx` files using `python-docx`.
- Generates `.pdf` files using ReportLab.
- Serves generated files from the backend at `/files/...`.
- Provides a polished Next.js prompt studio UI.

## Recommended setup on D drive

Project location:

```powershell
D:\codexPresentation\presentationAI
```

## 1. Install and run Ollama

Install Ollama from:

```text
https://ollama.com/download
```

Then pull a model:

```powershell
ollama pull llama3.1
```

Start Ollama if it is not already running:

```powershell
ollama serve
```

Check backend Ollama status later at:

```text
http://localhost:8000/health/ollama
```

If Ollama is offline, the app still generates editable files with fallback content.

## 2. Start the backend

Open PowerShell 1:

```powershell
cd D:\codexPresentation\presentationAI\apps\api
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Backend runs at:

```text
http://localhost:8000
```

Health check:

```text
http://localhost:8000/health
```

## 3. Start the frontend

Open PowerShell 2:

```powershell
cd D:\codexPresentation\presentationAI
npm.cmd install
npm.cmd --workspace apps/web run dev
```

Frontend runs at:

```text
http://localhost:3000
```

## 4. Generate documents

Open:

```text
http://localhost:3000
```

Enter a prompt, for example:

```text
Create a 12-slide PPT on Intrusion Detection Systems using the CICIDS2017 dataset with charts, architecture diagrams, and speaker notes.
```

Click generate. You should receive download buttons for:

- PPTX
- DOCX
- PDF

Generated files are stored here:

```powershell
D:\codexPresentation\presentationAI\apps\api\generated
```

## Notes

- Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`.
- PPTX and DOCX outputs are editable.
- PDF is export/read-only by nature.
- The app does not use Gemini or Claude.
- Paid model cost is currently zero because generation is local-first.

