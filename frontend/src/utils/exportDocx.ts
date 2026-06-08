import type { Project } from '../types';

function potentialColor(p: string) {
  return p === 'alto' ? '#16a34a' : p === 'medio' ? '#d97706' : '#dc2626';
}
function verdictColor(v: string) {
  return v === 'verde' ? '#16a34a' : v === 'amarillo' ? '#d97706' : '#dc2626';
}
function verdictLabel(v: string) {
  return v === 'verde' ? 'OPORTUNIDAD ALTA' : v === 'amarillo' ? 'OPORTUNIDAD MEDIA' : 'RIESGO ALTO';
}

export async function exportToDocx(p: Project): Promise<void> {
  const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  const inv = p.investigacion;
  const idea = p.ideaElegida;
  const a = p.assets;
  const m = p.monetizacion;

  const h2 = (text: string) =>
    `<h2 style="font-family:Calibri,sans-serif;font-size:16pt;color:#3730a3;font-weight:bold;margin:24pt 0 6pt;border-bottom:2px solid #6366f1;padding-bottom:4pt">${text}</h2>`;

  const h3 = (text: string) =>
    `<h3 style="font-family:Calibri,sans-serif;font-size:12pt;color:#1e293b;font-weight:bold;margin:12pt 0 4pt">${text}</h3>`;

  const p_style = 'font-family:Calibri,sans-serif;font-size:11pt;color:#334155;line-height:1.6;margin:6pt 0';

  const table = (headers: string[], rows: string[][], accent = '#6366f1') =>
    `<table style="border-collapse:collapse;width:100%;margin:8pt 0 16pt">
      <thead><tr>${headers.map((h) => `<th style="background:${accent};color:#fff;padding:6pt 8pt;font-family:Calibri,sans-serif;font-size:10pt;font-weight:bold;text-align:left">${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((row, i) => `<tr>${row.map((cell) => `<td style="padding:5pt 8pt;font-family:Calibri,sans-serif;font-size:10pt;border-bottom:1px solid #e2e8f0;background:${i % 2 === 0 ? '#f8fafc' : '#fff'}">${cell}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;

  const metricRow = (cards: { label: string; value: string }[]) =>
    `<table style="border-collapse:separate;border-spacing:8pt 0;width:100%;margin:8pt 0 16pt">
      <tr>${cards.map((c) => `<td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10pt 8pt;text-align:center;width:${Math.floor(100 / cards.length)}%">
        <div style="font-family:Calibri,sans-serif;font-size:8pt;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4pt">${c.label}</div>
        <div style="font-family:Calibri,sans-serif;font-size:16pt;font-weight:bold;color:#6366f1">${c.value}</div>
      </td>`).join('')}</tr>
    </table>`;

  let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='UTF-8'>
<meta name=ProgId content=Word.Document>
<meta name=Generator content='Microsoft Word 15'>
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml>
<![endif]-->
<style>
  @page { size: A4 portrait; margin: 2.5cm 2.8cm; }
  body { font-family: Calibri, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.6; }
  h1 { font-family: Calibri, sans-serif; font-size: 26pt; color: #1e1b4b; font-weight: 800; margin: 0 0 6pt; }
  h2 { font-family: Calibri, sans-serif; font-size: 16pt; color: #3730a3; font-weight: bold; margin: 24pt 0 6pt; }
  h3 { font-family: Calibri, sans-serif; font-size: 12pt; color: #1e293b; font-weight: bold; margin: 14pt 0 4pt; }
  p { font-family: Calibri, sans-serif; font-size: 11pt; color: #334155; margin: 4pt 0 8pt; line-height: 1.6; }
  table { border-collapse: collapse; width: 100%; }
  th { background: #6366f1; color: #fff; padding: 6pt 8pt; font-size: 10pt; font-weight: bold; }
  td { padding: 5pt 8pt; font-size: 10pt; border-bottom: 1px solid #e2e8f0; }
  li { font-family: Calibri, sans-serif; font-size: 11pt; color: #334155; margin: 2pt 0; }
</style>
</head>
<body>

<!-- PORTADA -->
<div style="background:#6366f1;padding:32pt 36pt;border-radius:12px;margin-bottom:28pt;page-break-after:avoid">
  <p style="color:rgba(255,255,255,.7);font-size:9pt;margin:0 0 6pt;letter-spacing:.1em;text-transform:uppercase">Mini MX YouTube · Estudio de Nichos Virales</p>
  <h1 style="color:#fff;font-size:26pt;font-weight:800;margin:0 0 8pt">${p.nombre}</h1>
  <p style="color:rgba(255,255,255,.9);font-size:13pt;margin:0 0 4pt"><strong>Nicho:</strong> ${p.nicho || 'Sin definir'}${p.nichoPersonalizado ? ` · ${p.nichoPersonalizado}` : ''}</p>
  <p style="color:rgba(255,255,255,.65);font-size:10pt;margin:0 0 16pt">Generado el ${fecha}</p>
  <p style="margin:0;font-size:10pt;color:#fff">
    ${inv ? '<span style="background:rgba(255,255,255,.2);padding:2pt 8pt;border-radius:4px;margin-right:6pt">✓ Investigación</span>' : ''}
    ${idea ? '<span style="background:rgba(255,255,255,.2);padding:2pt 8pt;border-radius:4px;margin-right:6pt">✓ Idea elegida</span>' : ''}
    ${a ? '<span style="background:rgba(255,255,255,.2);padding:2pt 8pt;border-radius:4px;margin-right:6pt">✓ Activos</span>' : ''}
    ${m ? '<span style="background:rgba(255,255,255,.2);padding:2pt 8pt;border-radius:4px">✓ Monetización</span>' : ''}
  </p>
</div>`;

  // INVESTIGACIÓN
  if (inv) {
    html += h2('Investigación de Nicho');
    html += `<div style="background:${verdictColor(inv.veredicto)};color:#fff;padding:12pt 14pt;border-radius:8px;margin-bottom:14pt">
      <p style="font-size:13pt;font-weight:bold;color:#fff;margin:0 0 3pt">${verdictLabel(inv.veredicto)}</p>
      <p style="color:rgba(255,255,255,.9);font-size:10pt;margin:0">${inv.explicacionVeredicto || ''}</p>
    </div>`;

    if (inv.metricas) {
      html += metricRow([
        { label: 'Vistas promedio', value: inv.metricas.vistasPromedio?.toLocaleString('es-ES') || '—' },
        { label: 'VPH promedio', value: inv.metricas.vphPromedio?.toLocaleString('es-ES') || '—' },
        { label: 'Frecuencia', value: inv.metricas.frecuenciaPublicacion || '—' },
        { label: 'Duración media', value: inv.metricas.duracionPromedio || '—' },
      ]);
    }

    html += h3('Resumen del análisis');
    html += `<p style="${p_style}">${inv.resumen || ''}</p>`;

    if (inv.subNichos?.length) {
      html += h3('Sub-nichos detectados');
      html += `<ul>${inv.subNichos.slice(0, 8).map((s) => `<li>${s}</li>`).join('')}</ul>`;
    }
    if (inv.angulos?.length) {
      html += h3('Ángulos de contenido');
      html += `<ul>${inv.angulos.slice(0, 6).map((a) => `<li>${a}</li>`).join('')}</ul>`;
    }

    if (inv.topVideos?.length) {
      html += h3('Top Videos de Referencia');
      html += table(
        ['#', 'Título', 'Canal', 'Vistas', 'VPH'],
        inv.topVideos.slice(0, 6).map((v, i) => [
          `<strong>${i + 1}</strong>`,
          v.title.slice(0, 65),
          v.channelTitle || '—',
          `<strong>${v.views?.toLocaleString('es-ES') || '—'}</strong>`,
          v.vph ? `${v.vph.toFixed(0)}` : '—',
        ])
      );
    }
  }

  // IDEA ELEGIDA
  if (idea) {
    html += h2('Idea de Video Elegida');
    html += `<div style="background:#eef2ff;border:1.5px solid #c7d2fe;border-radius:10px;padding:14pt 16pt;margin-bottom:16pt">
      <p style="font-size:14pt;font-weight:bold;color:#3730a3;margin:0 0 8pt">${idea.titulo}</p>
      ${idea.hook ? `<p style="font-style:italic;color:#7c3aed;font-size:11pt;margin:0 0 8pt">"${idea.hook}"</p>` : ''}
      ${idea.angulo ? `<p style="margin:0 0 4pt"><strong>Ángulo:</strong> ${idea.angulo}</p>` : ''}
      ${idea.porQueViral ? `<p style="margin:0 0 4pt"><strong>Por qué viral:</strong> ${idea.porQueViral}</p>` : ''}
      ${idea.promesaValor ? `<p style="margin:0"><strong>Promesa de valor:</strong> ${idea.promesaValor}</p>` : ''}
    </div>`;
    if (idea.estructuraSugerida?.length) {
      html += h3('Estructura sugerida');
      html += `<ul>${idea.estructuraSugerida.map((s) => `<li>${s}</li>`).join('')}</ul>`;
    }
  }

  // ACTIVOS
  if (a) {
    html += h2('Activos del Video');

    if (a.titulos?.length) {
      html += h3('Títulos de Alto CTR');
      a.titulos.slice(0, 5).forEach((t, i) => {
        html += `<div style="background:${i === 0 ? '#eef2ff' : '#f8fafc'};border:1px solid ${i === 0 ? '#c7d2fe' : '#e2e8f0'};border-radius:8px;padding:8pt 12pt;margin-bottom:6pt;display:flex;gap:10pt;align-items:flex-start">
          <span style="background:${i === 0 ? '#6366f1' : '#e2e8f0'};color:${i === 0 ? '#fff' : '#94a3b8'};width:20pt;height:20pt;border-radius:50%;display:inline-block;text-align:center;font-weight:bold;font-size:10pt;line-height:20pt;flex-shrink:0">${i + 1}</span>
          <div>
            <p style="font-weight:${i === 0 ? 'bold' : '600'};color:#0f172a;margin:0 0 2pt;font-size:${i === 0 ? '12' : '11'}pt">${t.texto}</p>
            ${t.razon ? `<p style="color:#94a3b8;font-size:9pt;font-style:italic;margin:0">${t.razon}</p>` : ''}
          </div>
        </div>`;
      });
    }

    if (a.guion) {
      html += h3('Guion del Video');
      html += `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12pt 14pt;font-size:10pt;color:#475569;white-space:pre-wrap;line-height:1.8">${a.guion}</div>`;
    }

    if (a.descripcionSEO) {
      html += h3('Descripción SEO');
      html += `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10pt 12pt;font-size:10pt;color:#475569;white-space:pre-wrap">${a.descripcionSEO}</div>`;
    }

    if (a.keywords?.length) {
      html += h3('Keywords / Tags');
      html += `<p style="font-size:10pt;color:#7c3aed">${a.keywords.slice(0, 25).map((k) => `#${k}`).join('   ')}</p>`;
    }

    if (a.timestamps?.length) {
      html += h3('Timestamps');
      html += `<div style="font-family:'Courier New',monospace;font-size:10pt;color:#475569;background:#f8fafc;padding:10pt 12pt;border-radius:8px">${a.timestamps.map((t) => `<div>${t}</div>`).join('')}</div>`;
    }

    if (a.estrategiaPublicacion) {
      const ep = a.estrategiaPublicacion;
      html += h3('Estrategia de Publicación');
      html += metricRow([
        { label: 'Mejor día', value: ep.mejorDia || '—' },
        { label: 'Mejor hora', value: ep.mejorHora || '—' },
        { label: 'Frecuencia', value: ep.frecuencia || '—' },
        { label: 'Formato', value: ep.formato || '—' },
      ]);
      if (ep.razon) html += `<p style="font-style:italic;color:#64748b;font-size:10pt">${ep.razon}</p>`;
    }

    const prompts = [
      { label: 'Prompt Thumbnail', value: a.promptThumbnail },
      { label: 'Prompt Video', value: a.promptVideo },
      { label: 'Prompt Música (Suno)', value: a.promptMusica },
      { label: 'Prompt Música (Gemini)', value: a.promptMusicaGemini },
    ].filter((pr) => pr.value);

    if (prompts.length) {
      html += h3('Prompts de Producción');
      prompts.forEach((pr) => {
        html += `<p style="font-weight:bold;color:#1e293b;margin:10pt 0 4pt">${pr.label}</p>
        <div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:8pt 12pt;font-family:'Courier New',monospace;font-size:9pt;color:#475569;white-space:pre-wrap;margin-bottom:10pt">${pr.value}</div>`;
      });
    }

    if (a.storyboard?.length) {
      html += h3('Storyboard');
      html += table(
        ['Escena', 'Tiempo', 'Voz en off', 'Prompt imagen'],
        a.storyboard.slice(0, 12).map((s) => [
          `<strong>#${s.escena}</strong>`,
          `${s.inicioSeg}s–${s.finSeg}s`,
          s.vozEnOff.slice(0, 80),
          s.promptImagen.slice(0, 80),
        ]),
        '#ec4899'
      );
    }
  }

  // MONETIZACIÓN
  if (m) {
    html += h2('Plan de Monetización');
    html += metricRow([
      { label: 'CPM', value: `$${m.cpm[0]}–$${m.cpm[1]}` },
      { label: 'RPM', value: `$${m.rpm[0]}–$${m.rpm[1]}` },
      ...(m.proyeccion ? [
        { label: 'Ingresos Ads/mes', value: `$${m.proyeccion.ingresosAds[0]}–$${m.proyeccion.ingresosAds[1]}` },
        { label: 'Total mes', value: `$${m.proyeccion.ingresosTotales[0]}–$${m.proyeccion.ingresosTotales[1]}` },
      ] : []),
    ]);

    if (m.vias?.length) {
      html += h3('Vías de monetización');
      m.vias.forEach((v) => {
        html += `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8pt 12pt;margin-bottom:6pt">
          <p style="font-weight:bold;color:#0f172a;margin:0 0 4pt">
            ${v.nombre}
            <span style="background:${potentialColor(v.potencial)};color:#fff;padding:1pt 6pt;border-radius:4px;font-size:9pt;margin-left:6pt">${v.potencial.toUpperCase()}</span>
          </p>
          <p style="color:#475569;font-size:10pt;margin:0">${v.descripcion}</p>
        </div>`;
      });
    }

    if (m.requisitos?.length) {
      html += h3('Requisitos del canal');
      m.requisitos.forEach((r) => {
        html += `<p style="margin:2pt 0"><span style="font-size:12pt">${r.cumplido ? '✅' : '⬜'}</span> <span style="color:${r.cumplido ? '#0f172a' : '#94a3b8'}">${r.texto}</span></p>`;
      });
    }
  }

  // PIE
  html += `<div style="margin-top:32pt;padding-top:10pt;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between">
    <span style="color:#94a3b8;font-size:9pt">Mini MX YouTube — Estudio de Nichos Virales</span>
    <span style="color:#94a3b8;font-size:9pt">${fecha}</span>
  </div>
</body></html>`;

  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${p.nombre.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'Proyecto'} — Mini MX YouTube.doc`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
