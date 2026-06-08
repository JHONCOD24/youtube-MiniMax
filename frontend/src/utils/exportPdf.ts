import type { Project } from '../types';

function verdictColor(v: string) {
  return v === 'verde' ? '#16a34a' : v === 'amarillo' ? '#d97706' : '#dc2626';
}
function verdictLabel(v: string) {
  return v === 'verde' ? 'OPORTUNIDAD ALTA' : v === 'amarillo' ? 'OPORTUNIDAD MEDIA' : 'RIESGO ALTO';
}
function potentialBadge(p: string) {
  const color = p === 'alto' ? '#16a34a' : p === 'medio' ? '#d97706' : '#dc2626';
  return `<span style="background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:.05em">${p.toUpperCase()}</span>`;
}
function chip(text: string, color = '#6366f1') {
  return `<span style="background:${color}22;color:${color};padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid ${color}44">${text}</span>`;
}

export function exportToPdf(p: Project): void {
  const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  const inv = p.investigacion;
  const idea = p.ideaElegida;
  const a = p.assets;
  const m = p.monetizacion;

  const chips = [
    inv ? chip('✓ Investigación', '#16a34a') : '',
    idea ? chip('✓ Idea', '#6366f1') : '',
    a ? chip('✓ Activos', '#ec4899') : '',
    m ? chip('✓ Monetización', '#f59e0b') : '',
  ].filter(Boolean).join(' ');

  const metricCard = (label: string, value: string) =>
    `<div style="background:#f8fafc;border-radius:10px;padding:12px 10px;text-align:center;flex:1;min-width:100px">
      <div style="color:#94a3b8;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">${label}</div>
      <div style="color:#6366f1;font-size:18px;font-weight:700">${value}</div>
    </div>`;

  const sectionTitle = (title: string) =>
    `<div style="display:flex;align-items:center;gap:8px;margin:32px 0 14px">
      <div style="width:4px;height:22px;background:#6366f1;border-radius:2px;flex-shrink:0"></div>
      <h2 style="margin:0;font-size:16px;font-weight:700;color:#0f172a;letter-spacing:-.01em">${title}</h2>
    </div>`;

  let html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>${p.nombre} — Mini MX YouTube</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Inter, system-ui, sans-serif; color: #0f172a; background: #fff; font-size: 13px; line-height: 1.6; }
  .page { max-width: 780px; margin: 0 auto; padding: 48px 56px; }
  table { border-collapse: collapse; width: 100%; }
  th { background: #6366f1; color: #fff; padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; }
  td { padding: 8px 12px; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  pre { font-family: 'Courier New', monospace; white-space: pre-wrap; word-break: break-word; }
  @media print {
    @page { margin: 18mm 16mm; size: A4; }
    body { font-size: 12px; }
    .page { padding: 0; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
  }
</style>
</head>
<body>
<div class="page">

<!-- PORTADA -->
<div style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 60%,#ec4899 100%);border-radius:16px;padding:44px 40px 36px;margin-bottom:36px;color:#fff;position:relative;overflow:hidden">
  <div style="position:absolute;top:-30px;right:-30px;width:160px;height:160px;background:rgba(255,255,255,.08);border-radius:50%"></div>
  <div style="position:absolute;bottom:-40px;right:40px;width:100px;height:100px;background:rgba(255,255,255,.06);border-radius:50%"></div>
  <div style="font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;opacity:.7;margin-bottom:10px">Mini MX YouTube · Estudio de Nichos Virales</div>
  <h1 style="font-size:28px;font-weight:800;letter-spacing:-.02em;line-height:1.2;margin-bottom:10px">${p.nombre}</h1>
  <div style="opacity:.85;font-size:14px;margin-bottom:6px"><strong>Nicho:</strong> ${p.nicho || 'Sin definir'}${p.nichoPersonalizado ? ` · ${p.nichoPersonalizado}` : ''}</div>
  <div style="opacity:.65;font-size:12px;margin-bottom:20px">Generado el ${fecha}</div>
  <div style="display:flex;flex-wrap:wrap;gap:8px">${chips}</div>
</div>`;

  // INVESTIGACIÓN
  if (inv) {
    html += sectionTitle('Investigación de Nicho');
    html += `<div style="background:${verdictColor(inv.veredicto)};color:#fff;border-radius:10px;padding:14px 18px;margin-bottom:16px">
      <div style="font-size:14px;font-weight:700;margin-bottom:4px">${verdictLabel(inv.veredicto)}</div>
      <div style="opacity:.9;font-size:12px">${inv.explicacionVeredicto || ''}</div>
    </div>`;

    if (inv.metricas) {
      html += `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
        ${metricCard('Vistas promedio', inv.metricas.vistasPromedio?.toLocaleString('es-ES') || '—')}
        ${metricCard('VPH promedio', inv.metricas.vphPromedio?.toLocaleString('es-ES') || '—')}
        ${metricCard('Frecuencia', inv.metricas.frecuenciaPublicacion || '—')}
        ${metricCard('Duración media', inv.metricas.duracionPromedio || '—')}
      </div>`;
    }

    html += `<p style="color:#475569;line-height:1.7;margin-bottom:16px">${inv.resumen || ''}</p>`;

    if (inv.subNichos?.length) {
      html += `<p style="font-weight:600;color:#0f172a;margin-bottom:6px">Sub-nichos detectados</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">${inv.subNichos.slice(0, 8).map((s) => `<span style="background:#ede9fe;color:#7c3aed;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:500">${s}</span>`).join('')}</div>`;
    }

    if (inv.angulos?.length) {
      html += `<p style="font-weight:600;color:#0f172a;margin-bottom:6px">Ángulos de contenido</p>
      <ul style="list-style:none;margin-bottom:16px">${inv.angulos.slice(0, 6).map((a) => `<li style="padding:4px 0 4px 16px;border-left:3px solid #6366f1;margin-bottom:4px;color:#475569;font-size:12px">${a}</li>`).join('')}</ul>`;
    }

    if (inv.topVideos?.length) {
      html += `<p style="font-weight:600;color:#0f172a;margin-bottom:8px">Top Videos de Referencia</p>
      <table style="margin-bottom:20px">
        <thead><tr><th>#</th><th>Título</th><th>Canal</th><th>Vistas</th><th>VPH</th></tr></thead>
        <tbody>
          ${inv.topVideos.slice(0, 6).map((v, i) => `<tr>
            <td><strong>${i + 1}</strong></td>
            <td>${v.title.slice(0, 65)}</td>
            <td style="color:#64748b">${v.channelTitle || '—'}</td>
            <td style="font-weight:600">${v.views?.toLocaleString('es-ES') || '—'}</td>
            <td>${v.vph ? v.vph.toFixed(0) : '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    }
  }

  // IDEA ELEGIDA
  if (idea) {
    html += sectionTitle('Idea de Video Elegida');
    html += `<div style="background:linear-gradient(135deg,#eef2ff,#fdf4ff);border:1px solid #c7d2fe;border-radius:12px;padding:20px 22px;margin-bottom:20px">
      <h3 style="font-size:16px;font-weight:700;color:#3730a3;margin-bottom:12px">${idea.titulo}</h3>
      ${idea.hook ? `<p style="font-style:italic;color:#7c3aed;font-size:13px;margin-bottom:10px">"${idea.hook}"</p>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${idea.angulo ? `<div><span style="font-weight:600;color:#475569">Ángulo:</span> <span style="color:#0f172a">${idea.angulo}</span></div>` : ''}
        ${idea.porQueViral ? `<div><span style="font-weight:600;color:#475569">Por qué viral:</span> <span style="color:#0f172a">${idea.porQueViral}</span></div>` : ''}
        ${idea.promesaValor ? `<div style="grid-column:span 2"><span style="font-weight:600;color:#475569">Promesa de valor:</span> <span style="color:#0f172a">${idea.promesaValor}</span></div>` : ''}
      </div>
    </div>`;
  }

  // ACTIVOS
  if (a) {
    html += sectionTitle('Activos del Video');

    if (a.titulos?.length) {
      html += `<p style="font-weight:600;margin-bottom:8px">Títulos de Alto CTR</p>
      <div style="margin-bottom:20px">
        ${a.titulos.slice(0, 5).map((t, i) => `<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 14px;border-radius:8px;margin-bottom:6px;background:${i === 0 ? '#eef2ff' : '#f8fafc'};border:1px solid ${i === 0 ? '#c7d2fe' : '#e2e8f0'}">
          <span style="min-width:24px;height:24px;border-radius:50%;background:${i === 0 ? '#6366f1' : '#e2e8f0'};color:${i === 0 ? '#fff' : '#94a3b8'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${i + 1}</span>
          <div>
            <div style="font-weight:${i === 0 ? '700' : '500'};color:#0f172a;font-size:13px">${t.texto}</div>
            ${t.razon ? `<div style="color:#94a3b8;font-size:11px;font-style:italic;margin-top:2px">${t.razon}</div>` : ''}
          </div>
        </div>`).join('')}
      </div>`;
    }

    if (a.descripcionSEO) {
      html += `<p style="font-weight:600;margin-bottom:8px">Descripción SEO</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;font-size:12px;color:#475569;white-space:pre-wrap;margin-bottom:20px">${a.descripcionSEO}</div>`;
    }

    if (a.keywords?.length) {
      html += `<p style="font-weight:600;margin-bottom:8px">Keywords / Tags</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px">
        ${a.keywords.slice(0, 25).map((k) => `<span style="background:#ede9fe;color:#7c3aed;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:500">#${k}</span>`).join('')}
      </div>`;
    }

    if (a.timestamps?.length) {
      html += `<p style="font-weight:600;margin-bottom:8px">Timestamps</p>
      <div style="font-family:'Courier New',monospace;font-size:12px;color:#475569;background:#f8fafc;border-radius:8px;padding:12px 16px;margin-bottom:20px">
        ${a.timestamps.map((t) => `<div>${t}</div>`).join('')}
      </div>`;
    }

    if (a.estrategiaPublicacion) {
      const ep = a.estrategiaPublicacion;
      html += sectionTitle('Estrategia de Publicación');
      html += `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
        ${metricCard('Mejor día', ep.mejorDia || '—')}
        ${metricCard('Mejor hora', ep.mejorHora || '—')}
        ${metricCard('Frecuencia', ep.frecuencia || '—')}
        ${metricCard('Formato', ep.formato || '—')}
      </div>`;
      if (ep.razon) html += `<p style="color:#475569;font-style:italic;font-size:12px;margin-bottom:16px">${ep.razon}</p>`;
    }

    const prompts = [
      { label: 'Prompt Thumbnail', value: a.promptThumbnail },
      { label: 'Prompt Video', value: a.promptVideo },
      { label: 'Prompt Música (Suno)', value: a.promptMusica },
    ].filter((pr) => pr.value);

    if (prompts.length) {
      html += sectionTitle('Prompts de Producción');
      prompts.forEach((pr) => {
        html += `<div style="margin-bottom:16px">
          <p style="font-weight:600;color:#0f172a;margin-bottom:6px">${pr.label}</p>
          <pre style="background:#f1f5f9;border-radius:8px;padding:12px 14px;font-size:11px;color:#475569;border:1px solid #e2e8f0">${pr.value}</pre>
        </div>`;
      });
    }

    if (a.storyboard?.length) {
      html += sectionTitle('Storyboard');
      html += `<table style="margin-bottom:20px">
        <thead><tr><th>Escena</th><th>Tiempo</th><th>Voz en off</th><th>Prompt imagen</th></tr></thead>
        <tbody>
          ${a.storyboard.slice(0, 12).map((s, i) => `<tr>
            <td><strong>#${s.escena}</strong></td>
            <td style="white-space:nowrap">${s.inicioSeg}s–${s.finSeg}s</td>
            <td style="font-size:11px">${s.vozEnOff.slice(0, 80)}</td>
            <td style="font-size:11px;color:#64748b">${s.promptImagen.slice(0, 80)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    }

    if (a.guion) {
      html += `<div class="page-break"></div>${sectionTitle('Guion del Video')}`;
      html += `<div style="background:#f8fafc;border-radius:8px;padding:16px 18px;font-size:12px;color:#475569;white-space:pre-wrap;line-height:1.8;border:1px solid #e2e8f0">${a.guion}</div>`;
    }
  }

  // MONETIZACIÓN
  if (m) {
    html += sectionTitle('Plan de Monetización');
    html += `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
      ${metricCard('CPM', `$${m.cpm[0]}–$${m.cpm[1]}`)}
      ${metricCard('RPM', `$${m.rpm[0]}–$${m.rpm[1]}`)}
      ${m.proyeccion ? metricCard('Ingresos Ads/mes', `$${m.proyeccion.ingresosAds[0]}–$${m.proyeccion.ingresosAds[1]}`) : ''}
      ${m.proyeccion ? metricCard('Total mes', `$${m.proyeccion.ingresosTotales[0]}–$${m.proyeccion.ingresosTotales[1]}`) : ''}
    </div>`;

    if (m.vias?.length) {
      html += `<p style="font-weight:600;margin-bottom:8px">Vías de monetización</p>
      <div style="margin-bottom:20px">
        ${m.vias.map((v) => `<div style="padding:12px 14px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:6px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <strong style="color:#0f172a">${v.nombre}</strong>
            ${potentialBadge(v.potencial)}
          </div>
          <p style="color:#475569;font-size:12px;margin:0">${v.descripcion}</p>
        </div>`).join('')}
      </div>`;
    }

    if (m.requisitos?.length) {
      html += `<p style="font-weight:600;margin-bottom:6px">Requisitos del canal</p>
      <div style="margin-bottom:16px">
        ${m.requisitos.map((r) => `<div style="display:flex;gap:8px;align-items:center;padding:4px 0;font-size:12px">
          <span style="font-size:14px">${r.cumplido ? '✅' : '⬜'}</span>
          <span style="color:${r.cumplido ? '#0f172a' : '#94a3b8'}">${r.texto}</span>
        </div>`).join('')}
      </div>`;
    }
  }

  // PIE
  html += `<div style="margin-top:48px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;color:#94a3b8;font-size:11px">
    <span>Mini MX YouTube — Estudio de Nichos Virales</span>
    <span>${fecha}</span>
  </div>
</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
    }, 400);
  };
}
