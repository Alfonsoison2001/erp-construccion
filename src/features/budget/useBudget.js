import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

const DEMO_BUDGET_ITEMS = [
  // Diseños e Ingenierias
  { id: 'bi1', project_id: 'demo-p1', category_id: 'cat-disenos', concept_id: 'con-proy-arq', categories: { id: 'cat-disenos', name: 'Diseños e Ingenierias' }, concepts: { id: 'con-proy-arq', name: 'Proyecto Arquitectonico' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 0, subtotal: 0, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 0, exchange_rate: 1, total_mxn: 0, notes: '' },
  { id: 'bi2', project_id: 'demo-p1', category_id: 'cat-disenos', concept_id: 'con-diseno-ilum', categories: { id: 'cat-disenos', name: 'Diseños e Ingenierias' }, concepts: { id: 'con-diseno-ilum', name: 'Diseño Iluminacion. Artec3' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'USD', unit_price: 21995, subtotal: 21995, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 3519.2, total: 25514.2, exchange_rate: 20, total_mxn: 510284, notes: '' },
  { id: 'bi3', project_id: 'demo-p1', category_id: 'cat-disenos', concept_id: 'con-sup-ilum', categories: { id: 'cat-disenos', name: 'Diseños e Ingenierias' }, concepts: { id: 'con-sup-ilum', name: 'Supervision Diseño Iluminacion. Artec3' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'USD', unit_price: 0, subtotal: 0, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 0, exchange_rate: 20, total_mxn: 0, notes: '' },
  { id: 'bi4', project_id: 'demo-p1', category_id: 'cat-disenos', concept_id: 'con-proy-aa', categories: { id: 'cat-disenos', name: 'Diseños e Ingenierias' }, concepts: { id: 'con-proy-aa', name: 'Proyecto A.A. Cyvsa' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 52500, subtotal: 52500, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 8400, total: 60900, exchange_rate: 1, total_mxn: 60900, notes: '' },
  { id: 'bi5', project_id: 'demo-p1', category_id: 'cat-disenos', concept_id: 'con-proy-asint', categories: { id: 'cat-disenos', name: 'Diseños e Ingenierias' }, concepts: { id: 'con-proy-asint', name: 'Proyecto Asintelix' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 126730, subtotal: 126730, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 20276.8, total: 147006.8, exchange_rate: 1, total_mxn: 147006.8, notes: '' },
  { id: 'bi6', project_id: 'demo-p1', category_id: 'cat-disenos', concept_id: 'con-diseno-jard', categories: { id: 'cat-disenos', name: 'Diseños e Ingenierias' }, concepts: { id: 'con-diseno-jard', name: 'Diseño Jardineria' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 120000, subtotal: 120000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 120000, exchange_rate: 1, total_mxn: 120000, notes: '' },
  { id: 'bi7', project_id: 'demo-p1', category_id: 'cat-disenos', concept_id: 'con-sup-jard', categories: { id: 'cat-disenos', name: 'Diseños e Ingenierias' }, concepts: { id: 'con-sup-jard', name: 'Supervision Diseño Jardineria' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 0, subtotal: 0, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 0, exchange_rate: 1, total_mxn: 0, notes: '' },
  // Tramites Locales
  { id: 'bi8', project_id: 'demo-p1', category_id: 'cat-tramites', concept_id: 'con-sindicatos', categories: { id: 'cat-tramites', name: 'Tramites Locales' }, concepts: { id: 'con-sindicatos', name: 'Sindicatos Y Patrullas' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 142000, subtotal: 142000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 142000, exchange_rate: 1, total_mxn: 142000, notes: '' },
  { id: 'bi9', project_id: 'demo-p1', category_id: 'cat-tramites', concept_id: 'con-poliza', categories: { id: 'cat-tramites', name: 'Tramites Locales' }, concepts: { id: 'con-poliza', name: 'Poliza Responsabilidad Civil' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 48550, subtotal: 48550, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 7768, total: 56318, exchange_rate: 1, total_mxn: 56318, notes: '' },
  { id: 'bi10', project_id: 'demo-p1', category_id: 'cat-tramites', concept_id: 'con-acometida', categories: { id: 'cat-tramites', name: 'Tramites Locales' }, concepts: { id: 'con-acometida', name: 'Acometida Cfe. Gestor' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 45000, subtotal: 45000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 45000, exchange_rate: 1, total_mxn: 45000, notes: '' },
  // Ingenierias Y Topografia
  { id: 'bi11', project_id: 'demo-p1', category_id: 'cat-ingenieria', concept_id: 'con-topo-gest', categories: { id: 'cat-ingenieria', name: 'Ingenierias Y Topografia' }, concepts: { id: 'con-topo-gest', name: 'Topografia Gestoria' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 7000, subtotal: 7000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 7000, exchange_rate: 1, total_mxn: 7000, notes: '' },
  { id: 'bi12', project_id: 'demo-p1', category_id: 'cat-ingenieria', concept_id: 'con-topo-obra', categories: { id: 'cat-ingenieria', name: 'Ingenierias Y Topografia' }, concepts: { id: 'con-topo-obra', name: 'Topografia Obra' }, detail: '', supplier: '', unit: 'Semana', quantity: 8, currency: 'MXN', unit_price: 12000, subtotal: 96000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 96000, exchange_rate: 1, total_mxn: 96000, notes: '' },
  { id: 'bi13', project_id: 'demo-p1', category_id: 'cat-ingenieria', concept_id: 'con-mec-suelos', categories: { id: 'cat-ingenieria', name: 'Ingenierias Y Topografia' }, concepts: { id: 'con-mec-suelos', name: 'Mecanica De Suelos' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 44000, subtotal: 44000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 44000, exchange_rate: 1, total_mxn: 44000, notes: '' },
  { id: 'bi14', project_id: 'demo-p1', category_id: 'cat-ingenieria', concept_id: 'con-calc-est', categories: { id: 'cat-ingenieria', name: 'Ingenierias Y Topografia' }, concepts: { id: 'con-calc-est', name: 'Calculo Estructural' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 200000, subtotal: 200000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 200000, exchange_rate: 1, total_mxn: 200000, notes: '' },
  { id: 'bi15', project_id: 'demo-p1', category_id: 'cat-ingenieria', concept_id: 'con-dis-inst', categories: { id: 'cat-ingenieria', name: 'Ingenierias Y Topografia' }, concepts: { id: 'con-dis-inst', name: 'Diseño Instalaciones' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 306800, subtotal: 306800, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 306800, exchange_rate: 1, total_mxn: 306800, notes: '' },
  // Indirectos De Obra
  { id: 'bi16', project_id: 'demo-p1', category_id: 'cat-indirectos', concept_id: 'con-trab-prelim', categories: { id: 'cat-indirectos', name: 'Indirectos De Obra' }, concepts: { id: 'con-trab-prelim', name: 'Trabajos Preliminares' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 272676.17, subtotal: 272676.17, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 272676.17, exchange_rate: 1, total_mxn: 272676.17, notes: '' },
  { id: 'bi17', project_id: 'demo-p1', category_id: 'cat-indirectos', concept_id: 'con-hon-resid', categories: { id: 'cat-indirectos', name: 'Indirectos De Obra' }, concepts: { id: 'con-hon-resid', name: 'Honorarios Residente' }, detail: '', supplier: '', unit: 'Mes', quantity: 26, currency: 'MXN', unit_price: 48000, subtotal: 1248000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 1248000, exchange_rate: 1, total_mxn: 1248000, notes: '' },
  { id: 'bi18', project_id: 'demo-p1', category_id: 'cat-indirectos', concept_id: 'con-aux-resid', categories: { id: 'cat-indirectos', name: 'Indirectos De Obra' }, concepts: { id: 'con-aux-resid', name: 'Auxiliar De Residente' }, detail: '', supplier: '', unit: 'Mes', quantity: 26, currency: 'MXN', unit_price: 14500, subtotal: 377000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 377000, exchange_rate: 1, total_mxn: 377000, notes: '' },
  { id: 'bi19', project_id: 'demo-p1', category_id: 'cat-indirectos', concept_id: 'con-segurista', categories: { id: 'cat-indirectos', name: 'Indirectos De Obra' }, concepts: { id: 'con-segurista', name: 'Segurista Obra' }, detail: '', supplier: '', unit: 'Mes', quantity: 26, currency: 'MXN', unit_price: 20000, subtotal: 520000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 520000, exchange_rate: 1, total_mxn: 520000, notes: '' },
  { id: 'bi20', project_id: 'demo-p1', category_id: 'cat-indirectos', concept_id: 'con-caja-chica', categories: { id: 'cat-indirectos', name: 'Indirectos De Obra' }, concepts: { id: 'con-caja-chica', name: 'Caja Chica De Obra' }, detail: '', supplier: '', unit: 'Mes', quantity: 24, currency: 'MXN', unit_price: 25000, subtotal: 600000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 600000, exchange_rate: 1, total_mxn: 600000, notes: '' },
  { id: 'bi21', project_id: 'demo-p1', category_id: 'cat-indirectos', concept_id: 'con-limpieza', categories: { id: 'cat-indirectos', name: 'Indirectos De Obra' }, concepts: { id: 'con-limpieza', name: 'Limpieza Obra Y Final' }, detail: '', supplier: '', unit: 'Mes', quantity: 24, currency: 'MXN', unit_price: 20400, subtotal: 489600, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 489600, exchange_rate: 1, total_mxn: 489600, notes: '' },
  { id: 'bi22', project_id: 'demo-p1', category_id: 'cat-indirectos', concept_id: 'con-imss', categories: { id: 'cat-indirectos', name: 'Indirectos De Obra' }, concepts: { id: 'con-imss', name: 'IMSS' }, detail: '', supplier: '', unit: 'Mes', quantity: 26, currency: 'MXN', unit_price: 75993.36, subtotal: 1975827.36, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 1975827.36, exchange_rate: 1, total_mxn: 1975827.36, notes: '' },
  // Excavacion Acarreos Y Muros De Contension
  { id: 'bi23', project_id: 'demo-p1', category_id: 'cat-excavacion', concept_id: 'con-demolicion', categories: { id: 'cat-excavacion', name: 'Excavacion Acarreos Y Muros De Contension' }, concepts: { id: 'con-demolicion', name: 'Demolicion Y Acarreo' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 350000, subtotal: 350000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 350000, exchange_rate: 1, total_mxn: 350000, notes: '' },
  { id: 'bi24', project_id: 'demo-p1', category_id: 'cat-excavacion', concept_id: 'con-recicladora', categories: { id: 'cat-excavacion', name: 'Excavacion Acarreos Y Muros De Contension' }, concepts: { id: 'con-recicladora', name: 'Pago De Recicladora' }, detail: '', supplier: '', unit: 'Viaje', quantity: 18.29, currency: 'MXN', unit_price: 3000, subtotal: 54867.38, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 8778.78, total: 63646.16, exchange_rate: 1, total_mxn: 63646.16, notes: '' },
  { id: 'bi25', project_id: 'demo-p1', category_id: 'cat-excavacion', concept_id: 'con-excav-proy', categories: { id: 'cat-excavacion', name: 'Excavacion Acarreos Y Muros De Contension' }, concepts: { id: 'con-excav-proy', name: 'Excavacion Proyecto Y Carga' }, detail: '', supplier: '', unit: 'M3', quantity: 2443.96, currency: 'MXN', unit_price: 242, subtotal: 591438.4, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 94630.14, total: 686068.55, exchange_rate: 1, total_mxn: 686068.55, notes: '' },
  { id: 'bi26', project_id: 'demo-p1', category_id: 'cat-excavacion', concept_id: 'con-tiro', categories: { id: 'cat-excavacion', name: 'Excavacion Acarreos Y Muros De Contension' }, concepts: { id: 'con-tiro', name: 'Tiro Autorizado' }, detail: '', supplier: '', unit: 'M3', quantity: 2443.96, currency: 'MXN', unit_price: 161.64, subtotal: 395036.69, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 63205.87, total: 458242.57, exchange_rate: 1, total_mxn: 458242.57, notes: '' },
  // Cimentacion Y Estructura Civil
  { id: 'bi27', project_id: 'demo-p1', category_id: 'cat-cimentacion', concept_id: 'con-muros-cont', categories: { id: 'cat-cimentacion', name: 'Cimentacion Y Estructura Civil' }, concepts: { id: 'con-muros-cont', name: 'Muros Contencion De Tierras' }, detail: '', supplier: '', unit: 'M2', quantity: 491.91, currency: 'MXN', unit_price: 3497.22, subtotal: 1720328, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 275252.48, total: 1995580.46, exchange_rate: 1, total_mxn: 1995580.46, notes: '' },
  { id: 'bi28', project_id: 'demo-p1', category_id: 'cat-cimentacion', concept_id: 'con-cim-semi', categories: { id: 'cat-cimentacion', name: 'Cimentacion Y Estructura Civil' }, concepts: { id: 'con-cim-semi', name: 'Cimentacion Estructura Semisotano' }, detail: '', supplier: '', unit: 'M2', quantity: 371.1, currency: 'MXN', unit_price: 8860.71, subtotal: 3288209.48, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 526113.52, total: 3814323, exchange_rate: 1, total_mxn: 3814323, notes: '' },
  { id: 'bi29', project_id: 'demo-p1', category_id: 'cat-cimentacion', concept_id: 'con-est-pb', categories: { id: 'cat-cimentacion', name: 'Cimentacion Y Estructura Civil' }, concepts: { id: 'con-est-pb', name: 'Estructura Pb' }, detail: '', supplier: '', unit: 'M2', quantity: 699.28, currency: 'MXN', unit_price: 8737.6, subtotal: 6110028.93, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 977604.63, total: 7087633.56, exchange_rate: 1, total_mxn: 7087633.56, notes: '' },
  { id: 'bi30', project_id: 'demo-p1', category_id: 'cat-cimentacion', concept_id: 'con-est-pa', categories: { id: 'cat-cimentacion', name: 'Cimentacion Y Estructura Civil' }, concepts: { id: 'con-est-pa', name: 'Estructura Pa' }, detail: '', supplier: '', unit: 'M2', quantity: 186.97, currency: 'MXN', unit_price: 9411.23, subtotal: 1759617.67, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 281538.83, total: 2041156.5, exchange_rate: 1, total_mxn: 2041156.5, notes: '' },
  { id: 'bi31', project_id: 'demo-p1', category_id: 'cat-cimentacion', concept_id: 'con-est-jardin', categories: { id: 'cat-cimentacion', name: 'Cimentacion Y Estructura Civil' }, concepts: { id: 'con-est-jardin', name: 'Estructura Extension Jardin' }, detail: '', supplier: '', unit: 'M2', quantity: 232.7, currency: 'MXN', unit_price: 7863.84, subtotal: 1829915.57, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 292786.49, total: 2122702.06, exchange_rate: 1, total_mxn: 2122702.06, notes: '' },
  // Albañileria Y Bardas
  { id: 'bi32', project_id: 'demo-p1', category_id: 'cat-albanileria', concept_id: 'con-pisos', categories: { id: 'cat-albanileria', name: 'Albañileria Y Bardas' }, concepts: { id: 'con-pisos', name: 'Pisos' }, detail: 'Concreto Pulido Mate', supplier: '', unit: 'M2', quantity: 377.19, currency: 'MXN', unit_price: 597.07, subtotal: 225209.59, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 225209.59, exchange_rate: 1, total_mxn: 225209.59, notes: '' },
  { id: 'bi33', project_id: 'demo-p1', category_id: 'cat-albanileria', concept_id: 'con-pisos', categories: { id: 'cat-albanileria', name: 'Albañileria Y Bardas' }, concepts: { id: 'con-pisos', name: 'Pisos' }, detail: 'Concreto Desbastado Terrazo', supplier: '', unit: 'M2', quantity: 233.13, currency: 'MXN', unit_price: 804.89, subtotal: 187643.54, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 187643.54, exchange_rate: 1, total_mxn: 187643.54, notes: '' },
  { id: 'bi34', project_id: 'demo-p1', category_id: 'cat-albanileria', concept_id: 'con-pisos', categories: { id: 'cat-albanileria', name: 'Albañileria Y Bardas' }, concepts: { id: 'con-pisos', name: 'Pisos' }, detail: 'Concreto Rayado', supplier: '', unit: 'M2', quantity: 86.21, currency: 'MXN', unit_price: 804.89, subtotal: 69389.39, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 69389.39, exchange_rate: 1, total_mxn: 69389.39, notes: '' },
  { id: 'bi35', project_id: 'demo-p1', category_id: 'cat-albanileria', concept_id: 'con-pisos', categories: { id: 'cat-albanileria', name: 'Albañileria Y Bardas' }, concepts: { id: 'con-pisos', name: 'Pisos' }, detail: 'Concreto Lavado Impermeabilizante', supplier: '', unit: 'M2', quantity: 207.01, currency: 'MXN', unit_price: 905.77, subtotal: 187503.24, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 187503.24, exchange_rate: 1, total_mxn: 187503.24, notes: '' },
  { id: 'bi36', project_id: 'demo-p1', category_id: 'cat-albanileria', concept_id: 'con-muros-alb', categories: { id: 'cat-albanileria', name: 'Albañileria Y Bardas' }, concepts: { id: 'con-muros-alb', name: 'Muros' }, detail: 'Muro Bastidor PTR/Triplay/Tablaroca', supplier: '', unit: 'M2', quantity: 142.71, currency: 'MXN', unit_price: 2856, subtotal: 407579.76, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 407579.76, exchange_rate: 1, total_mxn: 407579.76, notes: '' },
  { id: 'bi37', project_id: 'demo-p1', category_id: 'cat-albanileria', concept_id: 'con-muros-alb', categories: { id: 'cat-albanileria', name: 'Albañileria Y Bardas' }, concepts: { id: 'con-muros-alb', name: 'Muros' }, detail: 'Rampa Vehicular', supplier: '', unit: 'M2', quantity: 11.69, currency: 'MXN', unit_price: 1947.45, subtotal: 22765.69, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 22765.69, exchange_rate: 1, total_mxn: 22765.69, notes: '' },
  { id: 'bi38', project_id: 'demo-p1', category_id: 'cat-albanileria', concept_id: 'con-muros-alb', categories: { id: 'cat-albanileria', name: 'Albañileria Y Bardas' }, concepts: { id: 'con-muros-alb', name: 'Muros' }, detail: 'Barda Perimetral Piedra Braza', supplier: '', unit: 'M2', quantity: 574.84, currency: 'MXN', unit_price: 2764.57, subtotal: 1589180.33, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 1589180.33, exchange_rate: 1, total_mxn: 1589180.33, notes: '' },
  { id: 'bi39', project_id: 'demo-p1', category_id: 'cat-albanileria', concept_id: 'con-acarreos', categories: { id: 'cat-albanileria', name: 'Albañileria Y Bardas' }, concepts: { id: 'con-acarreos', name: 'Acarreos' }, detail: 'Acarreos De Cascajo', supplier: '', unit: 'Viaje', quantity: 96, currency: 'MXN', unit_price: 1900, subtotal: 182400, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 182400, exchange_rate: 1, total_mxn: 182400, notes: '' },
  { id: 'bi40', project_id: 'demo-p1', category_id: 'cat-albanileria', concept_id: 'con-acarreos', categories: { id: 'cat-albanileria', name: 'Albañileria Y Bardas' }, concepts: { id: 'con-acarreos', name: 'Acarreos' }, detail: 'Acarreos Verticales/Horizontales', supplier: '', unit: 'Semana', quantity: 78, currency: 'MXN', unit_price: 14490, subtotal: 1130220, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 1130220, exchange_rate: 1, total_mxn: 1130220, notes: '' },
  // Impermeabilizacion
  { id: 'bi41', project_id: 'demo-p1', category_id: 'cat-impermeabilizacion', concept_id: 'con-imp-cim', categories: { id: 'cat-impermeabilizacion', name: 'Impermeabilizacion' }, concepts: { id: 'con-imp-cim', name: 'Impermeabilizacion Cimentacion' }, detail: '', supplier: '', unit: 'M2', quantity: 371.1, currency: 'MXN', unit_price: 315, subtotal: 116896.5, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 116896.5, exchange_rate: 1, total_mxn: 116896.5, notes: '' },
  { id: 'bi42', project_id: 'demo-p1', category_id: 'cat-impermeabilizacion', concept_id: 'con-jardin-pb', categories: { id: 'cat-impermeabilizacion', name: 'Impermeabilizacion' }, concepts: { id: 'con-jardin-pb', name: 'Area De Jardin Pb' }, detail: '', supplier: '', unit: 'M2', quantity: 253.14, currency: 'MXN', unit_price: 550, subtotal: 139227, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 139227, exchange_rate: 1, total_mxn: 139227, notes: '' },
  { id: 'bi43', project_id: 'demo-p1', category_id: 'cat-impermeabilizacion', concept_id: 'con-imp-azotea', categories: { id: 'cat-impermeabilizacion', name: 'Impermeabilizacion' }, concepts: { id: 'con-imp-azotea', name: 'Impermeabilizacion Losas Azotea' }, detail: '', supplier: '', unit: 'M2', quantity: 515.78, currency: 'MXN', unit_price: 550, subtotal: 283676.25, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 283676.25, exchange_rate: 1, total_mxn: 283676.25, notes: '' },
  { id: 'bi44', project_id: 'demo-p1', category_id: 'cat-impermeabilizacion', concept_id: 'con-imp-banos', categories: { id: 'cat-impermeabilizacion', name: 'Impermeabilizacion' }, concepts: { id: 'con-imp-banos', name: 'Imp. Baños. Cr66' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 135460, subtotal: 135460, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 135460, exchange_rate: 1, total_mxn: 135460, notes: '' },
  { id: 'bi45', project_id: 'demo-p1', category_id: 'cat-impermeabilizacion', concept_id: 'con-charolas', categories: { id: 'cat-impermeabilizacion', name: 'Impermeabilizacion' }, concepts: { id: 'con-charolas', name: 'Charolas Geomembranas' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 81815, subtotal: 81815, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 81815, exchange_rate: 1, total_mxn: 81815, notes: '' },
  { id: 'bi46', project_id: 'demo-p1', category_id: 'cat-impermeabilizacion', concept_id: 'con-fondaline', categories: { id: 'cat-impermeabilizacion', name: 'Impermeabilizacion' }, concepts: { id: 'con-fondaline', name: 'Fondaline Semisotano' }, detail: '', supplier: '', unit: 'M2', quantity: 491.91, currency: 'MXN', unit_price: 550, subtotal: 270552.15, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 270552.15, exchange_rate: 1, total_mxn: 270552.15, notes: '' },
  { id: 'bi47', project_id: 'demo-p1', category_id: 'cat-impermeabilizacion', concept_id: 'con-sellos', categories: { id: 'cat-impermeabilizacion', name: 'Impermeabilizacion' }, concepts: { id: 'con-sellos', name: 'Lote De Sellos' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 103706.9, subtotal: 103706.9, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 103706.9, exchange_rate: 1, total_mxn: 103706.9, notes: '' },
  // Piso Hidronico
  { id: 'bi48', project_id: 'demo-p1', category_id: 'cat-piso-hidronico', concept_id: 'con-piso-hidro', categories: { id: 'cat-piso-hidronico', name: 'Piso Hidronico' }, concepts: { id: 'con-piso-hidro', name: 'Piso Hidronico' }, detail: '', supplier: '', unit: 'M2', quantity: 168.31, currency: 'MXN', unit_price: 1522.57, subtotal: 256264.16, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 41002.27, total: 297266.43, exchange_rate: 1, total_mxn: 297266.43, notes: '' },
  { id: 'bi49', project_id: 'demo-p1', category_id: 'cat-piso-hidronico', concept_id: 'con-termostatos', categories: { id: 'cat-piso-hidronico', name: 'Piso Hidronico' }, concepts: { id: 'con-termostatos', name: 'Termostatos Nest' }, detail: '', supplier: '', unit: 'PZA', quantity: 4, currency: 'MXN', unit_price: 6000, subtotal: 24000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 3840, total: 27840, exchange_rate: 1, total_mxn: 27840, notes: '' },
  // Acabados
  { id: 'bi50', project_id: 'demo-p1', category_id: 'cat-acabados', concept_id: 'con-acabados-yeso', categories: { id: 'cat-acabados', name: 'Acabados' }, concepts: { id: 'con-acabados-yeso', name: 'Acabados Yeso Pintura Tablaroca' }, detail: '', supplier: '', unit: 'M2', quantity: 1388, currency: 'MXN', unit_price: 1485.34, subtotal: 2061658.62, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 329865.38, total: 2391524, exchange_rate: 1, total_mxn: 2391524, notes: '' },
  // Herreria
  { id: 'bi51', project_id: 'demo-p1', category_id: 'cat-herreria', concept_id: 'con-herr-varios', categories: { id: 'cat-herreria', name: 'Herreria' }, concepts: { id: 'con-herr-varios', name: 'Herreria Varios' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 865186.4, subtotal: 865186.4, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 865186.4, exchange_rate: 1, total_mxn: 865186.4, notes: '' },
  { id: 'bi52', project_id: 'demo-p1', category_id: 'cat-herreria', concept_id: 'con-est-metal', categories: { id: 'cat-herreria', name: 'Herreria' }, concepts: { id: 'con-est-metal', name: 'Estructura Metalica 13.2 Ton' }, detail: '', supplier: '', unit: 'Lote', quantity: 87, currency: 'MXN', unit_price: 13200, subtotal: 1148400, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 1148400, exchange_rate: 1, total_mxn: 1148400, notes: '' },
  { id: 'bi53', project_id: 'demo-p1', category_id: 'cat-herreria', concept_id: 'con-pint-auto', categories: { id: 'cat-herreria', name: 'Herreria' }, concepts: { id: 'con-pint-auto', name: 'Pintura Automotiva' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 455645.08, subtotal: 455645.08, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 455645.08, exchange_rate: 1, total_mxn: 455645.08, notes: '' },
  // Instalaciones Electricas
  { id: 'bi54', project_id: 'demo-p1', category_id: 'cat-electrica', concept_id: 'con-inst-elec', categories: { id: 'cat-electrica', name: 'Instalaciones Electricas' }, concepts: { id: 'con-inst-elec', name: 'Instalaciones Electricas' }, detail: '', supplier: 'PUGA', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 2833718.4, subtotal: 2833718.4, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 2833718.4, exchange_rate: 1, total_mxn: 2833718.4, notes: '' },
  // Instalaciones IHS
  { id: 'bi55', project_id: 'demo-p1', category_id: 'cat-ihs', concept_id: 'con-inst-hidra', categories: { id: 'cat-ihs', name: 'Instalaciones IHS' }, concepts: { id: 'con-inst-hidra', name: 'Instalaciones Hidraulicas' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 350000, subtotal: 350000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 56000, total: 406000, exchange_rate: 1, total_mxn: 406000, notes: '' },
  { id: 'bi56', project_id: 'demo-p1', category_id: 'cat-ihs', concept_id: 'con-inst-sanit', categories: { id: 'cat-ihs', name: 'Instalaciones IHS' }, concepts: { id: 'con-inst-sanit', name: 'Instalaciones Sanitarias' }, detail: '', supplier: '', unit: 'M2', quantity: 1257.35, currency: 'MXN', unit_price: 2457, subtotal: 3089308.95, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 3089308.95, exchange_rate: 1, total_mxn: 3089308.95, notes: '' },
  { id: 'bi57', project_id: 'demo-p1', category_id: 'cat-ihs', concept_id: 'con-sist-bombeo', categories: { id: 'cat-ihs', name: 'Instalaciones IHS' }, concepts: { id: 'con-sist-bombeo', name: 'Sistema De Bombeo Cisternas' }, detail: '', supplier: '', unit: 'Lote', quantity: 3, currency: 'MXN', unit_price: 55100, subtotal: 165300, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 165300, exchange_rate: 1, total_mxn: 165300, notes: '' },
  { id: 'bi58', project_id: 'demo-p1', category_id: 'cat-ihs', concept_id: 'con-cisterna', categories: { id: 'cat-ihs', name: 'Instalaciones IHS' }, concepts: { id: 'con-cisterna', name: 'Cisterna En Acero Inoxidable' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 0, subtotal: 0, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 0, exchange_rate: 1, total_mxn: 0, notes: '' },
  { id: 'bi59', project_id: 'demo-p1', category_id: 'cat-ihs', concept_id: 'con-spa', categories: { id: 'cat-ihs', name: 'Instalaciones IHS' }, concepts: { id: 'con-spa', name: 'Spa Vapor Sauna' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 1077586.21, subtotal: 1077586.21, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 172413.79, total: 1250000, exchange_rate: 1, total_mxn: 1250000, notes: '' },
  // Instalaciones Especiales
  { id: 'bi60', project_id: 'demo-p1', category_id: 'cat-especiales', concept_id: 'con-auto-asint', categories: { id: 'cat-especiales', name: 'Instalaciones Especiales' }, concepts: { id: 'con-auto-asint', name: 'Automatizacion Asintelix' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'USD', unit_price: 185000, subtotal: 185000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 185000, exchange_rate: 20, total_mxn: 3700000, notes: '' },
  // Instalaciones Gas
  { id: 'bi61', project_id: 'demo-p1', category_id: 'cat-gas', concept_id: 'con-inst-gas', categories: { id: 'cat-gas', name: 'Instalaciones De Gas' }, concepts: { id: 'con-inst-gas', name: 'Instalaciones De Gas' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 107792.07, subtotal: 107792.07, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 17246.73, total: 125038.8, exchange_rate: 1, total_mxn: 125038.8, notes: '' },
  { id: 'bi62', project_id: 'demo-p1', category_id: 'cat-gas', concept_id: 'con-tanque', categories: { id: 'cat-gas', name: 'Instalaciones De Gas' }, concepts: { id: 'con-tanque', name: 'Tanque Estacionario 5000 Lt' }, detail: '', supplier: '', unit: 'PZA', quantity: 1, currency: 'MXN', unit_price: 50000, subtotal: 50000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 8000, total: 58000, exchange_rate: 1, total_mxn: 58000, notes: '' },
  { id: 'bi63', project_id: 'demo-p1', category_id: 'cat-gas', concept_id: 'con-uvie', categories: { id: 'cat-gas', name: 'Instalaciones De Gas' }, concepts: { id: 'con-uvie', name: 'Verificacion Uvie' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 23500, subtotal: 23500, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 3760, total: 27260, exchange_rate: 1, total_mxn: 27260, notes: '' },
  // Aire Acondicionado Y Extraccion
  { id: 'bi64', project_id: 'demo-p1', category_id: 'cat-aa', concept_id: 'con-sist-aa', categories: { id: 'cat-aa', name: 'Aire Acondicionado Y Extraccion' }, concepts: { id: 'con-sist-aa', name: 'Sistema De Aire Acondicionado' }, detail: '', supplier: '', unit: 'M2', quantity: 0, currency: 'MXN', unit_price: 0, subtotal: 0, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 0, exchange_rate: 1, total_mxn: 0, notes: '' },
  { id: 'bi65', project_id: 'demo-p1', category_id: 'cat-aa', concept_id: 'con-minisplit', categories: { id: 'cat-aa', name: 'Aire Acondicionado Y Extraccion' }, concepts: { id: 'con-minisplit', name: 'Minisplit' }, detail: '', supplier: '', unit: 'PZA', quantity: 0, currency: 'MXN', unit_price: 0, subtotal: 0, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 0, exchange_rate: 1, total_mxn: 0, notes: '' },
  { id: 'bi66', project_id: 'demo-p1', category_id: 'cat-aa', concept_id: 'con-sist-ext', categories: { id: 'cat-aa', name: 'Aire Acondicionado Y Extraccion' }, concepts: { id: 'con-sist-ext', name: 'Sistema De Extraccion' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 286574.4, subtotal: 286574.4, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 45851.9, total: 332426.3, exchange_rate: 1, total_mxn: 332426.3, notes: '' },
  // Iluminacion
  { id: 'bi67', project_id: 'demo-p1', category_id: 'cat-iluminacion', concept_id: 'con-lum-inmueble', categories: { id: 'cat-iluminacion', name: 'Iluminacion' }, concepts: { id: 'con-lum-inmueble', name: 'Luminarias Inmueble' }, detail: '', supplier: '', unit: 'M2', quantity: 1257.35, currency: 'USD', unit_price: 70, subtotal: 88014.5, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 14082.32, total: 102096.82, exchange_rate: 20, total_mxn: 2041936.4, notes: '' },
  { id: 'bi68', project_id: 'demo-p1', category_id: 'cat-iluminacion', concept_id: 'con-lum-jardin', categories: { id: 'cat-iluminacion', name: 'Iluminacion' }, concepts: { id: 'con-lum-jardin', name: 'Luminarias Jardineria' }, detail: '', supplier: '', unit: 'M2', quantity: 345.34, currency: 'USD', unit_price: 35, subtotal: 12086.9, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 1933.9, total: 14020.8, exchange_rate: 20, total_mxn: 280416.08, notes: '' },
  // Marmol
  { id: 'bi69', project_id: 'demo-p1', category_id: 'cat-marmol', concept_id: 'con-sum-marm-pisos', categories: { id: 'cat-marmol', name: 'Marmol' }, concepts: { id: 'con-sum-marm-pisos', name: 'Suministro Marmol Pisos' }, detail: '', supplier: '', unit: 'M2', quantity: 540.06, currency: 'MXN', unit_price: 1700, subtotal: 918108.8, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 146897.41, total: 1065006.21, exchange_rate: 1, total_mxn: 1065006.21, notes: '' },
  { id: 'bi70', project_id: 'demo-p1', category_id: 'cat-marmol', concept_id: 'con-col-marm-pisos', categories: { id: 'cat-marmol', name: 'Marmol' }, concepts: { id: 'con-col-marm-pisos', name: 'Colocacion Marmol Pisos' }, detail: '', supplier: '', unit: 'M2', quantity: 385.76, currency: 'MXN', unit_price: 1639.28, subtotal: 632368.65, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 632368.65, exchange_rate: 1, total_mxn: 632368.65, notes: '' },
  { id: 'bi71', project_id: 'demo-p1', category_id: 'cat-marmol', concept_id: 'con-sum-marm-esc', categories: { id: 'cat-marmol', name: 'Marmol' }, concepts: { id: 'con-sum-marm-esc', name: 'Suministro Marmol Escaleras' }, detail: '', supplier: '', unit: 'M2', quantity: 61.52, currency: 'MXN', unit_price: 1700, subtotal: 104577.2, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 16732.35, total: 121309.55, exchange_rate: 1, total_mxn: 121309.55, notes: '' },
  { id: 'bi72', project_id: 'demo-p1', category_id: 'cat-marmol', concept_id: 'con-col-marm-esc', categories: { id: 'cat-marmol', name: 'Marmol' }, concepts: { id: 'con-col-marm-esc', name: 'Colocacion Marmol Escaleras' }, detail: '', supplier: '', unit: 'M2', quantity: 43.94, currency: 'MXN', unit_price: 2491.24, subtotal: 109465.09, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 109465.09, exchange_rate: 1, total_mxn: 109465.09, notes: '' },
  { id: 'bi73', project_id: 'demo-p1', category_id: 'cat-marmol', concept_id: 'con-sum-marm-muros', categories: { id: 'cat-marmol', name: 'Marmol' }, concepts: { id: 'con-sum-marm-muros', name: 'Suministro Marmol Muros' }, detail: '', supplier: '', unit: 'M2', quantity: 350.71, currency: 'MXN', unit_price: 1700, subtotal: 596213.8, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 95394.21, total: 691608.01, exchange_rate: 1, total_mxn: 691608.01, notes: '' },
  { id: 'bi74', project_id: 'demo-p1', category_id: 'cat-marmol', concept_id: 'con-col-marm-muros', categories: { id: 'cat-marmol', name: 'Marmol' }, concepts: { id: 'con-col-marm-muros', name: 'Colocacion Marmol Muros' }, detail: '', supplier: '', unit: 'M2', quantity: 250.51, currency: 'MXN', unit_price: 2381.78, subtotal: 596659.71, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 596659.71, exchange_rate: 1, total_mxn: 596659.71, notes: '' },
  { id: 'bi75', project_id: 'demo-p1', category_id: 'cat-marmol', concept_id: 'con-sum-marm-cub', categories: { id: 'cat-marmol', name: 'Marmol' }, concepts: { id: 'con-sum-marm-cub', name: 'Suministro Marmol Cubiertas Baños' }, detail: '', supplier: '', unit: 'M2', quantity: 42.94, currency: 'USD', unit_price: 1700, subtotal: 72994.6, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 11679.14, total: 84673.74, exchange_rate: 20.5, total_mxn: 1735811.59, notes: '' },
  { id: 'bi76', project_id: 'demo-p1', category_id: 'cat-marmol', concept_id: 'con-col-marm-cub', categories: { id: 'cat-marmol', name: 'Marmol' }, concepts: { id: 'con-col-marm-cub', name: 'Colocacion Marmol Cubiertas Baños' }, detail: '', supplier: '', unit: 'ML', quantity: 42.94, currency: 'MXN', unit_price: 4993.18, subtotal: 214397.16, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 214397.16, exchange_rate: 1, total_mxn: 214397.16, notes: '' },
  // Madera De Ingenieria Y Madera Solida
  { id: 'bi77', project_id: 'demo-p1', category_id: 'cat-madera', concept_id: 'con-mad-ing-pisos', categories: { id: 'cat-madera', name: 'Madera De Ingenieria Y Madera Solida' }, concepts: { id: 'con-mad-ing-pisos', name: 'Madera De Ingenieria En Pisos' }, detail: '', supplier: '', unit: 'M2', quantity: 344.97, currency: 'EUR', unit_price: 81.9, subtotal: 28251.94, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 4520.31, total: 32772.25, exchange_rate: 34, total_mxn: 1114256.33, notes: '' },
  { id: 'bi78', project_id: 'demo-p1', category_id: 'cat-madera', concept_id: 'con-mod-madera', categories: { id: 'cat-madera', name: 'Madera De Ingenieria Y Madera Solida' }, concepts: { id: 'con-mod-madera', name: 'Modulacion De Madera' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 33427.69, subtotal: 33427.69, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 33427.69, exchange_rate: 1, total_mxn: 33427.69, notes: '' },
  { id: 'bi79', project_id: 'demo-p1', category_id: 'cat-madera', concept_id: 'con-autonivelante', categories: { id: 'cat-madera', name: 'Madera De Ingenieria Y Madera Solida' }, concepts: { id: 'con-autonivelante', name: 'Autonivelante' }, detail: '', supplier: '', unit: 'M2', quantity: 313.61, currency: 'MXN', unit_price: 330.75, subtotal: 103726.51, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 16596.24, total: 120322.75, exchange_rate: 1, total_mxn: 120322.75, notes: '' },
  { id: 'bi80', project_id: 'demo-p1', category_id: 'cat-madera', concept_id: 'con-membrana', categories: { id: 'cat-madera', name: 'Madera De Ingenieria Y Madera Solida' }, concepts: { id: 'con-membrana', name: 'Membrana Tektil' }, detail: '', supplier: '', unit: 'M2', quantity: 313.61, currency: 'MXN', unit_price: 153.3, subtotal: 48076.95, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 7692.31, total: 55769.27, exchange_rate: 1, total_mxn: 55769.27, notes: '' },
  { id: 'bi81', project_id: 'demo-p1', category_id: 'cat-madera', concept_id: 'con-roble-plafon', categories: { id: 'cat-madera', name: 'Madera De Ingenieria Y Madera Solida' }, concepts: { id: 'con-roble-plafon', name: 'Madera Roble En Plafones' }, detail: '', supplier: '', unit: 'M2', quantity: 158.4, currency: 'MXN', unit_price: 2844.83, subtotal: 450620.69, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 72099.31, total: 522720, exchange_rate: 1, total_mxn: 522720, notes: '' },
  { id: 'bi82', project_id: 'demo-p1', category_id: 'cat-madera', concept_id: 'con-roble-vanos', categories: { id: 'cat-madera', name: 'Madera De Ingenieria Y Madera Solida' }, concepts: { id: 'con-roble-vanos', name: 'Madera Roble En Vanos Ventanas' }, detail: '', supplier: '', unit: 'M2', quantity: 13, currency: 'MXN', unit_price: 2844.83, subtotal: 36982.76, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 5917.24, total: 42900, exchange_rate: 1, total_mxn: 42900, notes: '' },
  { id: 'bi83', project_id: 'demo-p1', category_id: 'cat-madera', concept_id: 'con-bastidor', categories: { id: 'cat-madera', name: 'Madera De Ingenieria Y Madera Solida' }, concepts: { id: 'con-bastidor', name: 'Bastidor Triplay 13 Mm' }, detail: '', supplier: '', unit: 'M2', quantity: 158.4, currency: 'MXN', unit_price: 1500, subtotal: 237600, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 38016, total: 275616, exchange_rate: 1, total_mxn: 275616, notes: '' },
  // Vidrios Y Canceles
  { id: 'bi84', project_id: 'demo-p1', category_id: 'cat-vidrios', concept_id: 'con-canc-venster', categories: { id: 'cat-vidrios', name: 'Vidrios Y Canceles' }, concepts: { id: 'con-canc-venster', name: 'Canceles Y Vidrios Venster' }, detail: '', supplier: '', unit: 'M2', quantity: 286.54, currency: 'EUR', unit_price: 558.3, subtotal: 159975.28, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 25596.05, total: 185571.33, exchange_rate: 22, total_mxn: 4082569.2, notes: '' },
  { id: 'bi85', project_id: 'demo-p1', category_id: 'cat-vidrios', concept_id: 'con-canc-comun', categories: { id: 'cat-vidrios', name: 'Vidrios Y Canceles' }, concepts: { id: 'con-canc-comun', name: 'Canceles Y Vidrios Comun' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 130414.34, subtotal: 130414.34, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 20866.29, total: 151280.63, exchange_rate: 1, total_mxn: 151280.63, notes: '' },
  { id: 'bi86', project_id: 'demo-p1', category_id: 'cat-vidrios', concept_id: 'con-vid-temp', categories: { id: 'cat-vidrios', name: 'Vidrios Y Canceles' }, concepts: { id: 'con-vid-temp', name: 'Vidrios Templados Baños 10mm' }, detail: '', supplier: '', unit: 'PZA', quantity: 6, currency: 'MXN', unit_price: 25862.07, subtotal: 155172.41, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 24827.59, total: 180000, exchange_rate: 1, total_mxn: 180000, notes: '' },
  { id: 'bi87', project_id: 'demo-p1', category_id: 'cat-vidrios', concept_id: 'con-herrajes-temp', categories: { id: 'cat-vidrios', name: 'Vidrios Y Canceles' }, concepts: { id: 'con-herrajes-temp', name: 'Herrajes Puertas Templadas' }, detail: '', supplier: '', unit: 'Lote', quantity: 6, currency: 'MXN', unit_price: 7500, subtotal: 45000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 7200, total: 52200, exchange_rate: 1, total_mxn: 52200, notes: '' },
  { id: 'bi88', project_id: 'demo-p1', category_id: 'cat-vidrios', concept_id: 'con-vid-caseta', categories: { id: 'cat-vidrios', name: 'Vidrios Y Canceles' }, concepts: { id: 'con-vid-caseta', name: 'Vidrios Seguridad Caseta' }, detail: '', supplier: '', unit: 'Lote', quantity: 0, currency: 'MXN', unit_price: 0, subtotal: 0, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 0, exchange_rate: 1, total_mxn: 0, notes: '' },
  { id: 'bi89', project_id: 'demo-p1', category_id: 'cat-vidrios', concept_id: 'con-espejos', categories: { id: 'cat-vidrios', name: 'Vidrios Y Canceles' }, concepts: { id: 'con-espejos', name: 'Espejos En Baños' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 75530, subtotal: 75530, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 75530, exchange_rate: 1, total_mxn: 75530, notes: '' },
  // Cocinas
  { id: 'bi90', project_id: 'demo-p1', category_id: 'cat-cocinas', concept_id: 'con-cocina-princ', categories: { id: 'cat-cocinas', name: 'Cocinas' }, concepts: { id: 'con-cocina-princ', name: 'Cocina Principal' }, detail: '', supplier: '', unit: 'PZA', quantity: 1, currency: 'EUR', unit_price: 41546.36, subtotal: 41546.36, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 6647.42, total: 48193.78, exchange_rate: 22, total_mxn: 1060263.16, notes: '' },
  { id: 'bi91', project_id: 'demo-p1', category_id: 'cat-cocinas', concept_id: 'con-equip-cocina', categories: { id: 'cat-cocinas', name: 'Cocinas' }, concepts: { id: 'con-equip-cocina', name: 'Equipos Cocina' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'USD', unit_price: 41287.18, subtotal: 41287.18, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 6605.95, total: 47893.13, exchange_rate: 20, total_mxn: 957862.6, notes: '' },
  { id: 'bi92', project_id: 'demo-p1', category_id: 'cat-cocinas', concept_id: 'con-acc-cocina', categories: { id: 'cat-cocinas', name: 'Cocinas' }, concepts: { id: 'con-acc-cocina', name: 'Accesorios Cocina' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 77256.53, subtotal: 77256.53, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 12361.05, total: 89617.58, exchange_rate: 1, total_mxn: 89617.58, notes: '' },
  { id: 'bi93', project_id: 'demo-p1', category_id: 'cat-cocinas', concept_id: 'con-cub-cocina', categories: { id: 'cat-cocinas', name: 'Cocinas' }, concepts: { id: 'con-cub-cocina', name: 'Cubierta Cocina' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'USD', unit_price: 10822.6, subtotal: 10822.6, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 1731.62, total: 12554.22, exchange_rate: 20, total_mxn: 251084.4, notes: '' },
  { id: 'bi94', project_id: 'demo-p1', category_id: 'cat-cocinas', concept_id: 'con-electro', categories: { id: 'cat-cocinas', name: 'Cocinas' }, concepts: { id: 'con-electro', name: 'Electrodomesticos' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'USD', unit_price: 25000, subtotal: 25000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 4000, total: 29000, exchange_rate: 20, total_mxn: 580000, notes: '' },
  // M De Baño Griferia Y Accesorios De Baño
  { id: 'bi95', project_id: 'demo-p1', category_id: 'cat-bano', concept_id: 'con-mueb-grif-princ', categories: { id: 'cat-bano', name: 'M De Baño Griferia Y Accesorios De Baño' }, concepts: { id: 'con-mueb-grif-princ', name: 'Muebles Y Griferia Principal' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 932790.88, subtotal: 932790.88, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 149246.54, total: 1082037.42, exchange_rate: 1, total_mxn: 1082037.42, notes: '' },
  { id: 'bi96', project_id: 'demo-p1', category_id: 'cat-bano', concept_id: 'con-acc-princ', categories: { id: 'cat-bano', name: 'M De Baño Griferia Y Accesorios De Baño' }, concepts: { id: 'con-acc-princ', name: 'Accesorios Principales' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 65295.36, subtotal: 65295.36, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 10447.26, total: 75742.62, exchange_rate: 1, total_mxn: 75742.62, notes: '' },
  { id: 'bi97', project_id: 'demo-p1', category_id: 'cat-bano', concept_id: 'con-col-princ', categories: { id: 'cat-bano', name: 'M De Baño Griferia Y Accesorios De Baño' }, concepts: { id: 'con-col-princ', name: 'Colocacion Principales' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 81044.6, subtotal: 81044.6, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 81044.6, exchange_rate: 1, total_mxn: 81044.6, notes: '' },
  { id: 'bi98', project_id: 'demo-p1', category_id: 'cat-bano', concept_id: 'con-mueb-grif-serv', categories: { id: 'cat-bano', name: 'M De Baño Griferia Y Accesorios De Baño' }, concepts: { id: 'con-mueb-grif-serv', name: 'Muebles Y Griferia Servicio' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 96982.76, subtotal: 96982.76, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 15517.24, total: 112500, exchange_rate: 1, total_mxn: 112500, notes: '' },
  { id: 'bi99', project_id: 'demo-p1', category_id: 'cat-bano', concept_id: 'con-acc-serv', categories: { id: 'cat-bano', name: 'M De Baño Griferia Y Accesorios De Baño' }, concepts: { id: 'con-acc-serv', name: 'Accesorios De Baño Servicios' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 7875, subtotal: 7875, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 1260, total: 9135, exchange_rate: 1, total_mxn: 9135, notes: '' },
  { id: 'bi100', project_id: 'demo-p1', category_id: 'cat-bano', concept_id: 'con-col-serv', categories: { id: 'cat-bano', name: 'M De Baño Griferia Y Accesorios De Baño' }, concepts: { id: 'con-col-serv', name: 'Colocacion Servicios' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 8514.45, subtotal: 8514.45, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 8514.45, exchange_rate: 1, total_mxn: 8514.45, notes: '' },
  // Vestidores Importacion
  { id: 'bi101', project_id: 'demo-p1', category_id: 'cat-vestidores', concept_id: 'con-vest-princ', categories: { id: 'cat-vestidores', name: 'Vestidores Importacion' }, concepts: { id: 'con-vest-princ', name: 'Vestidores Principales' }, detail: '', supplier: '', unit: 'PZA', quantity: 2, currency: 'USD', unit_price: 45500, subtotal: 91000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 91000, exchange_rate: 20, total_mxn: 1820000, notes: '' },
  { id: 'bi102', project_id: 'demo-p1', category_id: 'cat-vestidores', concept_id: 'con-vest-rec', categories: { id: 'cat-vestidores', name: 'Vestidores Importacion' }, concepts: { id: 'con-vest-rec', name: 'Vestidores Recamaras 1 2 3 Y 4' }, detail: '', supplier: '', unit: 'PZA', quantity: 4, currency: 'USD', unit_price: 19500, subtotal: 78000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 78000, exchange_rate: 20, total_mxn: 1560000, notes: '' },
  // Carpinteria Fina
  { id: 'bi103', project_id: 'demo-p1', category_id: 'cat-carpinteria', concept_id: 'con-puertas-princ', categories: { id: 'cat-carpinteria', name: 'Carpinteria Fina' }, concepts: { id: 'con-puertas-princ', name: 'Puertas Intercomunicacion Principales' }, detail: '', supplier: '', unit: 'PZA', quantity: 16, currency: 'MXN', unit_price: 39000, subtotal: 624000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 624000, exchange_rate: 1, total_mxn: 624000, notes: '' },
  { id: 'bi104', project_id: 'demo-p1', category_id: 'cat-carpinteria', concept_id: 'con-puertas-corr', categories: { id: 'cat-carpinteria', name: 'Carpinteria Fina' }, concepts: { id: 'con-puertas-corr', name: 'Puertas Intercomunicacion Corrediza' }, detail: '', supplier: '', unit: 'PZA', quantity: 1, currency: 'MXN', unit_price: 82800, subtotal: 82800, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 82800, exchange_rate: 1, total_mxn: 82800, notes: '' },
  { id: 'bi105', project_id: 'demo-p1', category_id: 'cat-carpinteria', concept_id: 'con-puertas-sec', categories: { id: 'cat-carpinteria', name: 'Carpinteria Fina' }, concepts: { id: 'con-puertas-sec', name: 'Puertas Intercomunicacion Secundarias' }, detail: '', supplier: '', unit: 'PZA', quantity: 13, currency: 'MXN', unit_price: 22500, subtotal: 292500, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 292500, exchange_rate: 1, total_mxn: 292500, notes: '' },
  { id: 'bi106', project_id: 'demo-p1', category_id: 'cat-carpinteria', concept_id: 'con-bajolav-princ', categories: { id: 'cat-carpinteria', name: 'Carpinteria Fina' }, concepts: { id: 'con-bajolav-princ', name: 'Bajolavabos Recamara Principal' }, detail: '', supplier: '', unit: 'PZA', quantity: 1, currency: 'MXN', unit_price: 75000, subtotal: 75000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 75000, exchange_rate: 1, total_mxn: 75000, notes: '' },
  { id: 'bi107', project_id: 'demo-p1', category_id: 'cat-carpinteria', concept_id: 'con-bajolav-rec', categories: { id: 'cat-carpinteria', name: 'Carpinteria Fina' }, concepts: { id: 'con-bajolav-rec', name: 'Bajolavabos Recamaras 1 2 Y 3' }, detail: '', supplier: '', unit: 'PZA', quantity: 3, currency: 'MXN', unit_price: 75000, subtotal: 225000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 225000, exchange_rate: 1, total_mxn: 225000, notes: '' },
  { id: 'bi108', project_id: 'demo-p1', category_id: 'cat-carpinteria', concept_id: 'con-bajolav-serv', categories: { id: 'cat-carpinteria', name: 'Carpinteria Fina' }, concepts: { id: 'con-bajolav-serv', name: 'Bajolavabos Servicios' }, detail: '', supplier: '', unit: 'PZA', quantity: 3, currency: 'MXN', unit_price: 15000, subtotal: 45000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 45000, exchange_rate: 1, total_mxn: 45000, notes: '' },
  { id: 'bi109', project_id: 'demo-p1', category_id: 'cat-carpinteria', concept_id: 'con-alacena', categories: { id: 'cat-carpinteria', name: 'Carpinteria Fina' }, concepts: { id: 'con-alacena', name: 'Alacena Mueble' }, detail: '', supplier: '', unit: 'PZA', quantity: 1, currency: 'MXN', unit_price: 115000, subtotal: 115000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 115000, exchange_rate: 1, total_mxn: 115000, notes: '' },
  { id: 'bi110', project_id: 'demo-p1', category_id: 'cat-carpinteria', concept_id: 'con-chapas-princ', categories: { id: 'cat-carpinteria', name: 'Carpinteria Fina' }, concepts: { id: 'con-chapas-princ', name: 'Chapas Puertas Principales' }, detail: '', supplier: '', unit: 'PZA', quantity: 18, currency: 'MXN', unit_price: 6000, subtotal: 108000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 108000, exchange_rate: 1, total_mxn: 108000, notes: '' },
  { id: 'bi111', project_id: 'demo-p1', category_id: 'cat-carpinteria', concept_id: 'con-chapas-sec', categories: { id: 'cat-carpinteria', name: 'Carpinteria Fina' }, concepts: { id: 'con-chapas-sec', name: 'Chapas Secundarias' }, detail: '', supplier: '', unit: 'PZA', quantity: 13, currency: 'MXN', unit_price: 1750, subtotal: 22750, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 22750, exchange_rate: 1, total_mxn: 22750, notes: '' },
  { id: 'bi112', project_id: 'demo-p1', category_id: 'cat-carpinteria', concept_id: 'con-louvers', categories: { id: 'cat-carpinteria', name: 'Carpinteria Fina' }, concepts: { id: 'con-louvers', name: 'Puertas Louvers Metalicas' }, detail: '', supplier: '', unit: 'PZA', quantity: 2, currency: 'MXN', unit_price: 18500, subtotal: 37000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 37000, exchange_rate: 1, total_mxn: 37000, notes: '' },
  { id: 'bi113', project_id: 'demo-p1', category_id: 'cat-carpinteria', concept_id: 'con-closets-serv', categories: { id: 'cat-carpinteria', name: 'Carpinteria Fina' }, concepts: { id: 'con-closets-serv', name: 'Closets Servicio' }, detail: '', supplier: '', unit: 'PZA', quantity: 2, currency: 'MXN', unit_price: 45000, subtotal: 90000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 90000, exchange_rate: 1, total_mxn: 90000, notes: '' },
  { id: 'bi114', project_id: 'demo-p1', category_id: 'cat-carpinteria', concept_id: 'con-puertas-esp', categories: { id: 'cat-carpinteria', name: 'Carpinteria Fina' }, concepts: { id: 'con-puertas-esp', name: 'Puertas Especiales' }, detail: '', supplier: '', unit: 'PZA', quantity: 3, currency: 'MXN', unit_price: 42000, subtotal: 126000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 126000, exchange_rate: 1, total_mxn: 126000, notes: '' },
  { id: 'bi115', project_id: 'demo-p1', category_id: 'cat-carpinteria', concept_id: 'con-bajolav-vis', categories: { id: 'cat-carpinteria', name: 'Carpinteria Fina' }, concepts: { id: 'con-bajolav-vis', name: 'Bajolavabos Visitas' }, detail: '', supplier: '', unit: 'PZA', quantity: 1, currency: 'MXN', unit_price: 25500, subtotal: 25500, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 25500, exchange_rate: 1, total_mxn: 25500, notes: '' },
  { id: 'bi116', project_id: 'demo-p1', category_id: 'cat-carpinteria', concept_id: 'con-topes-princ', categories: { id: 'cat-carpinteria', name: 'Carpinteria Fina' }, concepts: { id: 'con-topes-princ', name: 'Topes Principales' }, detail: '', supplier: '', unit: 'PZA', quantity: 18, currency: 'MXN', unit_price: 125, subtotal: 2250, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 2250, exchange_rate: 1, total_mxn: 2250, notes: '' },
  { id: 'bi117', project_id: 'demo-p1', category_id: 'cat-carpinteria', concept_id: 'con-topes-sec', categories: { id: 'cat-carpinteria', name: 'Carpinteria Fina' }, concepts: { id: 'con-topes-sec', name: 'Topes Secundarios' }, detail: '', supplier: '', unit: 'PZA', quantity: 13, currency: 'MXN', unit_price: 75, subtotal: 975, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 975, exchange_rate: 1, total_mxn: 975, notes: '' },
  // Jardineria Y Riego
  { id: 'bi118', project_id: 'demo-p1', category_id: 'cat-jardineria', concept_id: 'con-jardineria', categories: { id: 'cat-jardineria', name: 'Jardineria Y Riego' }, concepts: { id: 'con-jardineria', name: 'Jardineria' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 2500000, subtotal: 2500000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0, vat_amount: 0, total: 2500000, exchange_rate: 1, total_mxn: 2500000, notes: '' },
  { id: 'bi119', project_id: 'demo-p1', category_id: 'cat-jardineria', concept_id: 'con-sist-riego', categories: { id: 'cat-jardineria', name: 'Jardineria Y Riego' }, concepts: { id: 'con-sist-riego', name: 'Sistema De Riego' }, detail: '', supplier: '', unit: 'Lote', quantity: 1, currency: 'MXN', unit_price: 300000, subtotal: 300000, surcharge_pct: 0, surcharge_amount: 0, vat_pct: 0.16, vat_amount: 48000, total: 348000, exchange_rate: 1, total_mxn: 348000, notes: '' },
]

export function useBudget(projectId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    if (!projectId) { setItems([]); setLoading(false); return }
    setLoading(true)

    if (DEMO_MODE) {
      const filtered = DEMO_BUDGET_ITEMS.filter(i => i.project_id === projectId)
      setItems(filtered)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('budget_items')
      .select(`
        *,
        categories:category_id ( id, name ),
        concepts:concept_id ( id, name )
      `)
      .eq('project_id', projectId)
      .order('created_at')

    if (!error) setItems(data || [])
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchItems() }, [fetchItems])

  const importBatch = async (parsedItems, projectId) => {
    if (DEMO_MODE) {
      const newItems = parsedItems.filter(i => i.category).map((item, idx) => ({
        id: 'bi-demo-' + Date.now() + '-' + idx,
        project_id: projectId,
        category_id: 'cat-demo-' + idx,
        concept_id: item.concept ? 'con-demo-' + idx : null,
        categories: { id: 'cat-demo-' + idx, name: item.category },
        concepts: item.concept ? { id: 'con-demo-' + idx, name: item.concept } : null,
        detail: item.detail || null,
        supplier: item.supplier || null,
        unit: item.unit || null,
        quantity: item.quantity || 0,
        currency: item.currency || 'MXN',
        unit_price: item.unit_price || 0,
        subtotal: item.subtotal || 0,
        surcharge_pct: item.surcharge_pct || 0,
        surcharge_amount: item.surcharge_amount || 0,
        vat_pct: item.vat_pct || 0,
        vat_amount: item.vat_amount || 0,
        total: item.total || 0,
        exchange_rate: item.exchange_rate || 1,
        total_mxn: item.total_mxn || 0,
        notes: item.notes || null,
      }))
      setItems(prev => [...prev, ...newItems])
      return newItems.length
    }

    // 1. Get or create categories and concepts
    const categoryMap = {}
    const conceptMap = {}

    for (const item of parsedItems) {
      if (!item.category) continue

      if (!categoryMap[item.category]) {
        let { data: existing } = await supabase
          .from('categories')
          .select('id')
          .eq('project_id', projectId)
          .eq('name', item.category)
          .single()

        if (!existing) {
          const { data: created } = await supabase
            .from('categories')
            .insert({ project_id: projectId, name: item.category })
            .select('id')
            .single()
          existing = created
        }
        categoryMap[item.category] = existing.id
      }

      if (item.concept) {
        const key = `${item.category}__${item.concept}`
        if (!conceptMap[key]) {
          const categoryId = categoryMap[item.category]
          let { data: existing } = await supabase
            .from('concepts')
            .select('id')
            .eq('category_id', categoryId)
            .eq('name', item.concept)
            .single()

          if (!existing) {
            const { data: created } = await supabase
              .from('concepts')
              .insert({ category_id: categoryId, name: item.concept })
              .select('id')
              .single()
            existing = created
          }
          conceptMap[key] = existing.id
        }
      }
    }

    // 2. Insert budget items
    const rows = parsedItems.filter(i => i.category).map(item => ({
      project_id: projectId,
      category_id: categoryMap[item.category],
      concept_id: item.concept ? conceptMap[`${item.category}__${item.concept}`] : null,
      detail: item.detail || null,
      supplier: item.supplier || null,
      unit: item.unit || null,
      quantity: item.quantity || 0,
      currency: ['MXN', 'USD', 'EUR'].includes(item.currency) ? item.currency : 'MXN',
      unit_price: item.unit_price || 0,
      subtotal: item.subtotal || 0,
      surcharge_pct: item.surcharge_pct || 0,
      surcharge_amount: item.surcharge_amount || 0,
      vat_pct: item.vat_pct || 0,
      vat_amount: item.vat_amount || 0,
      total: item.total || 0,
      exchange_rate: item.exchange_rate || 1,
      total_mxn: item.total_mxn || 0,
      notes: item.notes || null,
    }))

    // Insert in batches of 50
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50)
      const { error } = await supabase.from('budget_items').insert(batch)
      if (error) throw error
    }

    await fetchItems()
    return rows.length
  }

  const updateItem = async (id, updates) => {
    if (DEMO_MODE) {
      setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
      return
    }
    const { error } = await supabase
      .from('budget_items')
      .update(updates)
      .eq('id', id)
    if (error) throw error
    await fetchItems()
  }

  const deleteItem = async (id) => {
    if (DEMO_MODE) {
      setItems(prev => prev.filter(item => item.id !== id))
      return
    }
    const { error } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', id)
    if (error) throw error
    await fetchItems()
  }

  // Group items by category, then by concept
  const grouped = items.reduce((acc, item) => {
    const catName = item.categories?.name || 'Sin categoría'
    const catId = item.category_id
    if (!acc[catId]) {
      acc[catId] = { id: catId, name: catName, concepts: {}, total: 0 }
    }
    acc[catId].total += Number(item.total_mxn) || 0

    const conName = item.concepts?.name || 'Sin concepto'
    const conId = item.concept_id || 'none'
    if (!acc[catId].concepts[conId]) {
      acc[catId].concepts[conId] = { id: conId, name: conName, items: [], total: 0 }
    }
    acc[catId].concepts[conId].items.push(item)
    acc[catId].concepts[conId].total += Number(item.total_mxn) || 0

    return acc
  }, {})

  const addItem = async (itemData) => {
    if (DEMO_MODE) {
      const id = 'bi-demo-' + Date.now()
      const newItem = {
        id,
        project_id: projectId,
        category_id: itemData.category_id,
        concept_id: itemData.concept_id,
        categories: { id: itemData.category_id, name: itemData.category_name },
        concepts: { id: itemData.concept_id, name: itemData.concept_name },
        detail: itemData.detail || '',
        supplier: itemData.supplier || '',
        unit: itemData.unit || '',
        quantity: itemData.quantity || 0,
        currency: itemData.currency || 'MXN',
        unit_price: itemData.unit_price || 0,
        subtotal: itemData.subtotal || 0,
        surcharge_pct: itemData.surcharge_pct || 0,
        surcharge_amount: itemData.surcharge_amount || 0,
        vat_pct: itemData.vat_pct || 0,
        vat_amount: itemData.vat_amount || 0,
        total: itemData.total || 0,
        exchange_rate: itemData.exchange_rate || 1,
        total_mxn: itemData.total_mxn || 0,
        notes: itemData.notes || '',
      }
      setItems(prev => [...prev, newItem])
      return newItem
    }

    const row = {
      project_id: projectId,
      category_id: itemData.category_id,
      concept_id: itemData.concept_id,
      detail: itemData.detail || null,
      supplier: itemData.supplier || null,
      unit: itemData.unit || null,
      quantity: itemData.quantity || 0,
      currency: itemData.currency || 'MXN',
      unit_price: itemData.unit_price || 0,
      subtotal: itemData.subtotal || 0,
      surcharge_pct: itemData.surcharge_pct || 0,
      surcharge_amount: itemData.surcharge_amount || 0,
      vat_pct: itemData.vat_pct || 0,
      vat_amount: itemData.vat_amount || 0,
      total: itemData.total || 0,
      exchange_rate: itemData.exchange_rate || 1,
      total_mxn: itemData.total_mxn || 0,
      notes: itemData.notes || null,
    }
    const { error } = await supabase.from('budget_items').insert(row)
    if (error) throw error
    await fetchItems()
  }

  const addCategory = async (name) => {
    if (DEMO_MODE) {
      const id = 'cat-demo-' + Date.now()
      const placeholder = {
        id: 'bi-placeholder-' + Date.now(),
        project_id: projectId,
        category_id: id,
        concept_id: null,
        categories: { id, name },
        concepts: null,
        detail: '',
        supplier: '',
        unit: '',
        quantity: 0,
        currency: 'MXN',
        unit_price: 0,
        subtotal: 0,
        surcharge_pct: 0,
        surcharge_amount: 0,
        vat_pct: 0,
        vat_amount: 0,
        total: 0,
        exchange_rate: 1,
        total_mxn: 0,
        notes: '',
        _placeholder: true,
      }
      setItems(prev => [...prev, placeholder])
      return { id, name }
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({ project_id: projectId, name })
      .select('id, name')
      .single()
    if (error) throw error
    return data
  }

  const addConcept = async (categoryId, categoryName, name) => {
    if (DEMO_MODE) {
      const id = 'con-demo-' + Date.now()
      const placeholder = {
        id: 'bi-placeholder-' + Date.now(),
        project_id: projectId,
        category_id: categoryId,
        concept_id: id,
        categories: { id: categoryId, name: categoryName },
        concepts: { id, name },
        detail: '',
        supplier: '',
        unit: '',
        quantity: 0,
        currency: 'MXN',
        unit_price: 0,
        subtotal: 0,
        surcharge_pct: 0,
        surcharge_amount: 0,
        vat_pct: 0,
        vat_amount: 0,
        total: 0,
        exchange_rate: 1,
        total_mxn: 0,
        notes: '',
        _placeholder: true,
      }
      // Remove existing placeholder for this category if it has no concept
      setItems(prev => {
        const filtered = prev.filter(i => !(i._placeholder && i.category_id === categoryId && !i.concept_id))
        return [...filtered, placeholder]
      })
      return { id, name }
    }

    const { data, error } = await supabase
      .from('concepts')
      .insert({ category_id: categoryId, name })
      .select('id, name')
      .single()
    if (error) throw error
    return data
  }

  const updateCategory = async (categoryId, name) => {
    if (DEMO_MODE) {
      setItems(prev => prev.map(item =>
        item.category_id === categoryId
          ? { ...item, categories: { ...item.categories, name } }
          : item
      ))
      return
    }
    const { error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', categoryId)
    if (error) throw error
    await fetchItems()
  }

  const updateConcept = async (conceptId, name) => {
    if (DEMO_MODE) {
      setItems(prev => prev.map(item =>
        item.concept_id === conceptId
          ? { ...item, concepts: { ...item.concepts, name } }
          : item
      ))
      return
    }
    const { error } = await supabase
      .from('concepts')
      .update({ name })
      .eq('id', conceptId)
    if (error) throw error
    await fetchItems()
  }

  const grandTotal = items.reduce((sum, i) => sum + (Number(i.total_mxn) || 0), 0)

  return {
    items, grouped, grandTotal, loading,
    importBatch, updateItem, deleteItem, addItem,
    addCategory, addConcept, updateCategory, updateConcept,
    refresh: fetchItems,
  }
}
