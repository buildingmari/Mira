/**
 * MIRA Dashboard — React port dari mira-dashboard_(1)-3.html
 * Fix: semua selector di-scope dengan #screen-app → specificity lebih tinggi
 * dari mira-landing.css (0,2,0 vs 0,1,0) → zero konflik dijamin.
 * Warna-warna critical di-hardcode agar tidak bergantung CSS variable resolution.
 */
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { PendingAssessmentGate } from '../components/PendingAssessmentGate';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

/* ─────────────────────────────────────────────
   CSS — fully scoped under #screen-app
   Specificity: 0,2,0 beats any 0,1,0 from bundle
───────────────────────────────────────────── */
const CSS = `
/* ── GLOBAL RESET (keeps dashboard locked) ── */
html,body{height:100%;overflow:hidden!important}
body{font-family:'DM Sans',sans-serif!important;font-size:15px;line-height:1.6;color:#334155;background:#F8FAFC}

/* ── CSS VARIABLES (scoped + root) ── */
:root,#screen-app{
  --blue:#2D4BFF;--blue-dark:#1F35B8;--blue-light:#6C82FF;--blue-ultra:#E9EDFF;
  --cyan:#22D3EE;--gradient:linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%);
  --success:#16A34A;--success-bg:#DCFCE7;
  --warning:#F59E0B;--warning-bg:#FEF3C7;
  --error:#DC2626;--error-bg:#FEE2E2;
  --text-dark:#0F172A;--text-body:#334155;--text-muted:#64748B;
  --border:#E2E8F0;--surface:#F8FAFC;--bg:#FFFFFF;
  --sidebar-w:240px;
  --sh-sm:0 1px 3px rgba(0,0,0,.07);
  --sh-md:0 4px 16px rgba(45,75,255,.10),0 1px 4px rgba(0,0,0,.05);
  --sh-lg:0 20px 60px rgba(45,75,255,.12),0 4px 16px rgba(0,0,0,.07);
  --r:16px;
}

/* ── HEADINGS ── */
#screen-app h1,#screen-app h2,#screen-app h3,#screen-app h4{
  font-family:'Sora',sans-serif!important;color:#0F172A!important;margin:0;padding:0;
}

/* ── BUTTONS ── */
#screen-app .btn{
  display:inline-flex!important;align-items:center;justify-content:center;gap:8px;
  background:linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%)!important;
  color:#fff!important;padding:13px 26px;border-radius:100px;
  font-family:'Sora',sans-serif;font-weight:700;font-size:.9rem;
  border:none!important;cursor:pointer;
  transition:opacity .2s,transform .15s,box-shadow .2s;width:100%;
  text-decoration:none;line-height:normal;
}
#screen-app .btn:hover{opacity:.92;transform:translateY(-1px);box-shadow:0 8px 24px rgba(45,75,255,.3)}
#screen-app .btn:active{transform:none}
#screen-app .btn:disabled{opacity:.4;cursor:not-allowed}
#screen-app .btn-outline{background:transparent!important;color:#2D4BFF!important;border:1.5px solid #2D4BFF!important}
#screen-app .btn-outline:hover{background:#E9EDFF!important;box-shadow:none}
#screen-app .btn-ghost{background:transparent!important;color:#64748B!important;border:1px solid #E2E8F0!important}
#screen-app .btn-ghost:hover{background:#F8FAFC!important;box-shadow:none;color:#0F172A!important}
#screen-app .btn-sm{padding:8px 18px!important;font-size:.82rem!important;width:auto!important}
#screen-app .btn-danger{background:#FEE2E2!important;color:#DC2626!important;border:1px solid #FECACA!important}
#screen-app .btn-danger:hover{background:#FECACA!important;box-shadow:none}
#screen-app .btn-white{background:#fff!important;color:#2D4BFF!important}
#screen-app .btn-white:hover{box-shadow:0 8px 24px rgba(0,0,0,.15)}

/* ── LAYOUT ── */
#screen-app{
  display:flex!important;flex-direction:row!important;
  height:100vh!important;width:100vw!important;overflow:hidden!important;
  background:#F8FAFC!important;box-sizing:border-box;
}
#screen-app .sidebar{
  width:240px!important;min-width:240px!important;max-width:240px!important;flex-basis:240px!important;
  background:#fff!important;
  border-right:1px solid #E2E8F0!important;
  display:flex!important;flex-direction:column!important;
  flex-shrink:0!important;flex-grow:0!important;
  z-index:50!important;overflow:hidden!important;
  height:100vh!important;box-sizing:border-box!important;
  transition:transform .3s ease;
}
#screen-app .sb-logo{
  padding:22px 20px 18px!important;border-bottom:1px solid #E2E8F0!important;
}
#screen-app .sb-logo .logo-t{
  font-family:'Sora',sans-serif!important;font-weight:800!important;font-size:1.45rem!important;
  background:linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%)!important;
  -webkit-background-clip:text!important;-webkit-text-fill-color:transparent!important;
  background-clip:text!important;display:block!important;line-height:1.3!important;
}
#screen-app .sb-logo .logo-s{
  font-size:.72rem!important;color:#64748B!important;margin-top:1px!important;display:block!important;
}
/* nav-menu pakai <div>, sehingga Navigation.css nav{} tidak berlaku sama sekali */
#screen-app .nav-menu{
  flex:1!important;padding:14px 10px!important;
  display:flex!important;flex-direction:column!important;
  gap:3px!important;overflow-y:auto!important;
}
#screen-app .nav-item{
  display:flex!important;align-items:center!important;gap:11px!important;
  padding:11px 13px!important;border-radius:11px!important;cursor:pointer;
  transition:background .15s,color .15s;color:#64748B!important;
  font-size:.88rem!important;font-weight:500!important;font-family:'DM Sans',sans-serif!important;
  user-select:none;border:none!important;background:none!important;
  width:100%!important;text-align:left!important;line-height:1.4!important;
}
#screen-app .nav-item:hover{background:#F8FAFC!important;color:#0F172A!important}
#screen-app .nav-item.active{background:#E9EDFF!important;color:#2D4BFF!important;font-weight:700!important}
#screen-app .nav-icon{font-size:1.05rem!important;width:20px!important;text-align:center!important;flex-shrink:0!important}
#screen-app .nav-badge{
  margin-left:auto!important;background:#2D4BFF!important;color:#fff!important;
  border-radius:99px!important;font-size:.67rem!important;font-weight:700!important;
  padding:2px 7px!important;min-width:20px!important;text-align:center!important;
}
#screen-app .sb-footer{padding:13px 14px!important;border-top:1px solid #E2E8F0!important}
#screen-app .sb-user{display:flex!important;align-items:center!important;gap:9px!important}
#screen-app .sb-avatar{
  width:34px!important;height:34px!important;border-radius:50%!important;
  background:linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%)!important;
  display:flex!important;align-items:center!important;justify-content:center!important;
  font-family:'Sora',sans-serif!important;font-weight:700!important;font-size:.82rem!important;
  color:#fff!important;flex-shrink:0!important;
}
#screen-app .sb-name{
  font-size:.83rem!important;font-weight:600!important;color:#0F172A!important;
  white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:100px!important;
}
#screen-app .sb-phone{font-size:.72rem!important;color:#64748B!important}
#screen-app .btn-logout{
  margin-left:auto!important;background:none!important;border:none!important;
  cursor:pointer;color:#64748B!important;font-size:1.1rem!important;
  padding:4px 6px!important;border-radius:6px!important;flex-shrink:0!important;
  transition:color .2s,background .2s;
}
#screen-app .btn-logout:hover{color:#DC2626!important;background:#FEE2E2!important}

/* ── MAIN AREA ── */
#screen-app .main{flex:1 1 0%!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;min-width:0!important;}
#screen-app .topbar{
  height:58px!important;border-bottom:1px solid #E2E8F0!important;background:#fff!important;
  display:flex!important;align-items:center!important;padding:0 24px!important;gap:14px!important;flex-shrink:0!important;
}
#screen-app .topbar-title{font-family:'Sora',sans-serif!important;font-weight:700!important;font-size:1.05rem!important;color:#0F172A!important;flex:1!important}
#screen-app .period-wrap{display:flex!important;gap:5px!important}
#screen-app .period-btn{
  padding:6px 13px!important;border-radius:8px!important;border:1.5px solid #E2E8F0!important;
  background:#fff!important;font-size:.8rem!important;font-weight:600!important;
  cursor:pointer;color:#64748B!important;transition:all .15s;font-family:'DM Sans',sans-serif!important;
}
#screen-app .period-btn.active{background:#E9EDFF!important;border-color:#2D4BFF!important;color:#2D4BFF!important}
#screen-app .notif-btn{
  width:34px!important;height:34px!important;border-radius:50%!important;
  border:1.5px solid #E2E8F0!important;background:#fff!important;cursor:pointer;
  display:flex!important;align-items:center!important;justify-content:center!important;
  font-size:.95rem!important;position:relative!important;flex-shrink:0!important;
}
#screen-app .notif-btn:hover{background:#F8FAFC!important}
#screen-app .notif-dot{
  position:absolute!important;top:5px!important;right:5px!important;
  width:7px!important;height:7px!important;border-radius:50%!important;
  background:#DC2626!important;border:1.5px solid #fff!important;
}
#screen-app .menu-toggle{
  display:none!important;background:none!important;border:none!important;
  cursor:pointer;font-size:1.2rem!important;color:#0F172A!important;flex-shrink:0!important;
}
#screen-app .sb-overlay{
  display:none!important;position:fixed!important;inset:0!important;
  background:rgba(0,0,0,.4)!important;z-index:49!important;
}
#screen-app .sb-overlay.show{display:block!important}
#screen-app .content{flex:1!important;min-height:0!important;overflow-y:auto!important;padding:22px 24px!important}
#screen-app .page{animation:dbFadeUp .3s ease both}

/* ── CARDS ── */
#screen-app .card{background:#fff!important;border:1px solid #E2E8F0!important;border-radius:16px!important;padding:20px!important}
#screen-app .card-ttl{
  font-size:.75rem!important;font-weight:700!important;letter-spacing:1.5px!important;
  text-transform:uppercase!important;color:#64748B!important;margin-bottom:14px!important;
  font-family:'Sora',sans-serif!important;
}
#screen-app .g2{display:grid!important;grid-template-columns:1fr 1fr!important;gap:16px!important}
#screen-app .g3{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:16px!important}
#screen-app .g4{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:14px!important}
#screen-app .row{display:flex!important;gap:16px!important;flex-wrap:wrap!important}
#screen-app .row>*{flex:1!important;min-width:0!important}

/* ── STAT CARDS ── */
#screen-app .stat-c{
  background:#fff!important;border:1px solid #E2E8F0!important;border-radius:16px!important;
  padding:18px!important;transition:box-shadow .2s,border-color .2s;
}
#screen-app .stat-c:hover{box-shadow:0 4px 16px rgba(45,75,255,.10),0 1px 4px rgba(0,0,0,.05)!important;border-color:#6C82FF!important}
#screen-app .stat-ico{width:38px!important;height:38px!important;border-radius:10px!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:1.1rem!important;margin-bottom:10px!important}
#screen-app .stat-lbl{font-size:.76rem!important;color:#64748B!important;margin-bottom:3px!important}
#screen-app .stat-val{font-family:'Sora',sans-serif!important;font-size:1.35rem!important;font-weight:800!important;color:#0F172A!important;line-height:1!important}
#screen-app .stat-trend{font-size:.74rem!important;font-weight:600!important;margin-top:5px!important;display:flex!important;align-items:center!important;gap:3px!important}
#screen-app .t-up{color:#DC2626!important}
#screen-app .t-dn{color:#16A34A!important}
#screen-app .t-neu{color:#64748B!important}

/* ── CHART CARDS ── */
#screen-app .chart-c{background:#fff!important;border:1px solid #E2E8F0!important;border-radius:16px!important;padding:18px!important}
#screen-app .chart-h{display:flex!important;align-items:center!important;justify-content:space-between!important;margin-bottom:14px!important}
#screen-app .chart-h h3{font-size:.88rem!important;font-weight:700!important;color:#0F172A!important}

/* ── INSIGHTS ── */
#screen-app .ins-list{display:flex!important;flex-direction:column!important;gap:9px!important}
#screen-app .ins-item{
  display:flex!important;align-items:flex-start!important;gap:10px!important;
  padding:11px 13px!important;border-radius:11px!important;border:1px solid #E2E8F0!important;transition:border-color .2s;
}
#screen-app .ins-item:hover{border-color:#6C82FF!important}
#screen-app .ins-ico{width:34px!important;height:34px!important;border-radius:9px!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:.95rem!important;flex-shrink:0!important}
#screen-app .ins-title{font-size:.83rem!important;font-weight:600!important;color:#0F172A!important;margin-bottom:2px!important}
#screen-app .ins-desc{font-size:.77rem!important;color:#64748B!important;line-height:1.45!important}

/* ── TRANSACTIONS ── */
#screen-app .txn-filters{display:flex!important;gap:9px!important;margin-bottom:16px!important;flex-wrap:wrap!important;align-items:center!important}
#screen-app .search-bar{
  display:flex!important;align-items:center!important;gap:8px!important;
  padding:9px 13px!important;border:1.5px solid #E2E8F0!important;border-radius:10px!important;
  background:#fff!important;flex:1!important;min-width:180px!important;transition:border-color .2s;
}
#screen-app .search-bar:focus-within{border-color:#2D4BFF!important}
#screen-app .search-bar input{
  border:none!important;outline:none!important;font-size:.87rem!important;
  font-family:'DM Sans',sans-serif!important;color:#0F172A!important;flex:1!important;background:transparent!important;
}
#screen-app .f-chip{
  padding:7px 13px!important;border-radius:8px!important;border:1.5px solid #E2E8F0!important;
  background:#fff!important;font-size:.8rem!important;font-weight:500!important;cursor:pointer;
  color:#64748B!important;transition:all .15s;font-family:'DM Sans',sans-serif!important;outline:none!important;
}
#screen-app .f-chip:hover,#screen-app .f-chip.active{background:#E9EDFF!important;border-color:#2D4BFF!important;color:#2D4BFF!important}
#screen-app .txn-wrap{background:#fff!important;border:1px solid #E2E8F0!important;border-radius:16px!important;overflow:hidden!important}
#screen-app .txn-table{width:100%!important;border-collapse:collapse!important;font-size:.84rem!important}
#screen-app .txn-table th{
  padding:11px 14px!important;text-align:left!important;background:#F8FAFC!important;
  font-size:.73rem!important;font-weight:700!important;letter-spacing:.8px!important;
  text-transform:uppercase!important;color:#64748B!important;border-bottom:1px solid #E2E8F0!important;white-space:nowrap!important;
}
#screen-app .txn-table td{padding:12px 14px!important;border-bottom:1px solid #E2E8F0!important;vertical-align:middle!important;color:#334155!important}
#screen-app .txn-table tr:last-child td{border-bottom:none!important}
#screen-app .txn-table tr:hover td{background:#F8FAFC!important}
#screen-app .t-cat{display:inline-flex!important;align-items:center!important;gap:4px!important;padding:3px 9px!important;border-radius:99px!important;font-size:.73rem!important;font-weight:600!important;white-space:nowrap!important}
#screen-app .t-amt{font-family:'Sora',sans-serif!important;font-weight:700!important;font-size:.88rem!important}
#screen-app .t-amt.out{color:#DC2626!important}
#screen-app .t-amt.in{color:#16A34A!important}
#screen-app .pag-row{
  display:flex!important;align-items:center!important;justify-content:space-between!important;
  padding:12px 16px!important;border-top:1px solid #E2E8F0!important;font-size:.81rem!important;
  color:#64748B!important;flex-wrap:wrap!important;gap:8px!important;
}
#screen-app .pag-btns-wrap{display:flex!important;gap:3px!important;flex-wrap:wrap!important}
#screen-app .pb{
  width:30px!important;height:30px!important;border-radius:7px!important;
  border:1px solid #E2E8F0!important;background:#fff!important;cursor:pointer;
  display:flex!important;align-items:center!important;justify-content:center!important;
  font-size:.8rem!important;font-weight:600!important;color:#64748B!important;
  transition:all .15s;font-family:'DM Sans',sans-serif!important;
}
#screen-app .pb:hover{background:#F8FAFC!important;border-color:#6C82FF!important}
#screen-app .pb.active{background:#2D4BFF!important;border-color:#2D4BFF!important;color:#fff!important}
#screen-app .pb:disabled{opacity:.35!important;cursor:not-allowed!important}

/* ── SETTINGS ── */
#screen-app .set-section{margin-bottom:24px!important}
#screen-app .set-section-ttl{
  font-size:.76rem!important;font-weight:700!important;letter-spacing:1.5px!important;
  text-transform:uppercase!important;color:#64748B!important;margin-bottom:10px!important;
  padding-bottom:7px!important;border-bottom:1px solid #E2E8F0!important;font-family:'Sora',sans-serif!important;
}
#screen-app .set-row{
  display:flex!important;align-items:center!important;justify-content:space-between!important;
  padding:12px 0!important;border-bottom:1px dashed #E2E8F0!important;gap:12px!important;
}
#screen-app .set-row:last-child{border-bottom:none!important}
#screen-app .set-lbl{font-size:.88rem!important;font-weight:600!important;color:#0F172A!important}
#screen-app .set-desc{font-size:.77rem!important;color:#64748B!important;margin-top:2px!important}
#screen-app .toggle{position:relative!important;width:42px!important;height:23px!important;flex-shrink:0!important;cursor:pointer;display:inline-block!important}
#screen-app .toggle input{opacity:0!important;width:0!important;height:0!important;position:absolute!important}
#screen-app .tog-sl{position:absolute!important;inset:0!important;background:#E2E8F0!important;border-radius:99px!important;cursor:pointer;transition:background .2s}
#screen-app .tog-sl::before{content:''!important;position:absolute!important;width:17px!important;height:17px!important;border-radius:50%!important;background:#fff!important;top:3px!important;left:3px!important;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)!important}
#screen-app .toggle input:checked+.tog-sl{background:#2D4BFF!important}
#screen-app .toggle input:checked+.tog-sl::before{transform:translateX(19px)!important}
#screen-app .chip-grp{display:flex!important;flex-wrap:wrap!important;gap:6px!important;margin-top:7px!important}
#screen-app .chip{
  padding:5px 12px!important;border-radius:99px!important;border:1.5px solid #E2E8F0!important;
  font-size:.79rem!important;font-weight:500!important;cursor:pointer;transition:all .15s;
  color:#64748B!important;user-select:none;font-family:'DM Sans',sans-serif!important;
}
#screen-app .chip:hover{border-color:#6C82FF!important;color:#2D4BFF!important;background:#E9EDFF!important}
#screen-app .chip.on{border-color:#2D4BFF!important;background:#2D4BFF!important;color:#fff!important}
#screen-app .ratio-wrap{background:#F8FAFC!important;border-radius:13px!important;padding:16px!important;margin-top:7px!important}
#screen-app .ratio-vals{display:flex!important;justify-content:space-between!important;margin-bottom:10px!important}
#screen-app .ratio-val-item{text-align:center!important}
#screen-app .rv-num{font-family:'Sora',sans-serif!important;font-size:1.4rem!important;font-weight:800!important;line-height:1!important}
#screen-app .rv-lbl{font-size:.73rem!important;font-weight:600!important;margin-top:2px!important}
#screen-app .ratio-track{height:34px!important;border-radius:10px!important;background:#E2E8F0!important;position:relative!important;cursor:pointer;touch-action:none;user-select:none;overflow:visible!important}
#screen-app .rf-l{position:absolute!important;left:0!important;top:0!important;bottom:0!important;background:linear-gradient(90deg,#EF4444,#F97316)!important;border-radius:10px 0 0 10px!important}
#screen-app .rf-r{position:absolute!important;right:0!important;top:0!important;bottom:0!important;background:linear-gradient(90deg,#22C55E,#16A34A)!important;border-radius:0 10px 10px 0!important}
#screen-app .r-handle{position:absolute!important;top:50%!important;transform:translate(-50%,-50%)!important;width:24px!important;height:24px!important;border-radius:50%!important;background:#fff!important;border:3px solid #2D4BFF!important;box-shadow:0 2px 8px rgba(0,0,0,.2)!important;cursor:grab;z-index:2!important}
#screen-app .ratio-hint-txt{font-size:.77rem!important;color:#64748B!important;text-align:center!important;margin-top:9px!important}

/* ── AFFILIATE ── */
#screen-app .aff-hero{
  background:linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%)!important;
  border-radius:16px!important;padding:26px 30px!important;color:#fff!important;
  margin-bottom:18px!important;display:flex!important;align-items:flex-start!important;
  justify-content:space-between!important;gap:14px!important;flex-wrap:wrap!important;
}
#screen-app .aff-hero h2{font-size:1.25rem!important;font-weight:800!important;margin-bottom:4px!important;color:#fff!important}
#screen-app .aff-hero p{font-size:.85rem!important;opacity:.85!important;max-width:400px!important;line-height:1.55!important;color:#fff!important}
#screen-app .aff-stats{display:flex!important;gap:22px!important;flex-wrap:wrap!important;margin-top:14px!important}
#screen-app .aff-sn{font-family:'Sora',sans-serif!important;font-size:1.5rem!important;font-weight:800!important;line-height:1!important;color:#fff!important}
#screen-app .aff-sl{font-size:.73rem!important;opacity:.8!important;margin-top:3px!important;color:#fff!important}
#screen-app .aff-code-box{background:#fff!important;border:2px dashed #6C82FF!important;border-radius:13px!important;padding:16px 20px!important;text-align:center!important;margin-bottom:18px!important}
#screen-app .aff-code-lbl{font-size:.76rem!important;color:#64748B!important;margin-bottom:5px!important}
#screen-app .aff-code-val{font-family:'Sora',sans-serif!important;font-size:1.9rem!important;font-weight:800!important;color:#2D4BFF!important;letter-spacing:4px!important;margin-bottom:10px!important}
#screen-app .aff-steps-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))!important;gap:12px!important;margin-bottom:18px!important}
#screen-app .aff-step{background:#F8FAFC!important;border:1px solid #E2E8F0!important;border-radius:13px!important;padding:16px!important;text-align:center!important}
#screen-app .aff-step-num{
  width:34px!important;height:34px!important;border-radius:50%!important;
  background:linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%)!important;
  color:#fff!important;font-family:'Sora',sans-serif!important;font-weight:800!important;
  font-size:.88rem!important;display:flex!important;align-items:center!important;
  justify-content:center!important;margin:0 auto 9px!important;
}
#screen-app .aff-step h4{font-size:.88rem!important;font-weight:700!important;margin-bottom:4px!important;color:#0F172A!important}
#screen-app .aff-step p{font-size:.78rem!important;color:#64748B!important;line-height:1.45!important}
#screen-app .ref-chip{display:inline-block!important;padding:2px 8px!important;border-radius:99px!important;font-size:.72rem!important;font-weight:600!important}

/* ── PROFILE ── */
#screen-app .prof-header{
  display:flex!important;align-items:center!important;gap:18px!important;padding:22px!important;
  background:#fff!important;border:1px solid #E2E8F0!important;border-radius:16px!important;
  margin-bottom:18px!important;flex-wrap:wrap!important;
}
#screen-app .prof-avatar{
  width:62px!important;height:62px!important;border-radius:50%!important;
  background:linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%)!important;
  display:flex!important;align-items:center!important;justify-content:center!important;
  font-family:'Sora',sans-serif!important;font-weight:800!important;font-size:1.4rem!important;
  color:#fff!important;flex-shrink:0!important;cursor:pointer;position:relative!important;
}
#screen-app .prof-avatar::after{
  content:'✏️'!important;position:absolute!important;bottom:-1px!important;right:-1px!important;
  font-size:.75rem!important;background:#fff!important;border-radius:50%!important;
  width:20px!important;height:20px!important;display:flex!important;
  align-items:center!important;justify-content:center!important;box-shadow:0 1px 3px rgba(0,0,0,.07)!important;
}
#screen-app .prof-plan-badge{
  display:inline-flex!important;align-items:center!important;gap:4px!important;
  background:#E9EDFF!important;color:#2D4BFF!important;font-size:.76rem!important;
  font-weight:700!important;padding:3px 9px!important;border-radius:99px!important;margin-top:4px!important;
}
#screen-app .fg{margin-bottom:16px!important}
#screen-app .fg label{
  display:block!important;font-size:.84rem!important;font-weight:600!important;
  color:#0F172A!important;margin-bottom:6px!important;font-family:'DM Sans',sans-serif!important;
}
#screen-app .fg input,#screen-app .fg select{
  width:100%!important;padding:10px 13px!important;border:1.5px solid #E2E8F0!important;
  border-radius:9px!important;font-size:.88rem!important;font-family:'DM Sans',sans-serif!important;
  color:#0F172A!important;outline:none!important;transition:border-color .2s;background:#fff!important;
}
#screen-app .fg input:focus,#screen-app .fg select:focus{border-color:#2D4BFF!important}
#screen-app .fg input:disabled{background:#F8FAFC!important;color:#64748B!important;cursor:not-allowed!important}
#screen-app .hint{font-size:.74rem!important;color:#64748B!important;margin-top:3px!important}
#screen-app .danger-zone{background:#FEE2E2!important;border:1px solid #FECACA!important;border-radius:16px!important;padding:18px!important}
#screen-app .danger-zone h3{color:#DC2626!important;font-size:.93rem!important;font-weight:700!important;margin-bottom:5px!important}
#screen-app .danger-zone p{font-size:.81rem!important;color:#7F1D1D!important;margin-bottom:12px!important;line-height:1.5!important}

/* ── TOAST ── */
.mira-db-toast{
  position:fixed!important;bottom:22px!important;right:22px!important;
  background:#0F172A!important;color:#fff!important;padding:11px 18px!important;
  border-radius:11px!important;font-size:.84rem!important;font-weight:500!important;
  z-index:99999!important;transform:translateY(80px)!important;opacity:0!important;
  transition:all .3s cubic-bezier(.34,1.2,.64,1)!important;pointer-events:none!important;
  max-width:320px!important;font-family:'DM Sans',sans-serif!important;
}
.mira-db-toast.show{transform:none!important;opacity:1!important}
.mira-db-toast.green{background:#16A34A!important}
.mira-db-toast.red{background:#DC2626!important}

/* ── TAG COLORS ── */
#screen-app .tag-food{background:#FFF7ED!important;color:#C2410C!important}
#screen-app .tag-transport{background:#EFF6FF!important;color:#1D4ED8!important}
#screen-app .tag-shopping{background:#FDF4FF!important;color:#7E22CE!important}
#screen-app .tag-bills{background:#F0FDF4!important;color:#15803D!important}
#screen-app .tag-health{background:#FFF1F2!important;color:#BE123C!important}
#screen-app .tag-entertainment{background:#FFFBEB!important;color:#B45309!important}
#screen-app .tag-income{background:#F0FDF4!important;color:#15803D!important}

/* ── CRUD MODAL ── */
#screen-app .crud-overlay{
  position:fixed!important;inset:0!important;
  background:rgba(15,23,42,.55)!important;backdrop-filter:blur(4px)!important;
  z-index:9000!important;display:flex!important;
  align-items:center!important;justify-content:center!important;padding:16px!important;
}
#screen-app .crud-modal{
  background:#fff!important;border-radius:20px!important;
  width:100%!important;max-width:480px!important;
  box-shadow:0 20px 60px rgba(45,75,255,.15),0 4px 16px rgba(0,0,0,.08)!important;
  overflow:hidden!important;max-height:90vh!important;overflow-y:auto!important;
}
#screen-app .crud-modal-head{
  display:flex!important;align-items:center!important;justify-content:space-between!important;
  padding:18px 22px 14px!important;border-bottom:1px solid #E2E8F0!important;
  position:sticky!important;top:0!important;background:#fff!important;z-index:1!important;
}
#screen-app .crud-modal-head h3{font-size:1rem!important;font-weight:700!important;color:#0F172A!important;}
#screen-app .crud-close{background:none!important;border:none!important;cursor:pointer!important;width:30px!important;height:30px!important;border-radius:8px!important;display:flex!important;align-items:center!important;justify-content:center!important;color:#64748B!important;font-size:1.05rem!important;transition:background .15s!important;}
#screen-app .crud-close:hover{background:#F1F5F9!important;color:#0F172A!important;}
#screen-app .crud-modal-body{padding:18px 22px!important;}
#screen-app .crud-modal-foot{
  padding:12px 22px 18px!important;border-top:1px solid #E2E8F0!important;
  display:flex!important;gap:10px!important;justify-content:flex-end!important;
  position:sticky!important;bottom:0!important;background:#fff!important;z-index:1!important;
}
#screen-app .action-btns{display:flex!important;gap:4px!important;justify-content:flex-end!important;}
#screen-app .btn-act{
  width:28px!important;height:28px!important;border-radius:7px!important;
  border:none!important;cursor:pointer!important;display:flex!important;
  align-items:center!important;justify-content:center!important;font-size:.78rem!important;
  transition:all .15s!important;flex-shrink:0!important;line-height:1!important;
}
#screen-app .btn-edit-act{background:#E9EDFF!important;color:#2D4BFF!important;}
#screen-app .btn-edit-act:hover{background:#2D4BFF!important;color:#fff!important;}
#screen-app .btn-del-act{background:#FEE2E2!important;color:#DC2626!important;}
#screen-app .btn-del-act:hover{background:#DC2626!important;color:#fff!important;}

/* ── MOBILE LOGOUT BTN (topbar) ── */
#screen-app .mob-logout-btn{display:none!important}

/* ── FILTER DRAWER (mobile bottom sheet) ── */
#screen-app .mob-filter-bar{display:none!important}
#screen-app .filter-drawer-overlay{
  display:none;position:fixed!important;inset:0!important;
  background:rgba(15,23,42,.5)!important;z-index:8000!important;
}
#screen-app .filter-drawer-overlay.open{display:block!important}
#screen-app .filter-drawer{
  position:fixed!important;bottom:0!important;left:0!important;right:0!important;
  background:#fff!important;border-radius:20px 20px 0 0!important;
  z-index:8001!important;padding-bottom:env(safe-area-inset-bottom,12px)!important;
  max-height:88vh!important;overflow-y:auto!important;
  transform:translateY(100%);transition:transform .32s cubic-bezier(.32,1,.5,1);
}
#screen-app .filter-drawer.open{transform:translateY(0)!important}
#screen-app .filter-drawer-handle{width:36px!important;height:4px!important;background:#E2E8F0!important;border-radius:99px!important;margin:12px auto 4px!important}
#screen-app .filter-drawer-head{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:8px 18px 12px!important;border-bottom:1px solid #F1F5F9!important}
#screen-app .filter-drawer-body{padding:14px 18px!important}
#screen-app .filter-sect{margin-bottom:16px!important}
#screen-app .filter-sect-lbl{font-size:.71rem!important;font-weight:700!important;letter-spacing:1px!important;text-transform:uppercase!important;color:#64748B!important;margin-bottom:8px!important;display:block!important}
#screen-app .filter-opts{display:flex!important;flex-wrap:wrap!important;gap:6px!important}
#screen-app .fopt{
  padding:7px 13px!important;border-radius:99px!important;border:1.5px solid #E2E8F0!important;
  font-size:.81rem!important;font-weight:500!important;cursor:pointer;background:#fff!important;
  color:#64748B!important;transition:all .15s;font-family:'DM Sans',sans-serif!important;line-height:1.3!important;
}
#screen-app .fopt.on{background:#2D4BFF!important;border-color:#2D4BFF!important;color:#fff!important;font-weight:600!important}
#screen-app .filter-drawer-foot{padding:12px 18px 4px!important;display:flex!important;gap:10px!important;border-top:1px solid #F1F5F9!important}
#screen-app .active-filter-badge{
  display:inline-flex!important;align-items:center!important;justify-content:center!important;
  background:#2D4BFF!important;color:#fff!important;border-radius:99px!important;
  font-size:.67rem!important;font-weight:700!important;min-width:18px!important;height:18px!important;
  padding:0 5px!important;margin-left:5px!important;vertical-align:middle!important;
}

/* ── DESKTOP: hide mobile-only elements ── */
#screen-app .txn-mobile{display:none!important}
#screen-app .mob-bottom-nav{display:none!important}

/* ── ANIMATIONS ── */
@keyframes dbFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes dbSpin{to{transform:rotate(360deg)}}

/* ── TABLET ── */
@media(max-width:900px){
  #screen-app .g4{grid-template-columns:1fr 1fr!important}
  #screen-app .g3{grid-template-columns:1fr 1fr!important}
}

/* ══════════════════════════════════════════
   MOBILE ≤768px
══════════════════════════════════════════ */
@media(max-width:768px){
  #screen-app .sidebar{display:none!important}
  #screen-app .menu-toggle{display:none!important}
  #screen-app .main{width:100vw!important}
  #screen-app .topbar{padding:0 16px!important;height:54px!important;gap:10px!important}
  #screen-app .topbar-title{font-size:.95rem!important}
  #screen-app .period-wrap{gap:3px!important}
  #screen-app .period-btn{padding:5px 10px!important;font-size:.73rem!important;border-radius:7px!important}
  #screen-app .notif-btn{width:30px!important;height:30px!important;font-size:.85rem!important}
  #screen-app .content{padding:14px 14px calc(88px + env(safe-area-inset-bottom,0px))!important}
  #screen-app .g4{grid-template-columns:1fr 1fr!important;gap:10px!important}
  #screen-app .g3{grid-template-columns:1fr 1fr!important;gap:10px!important}
  #screen-app .g2{grid-template-columns:1fr!important;gap:10px!important}
  #screen-app .row{flex-direction:column!important;gap:10px!important}
  #screen-app .row>*{min-width:0!important}
  #screen-app .stat-c{padding:14px!important;border-radius:13px!important}
  #screen-app .stat-ico{width:32px!important;height:32px!important;font-size:.95rem!important;margin-bottom:8px!important}
  #screen-app .stat-val{font-size:1.05rem!important}
  #screen-app .stat-lbl{font-size:.71rem!important}
  #screen-app .chart-c{padding:14px!important;border-radius:13px!important}
  #screen-app .card{padding:14px!important;border-radius:13px!important}
  /* Transactions */
  #screen-app .txn-desktop{display:none!important}
  #screen-app .txn-mobile{display:flex!important;flex-direction:column!important}
  #screen-app .txn-card{display:flex!important;align-items:center!important;gap:12px!important;padding:13px 16px!important;border-bottom:1px solid #F1F5F9!important}
  #screen-app .txn-card:last-child{border-bottom:none!important}
  #screen-app .txn-card-ico{width:40px!important;height:40px!important;border-radius:12px!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:1.15rem!important;flex-shrink:0!important}
  #screen-app .txn-card-info{flex:1!important;min-width:0!important}
  #screen-app .txn-card-name{font-weight:600!important;font-size:.86rem!important;color:#0F172A!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
  #screen-app .txn-card-meta{font-size:.75rem!important;color:#94A3B8!important;margin-top:2px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
  #screen-app .txn-card-right{text-align:right!important;flex-shrink:0!important}
  #screen-app .txn-card-amt{font-family:'Sora',sans-serif!important;font-weight:700!important;font-size:.88rem!important}
  #screen-app .txn-card-amt.out{color:#DC2626!important}
  #screen-app .txn-card-amt.in{color:#16A34A!important}
  #screen-app .txn-card-date{font-size:.71rem!important;color:#94A3B8!important;margin-top:2px!important}
  #screen-app .txn-filters{flex-wrap:wrap!important;gap:7px!important}
  #screen-app .search-bar{min-width:0!important;width:100%!important}
  #screen-app .f-chip{padding:7px 12px!important;font-size:.78rem!important}
  #screen-app .pag-row{flex-direction:column!important;align-items:flex-start!important;gap:10px!important;padding:12px 14px!important}
  /* Settings */
  #screen-app .ratio-wrap{padding:12px!important}
  #screen-app .rv-num{font-size:1.2rem!important}
  /* Affiliate */
  #screen-app .aff-hero{padding:18px 16px!important;border-radius:13px!important}
  #screen-app .aff-hero h2{font-size:1.1rem!important}
  #screen-app .aff-code-val{font-size:1.5rem!important;letter-spacing:2px!important}
  #screen-app .aff-steps-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
  #screen-app .aff-step{padding:12px!important}
  /* Profile */
  #screen-app .prof-header{padding:16px!important;gap:14px!important;border-radius:13px!important}
  #screen-app .prof-avatar{width:52px!important;height:52px!important;font-size:1.2rem!important}
  #screen-app .fg input,#screen-app .fg select{padding:11px 13px!important;font-size:.9rem!important}
  /* Bottom Nav */
  #screen-app .mob-bottom-nav{
    display:flex!important;position:fixed!important;bottom:0!important;left:0!important;right:0!important;
    height:60px!important;background:#fff!important;border-top:1px solid #E2E8F0!important;
    box-shadow:0 -4px 24px rgba(45,75,255,.07)!important;z-index:999!important;
    padding-bottom:env(safe-area-inset-bottom,0)!important;
  }
  #screen-app .mob-nav-btn{
    flex:1!important;display:flex!important;flex-direction:column!important;
    align-items:center!important;justify-content:center!important;gap:3px!important;
    border:none!important;background:none!important;cursor:pointer;
    color:#94A3B8!important;padding:4px 1px!important;
    transition:color .15s,transform .1s;position:relative!important;
  }
  #screen-app .mob-nav-btn:active{transform:scale(.88)!important}
  #screen-app .mob-nav-btn.active{color:#2D4BFF!important}
  #screen-app .mob-nav-icon{font-size:1.15rem!important;display:block!important;line-height:1!important}
  #screen-app .mob-nav-lbl{font-size:.48rem!important;font-weight:600!important;font-family:'DM Sans',sans-serif!important;display:block!important;white-space:nowrap!important;line-height:1.3!important}
  #screen-app .mob-nav-dot{
    position:absolute!important;top:4px!important;right:calc(50% - 14px)!important;
    width:6px!important;height:6px!important;border-radius:50%!important;background:#2D4BFF!important;
  }
  .mira-db-toast{bottom:70px!important;right:14px!important;left:14px!important;max-width:none!important;text-align:center!important}
  /* Mobile logout topbar btn */
  #screen-app .mob-logout-btn{
    display:flex!important;width:32px!important;height:32px!important;border-radius:8px!important;
    border:1.5px solid #E2E8F0!important;background:#fff!important;cursor:pointer!important;
    align-items:center!important;justify-content:center!important;font-size:.95rem!important;
    flex-shrink:0!important;color:#64748B!important;transition:all .15s!important;
  }
  #screen-app .mob-logout-btn:active{color:#DC2626!important;background:#FEE2E2!important;border-color:#FECACA!important}
  /* Mobile filter bar */
  #screen-app .mob-filter-bar{
    display:flex!important;align-items:center!important;gap:8px!important;
    padding:10px 14px!important;border-bottom:1px solid #F1F5F9!important;
    background:#fff!important;flex-wrap:nowrap!important;overflow-x:auto!important;
    -webkit-overflow-scrolling:touch!important;
  }
  #screen-app .mob-filter-bar::-webkit-scrollbar{display:none!important}
  #screen-app .mob-filter-chip{
    display:inline-flex!important;align-items:center!important;gap:5px!important;
    padding:7px 12px!important;border-radius:99px!important;border:1.5px solid #E2E8F0!important;
    background:#fff!important;font-size:.79rem!important;font-weight:500!important;
    cursor:pointer;color:#64748B!important;white-space:nowrap!important;flex-shrink:0!important;
    font-family:'DM Sans',sans-serif!important;
  }
  #screen-app .mob-filter-chip.has-filter{background:#E9EDFF!important;border-color:#2D4BFF!important;color:#2D4BFF!important;font-weight:600!important}
  #screen-app .mob-filter-open-btn{
    display:inline-flex!important;align-items:center!important;gap:6px!important;
    padding:7px 14px!important;border-radius:99px!important;
    background:linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%)!important;
    color:#fff!important;font-size:.82rem!important;font-weight:700!important;
    border:none!important;cursor:pointer;white-space:nowrap!important;flex-shrink:0!important;
    font-family:'Sora',sans-serif!important;
  }
}

/* ══ ASET PAGE ══ */
#screen-app .nw-hero{background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 100%)!important;border-radius:16px!important;padding:28px 30px!important;color:#fff!important;margin-bottom:18px!important;position:relative!important;overflow:hidden!important}
#screen-app .nw-hero::after{content:'💎';position:absolute!important;right:28px!important;top:50%!important;transform:translateY(-50%)!important;font-size:72px!important;opacity:.1!important;pointer-events:none!important}
#screen-app .nw-lbl{font-size:.78rem!important;color:rgba(255,255,255,.6)!important;font-weight:500!important;margin-bottom:6px!important}
#screen-app .nw-val{font-family:'Sora',sans-serif!important;font-size:2.4rem!important;font-weight:800!important;line-height:1!important;margin-bottom:10px!important;letter-spacing:-1px!important;color:#fff!important}
#screen-app .nw-trend{display:inline-flex!important;align-items:center!important;gap:6px!important;background:rgba(34,211,238,.18)!important;color:#22D3EE!important;padding:4px 13px!important;border-radius:99px!important;font-size:.82rem!important;font-weight:700!important;margin-bottom:16px!important}
#screen-app .nw-meta{display:flex!important;gap:28px!important;flex-wrap:wrap!important}
#screen-app .nwml{font-size:.72rem!important;color:rgba(255,255,255,.5)!important}
#screen-app .nwmv{font-size:.95rem!important;font-weight:700!important;color:rgba(255,255,255,.9)!important;margin-top:2px!important}
#screen-app .cat-card{background:#fff!important;border:1px solid #E2E8F0!important;border-radius:13px!important;overflow:hidden!important;margin-bottom:12px!important;transition:box-shadow .2s}
#screen-app .cat-card:hover{box-shadow:0 1px 3px rgba(0,0,0,.07)!important}
#screen-app .cat-hdr{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:14px 18px!important;cursor:pointer!important;user-select:none!important;transition:background .15s}
#screen-app .cat-hdr:hover{background:#F8FAFC!important}
#screen-app .cat-icon-box{width:40px!important;height:40px!important;border-radius:10px!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:1.1rem!important;flex-shrink:0!important}
#screen-app .cat-name{font-size:.9rem!important;font-weight:700!important;color:#0F172A!important}
#screen-app .cat-sub{font-size:.74rem!important;color:#64748B!important;margin-top:2px!important}
#screen-app .cat-total{font-size:1rem!important;font-weight:800!important}
#screen-app .cat-pct{font-size:.72rem!important;color:#64748B!important;margin-top:2px!important;text-align:right!important}
#screen-app .cat-chev{font-size:.75rem!important;color:#64748B!important;margin-left:10px!important;transition:transform .2s!important;flex-shrink:0!important;display:inline-block!important}
#screen-app .cat-chev.open{transform:rotate(90deg)!important}
#screen-app .cat-items{padding:4px 18px 14px!important;border-top:1px solid #E2E8F0!important}
#screen-app .aset-item{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:9px 0!important;border-bottom:1px solid #F8FAFC!important;gap:8px!important}
#screen-app .aset-item:last-of-type{border-bottom:none!important}
#screen-app .aset-dot{width:8px!important;height:8px!important;border-radius:50%!important;flex-shrink:0!important}
#screen-app .aset-iname{font-size:.84rem!important;font-weight:600!important;color:#0F172A!important}
#screen-app .aset-itype{font-size:.73rem!important;color:#64748B!important}
#screen-app .aset-ival{font-size:.9rem!important;font-weight:700!important;color:#0F172A!important}
#screen-app .aset-idate{font-size:.71rem!important;color:#64748B!important;text-align:right!important}
#screen-app .aset-edit-btns{display:flex!important;gap:4px!important;flex-shrink:0!important;opacity:0!important;transition:opacity .15s}
#screen-app .aset-item:hover .aset-edit-btns{opacity:1!important}
#screen-app .aset-edit-btn{width:26px!important;height:26px!important;border-radius:6px!important;border:1px solid #E2E8F0!important;background:#fff!important;cursor:pointer!important;font-size:.75rem!important;display:flex!important;align-items:center!important;justify-content:center!important;transition:all .15s}
#screen-app .aset-edit-btn:hover{border-color:#2D4BFF!important;background:#E9EDFF!important}
#screen-app .aset-edit-btn.del:hover{border-color:#DC2626!important;background:#FEE2E2!important}
#screen-app .aif-inp{width:100%!important;padding:7px 10px!important;border:1.5px solid #E2E8F0!important;border-radius:7px!important;font-size:.82rem!important;font-family:'DM Sans',sans-serif!important;color:#0F172A!important;outline:none!important;background:#fff!important;transition:border-color .2s!important;box-sizing:border-box!important}
#screen-app .aif-inp:focus{border-color:#2D4BFF!important}
#screen-app .aif-lbl{font-size:.72rem!important;font-weight:600!important;color:#64748B!important;margin-bottom:3px!important;display:block!important}
#screen-app .add-aset-btn{display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;width:100%!important;padding:9px!important;background:none!important;border:1px dashed #E2E8F0!important;border-radius:8px!important;color:#2D4BFF!important;font-size:.82rem!important;font-weight:600!important;cursor:pointer!important;margin-top:8px!important;transition:all .15s;font-family:'DM Sans',sans-serif!important}
#screen-app .add-aset-btn:hover{background:#E9EDFF!important;border-color:#2D4BFF!important}
#screen-app .smry-row{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:11px 0!important;border-bottom:1px solid #F8FAFC!important}
#screen-app .smry-row:last-child{border-bottom:none!important}
#screen-app .smry-lbl{font-size:.88rem!important;color:#334155!important;font-weight:500!important}
#screen-app .smry-val{font-size:.93rem!important;font-weight:700!important}
#screen-app .trend-row{display:flex!important;align-items:center!important;gap:10px!important;margin-bottom:7px!important}
#screen-app .trend-mo{font-size:.75rem!important;color:#64748B!important;width:36px!important;flex-shrink:0!important}
#screen-app .trend-bar-wrap{flex:1!important;background:#F1F5F9!important;border-radius:99px!important;overflow:hidden!important;height:10px!important}
#screen-app .trend-bar-fill{height:10px!important;border-radius:99px!important;transition:width .5s ease!important}
#screen-app .trend-rpval{font-size:.71rem!important;color:#64748B!important;width:68px!important;text-align:right!important;flex-shrink:0!important}

/* ══ GOALS PAGE ══ */
#screen-app .goals-hero{background:linear-gradient(135deg,#4C1D95 0%,#7C3AED 100%)!important;border-radius:16px!important;padding:26px 30px!important;color:#fff!important;margin-bottom:18px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;flex-wrap:wrap!important}
#screen-app .goals-hero h2{font-size:1.3rem!important;font-weight:800!important;margin-bottom:4px!important;color:#fff!important}
#screen-app .goals-hero p{font-size:.83rem!important;color:rgba(255,255,255,.72)!important;line-height:1.5!important;margin:0!important}
#screen-app .gh-stats{display:flex!important;gap:22px!important;margin-top:14px!important;flex-wrap:wrap!important}
#screen-app .gh-stat .gsl{font-size:.71rem!important;color:rgba(255,255,255,.55)!important}
#screen-app .gh-stat .gsv{font-family:'Sora',sans-serif!important;font-size:1.25rem!important;font-weight:800!important;margin-top:1px!important;color:#fff!important}
#screen-app .goals-hero-icon{font-size:58px!important;opacity:.18!important;flex-shrink:0!important}
#screen-app .liq-bar-card{background:#fff!important;border:1px solid #E2E8F0!important;border-radius:16px!important;padding:18px!important;margin-bottom:18px!important}
#screen-app .goal-card{background:#fff!important;border:1px solid #E2E8F0!important;border-radius:16px!important;padding:20px!important;margin-bottom:14px!important;position:relative!important;overflow:hidden!important;transition:box-shadow .2s}
#screen-app .goal-card:hover{box-shadow:0 4px 16px rgba(45,75,255,.10)!important}
#screen-app .goal-card::before{content:''!important;position:absolute!important;top:0!important;left:0!important;right:0!important;height:4px!important}
#screen-app .goal-card.gc-blue::before{background:#2D4BFF!important}
#screen-app .goal-card.gc-green::before{background:#16A34A!important}
#screen-app .goal-card.gc-yellow::before{background:#F59E0B!important}
#screen-app .goal-card.gc-purple::before{background:#7C3AED!important}
#screen-app .goal-card.gc-red::before{background:#DC2626!important}
#screen-app .goal-card.gc-cyan::before{background:#0891B2!important}
#screen-app .goal-card.gc-pink::before{background:#EC4899!important}
#screen-app .gcard-hdr{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;margin-bottom:14px!important}
#screen-app .gcard-icon{width:42px!important;height:42px!important;border-radius:12px!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:1.15rem!important;flex-shrink:0!important;background:#F8FAFC!important}
#screen-app .gcard-title{font-size:.95rem!important;font-weight:700!important;color:#0F172A!important}
#screen-app .gcard-cat{font-size:.75rem!important;color:#64748B!important;margin-top:2px!important}
#screen-app .gcard-acts{display:flex!important;gap:5px!important}
#screen-app .gcard-amts{display:flex!important;justify-content:space-between!important;align-items:flex-end!important;margin-bottom:7px!important}
#screen-app .gcard-achieved{font-family:'Sora',sans-serif!important;font-size:1.4rem!important;font-weight:800!important;color:#0F172A!important;line-height:1!important}
#screen-app .gcard-target{font-size:.8rem!important;color:#64748B!important}
#screen-app .gcard-pct{font-family:'Sora',sans-serif!important;font-size:.95rem!important;font-weight:800!important}
#screen-app .progress-track{height:10px!important;background:#E2E8F0!important;border-radius:99px!important;overflow:hidden!important;margin-bottom:10px!important}
#screen-app .progress-fill{height:100%!important;border-radius:99px!important;transition:width .6s ease!important}
#screen-app .gcard-meta{display:flex!important;gap:14px!important;flex-wrap:wrap!important;margin-top:4px!important}
#screen-app .gcard-meta-i{display:flex!important;align-items:center!important;gap:4px!important;font-size:.75rem!important;color:#64748B!important}
#screen-app .gcard-sources{margin-top:14px!important}
#screen-app .gsrc-ttl{font-size:.71rem!important;font-weight:700!important;letter-spacing:1px!important;text-transform:uppercase!important;color:#64748B!important;margin-bottom:7px!important}
#screen-app .gsrc-item{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:7px 10px!important;background:#F8FAFC!important;border-radius:8px!important;margin-bottom:5px!important}
#screen-app .gsrc-dot{width:7px!important;height:7px!important;border-radius:50%!important;flex-shrink:0!important}
#screen-app .gsrc-name{font-size:.8rem!important;color:#334155!important}
#screen-app .gsrc-val{font-size:.82rem!important;font-weight:700!important;color:#0F172A!important}

/* ══ MODAL (shared: aset + goals) ══ */
#screen-app .modal-ov{position:fixed!important;inset:0!important;background:rgba(0,0,0,.5)!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:2000!important;padding:16px!important}
#screen-app .modal-box{background:#fff!important;border-radius:20px!important;padding:28px!important;width:100%!important;max-width:480px!important;max-height:90vh!important;overflow-y:auto!important;box-shadow:0 24px 64px rgba(0,0,0,.25)!important}
#screen-app .modal-hdr{display:flex!important;align-items:center!important;justify-content:space-between!important;margin-bottom:20px!important}
#screen-app .modal-ttl{font-size:1.05rem!important;font-weight:700!important;color:#0F172A!important}
#screen-app .modal-cls{width:32px!important;height:32px!important;border-radius:50%!important;background:#F8FAFC!important;border:1px solid #E2E8F0!important;cursor:pointer!important;font-size:1rem!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-shrink:0!important;transition:background .15s;line-height:1!important}
#screen-app .modal-cls:hover{background:#FEE2E2!important;color:#DC2626!important}
#screen-app .mfg{margin-bottom:14px!important}
#screen-app .mfg label{display:block!important;font-size:.8rem!important;font-weight:600!important;color:#0F172A!important;margin-bottom:5px!important}
#screen-app .mfg input,#screen-app .mfg select{width:100%!important;padding:10px 13px!important;border:1.5px solid #E2E8F0!important;border-radius:9px!important;font-size:.88rem!important;font-family:'DM Sans',sans-serif!important;color:#0F172A!important;outline:none!important;transition:border-color .2s!important;background:#fff!important;box-sizing:border-box!important}
#screen-app .mfg input:focus,#screen-app .mfg select:focus{border-color:#2D4BFF!important}
#screen-app .mfg-hint{font-size:.72rem!important;color:#64748B!important;margin-top:3px!important}
#screen-app .mf-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important}
#screen-app .modal-ftr{display:flex!important;gap:9px!important;justify-content:flex-end!important;margin-top:20px!important;padding-top:16px!important;border-top:1px solid #E2E8F0!important}

/* ── CRUD 2-col form grid ── */
#screen-app .crud-2col{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important}
/* ── Asset inline edit grid ── */
#screen-app .aif-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;margin-bottom:8px!important}
/* ── Page main padding ── */
#screen-app .pg-main{padding:22px 24px!important}
/* ── FAB (default: desktop hidden) ── */
#screen-app .mob-add-fab{display:none!important}
/* ── Day nav (default: desktop hidden) ── */
#screen-app .day-nav-wrap{display:none!important}

@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}

@media(max-width:767px){
  #screen-app .modal-ov{align-items:flex-end!important;padding:0!important}
  #screen-app .modal-box{border-radius:20px 20px 0 0!important;max-height:90vh!important;max-width:100%!important;padding:16px 18px 34px!important;animation:slideUp .25s ease!important}
  #screen-app .crud-overlay{align-items:flex-end!important;padding:0!important}
  #screen-app .crud-modal{border-radius:20px 20px 0 0!important;max-width:100%!important;width:100%!important}
  #screen-app .mf-row{grid-template-columns:1fr!important}
  #screen-app .crud-2col{grid-template-columns:1fr!important}
  #screen-app .aif-grid{grid-template-columns:1fr!important}
  #screen-app .pg-main{padding:14px 14px 90px!important}
  #screen-app .row>*{flex:0 0 100%!important;min-width:100%!important}
  #screen-app .aset-edit-btns{opacity:1!important}
  #screen-app .cat-hdr{padding:15px 14px!important;min-height:56px!important}
  #screen-app .cat-items{padding:4px 14px 14px!important}
  #screen-app .goals-hero{padding:18px 16px!important}
  #screen-app .gh-stats{gap:10px!important;margin-top:12px!important}
  #screen-app .gh-stat{flex:1!important;min-width:calc(50% - 5px)!important}
  #screen-app .mob-add-fab{display:flex!important;position:fixed!important;bottom:72px!important;right:18px!important;width:54px!important;height:54px!important;border-radius:50%!important;background:linear-gradient(135deg,#2D4BFF,#22D3EE)!important;color:#fff!important;font-size:1.6rem!important;line-height:1!important;align-items:center!important;justify-content:center!important;box-shadow:0 6px 20px rgba(45,75,255,.4)!important;z-index:500!important;border:none!important;cursor:pointer!important;transition:transform .15s,box-shadow .2s!important}
  #screen-app .mob-add-fab:active{transform:scale(.9)!important}
  #screen-app .day-nav-wrap{display:flex!important;flex-direction:column!important;background:#fff!important;border-bottom:1px solid #F1F5F9!important;margin-bottom:2px!important}
  #screen-app .day-nav-row{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:9px 14px!important;gap:8px!important}
  #screen-app .day-nav-lbl{font-family:'Sora',sans-serif!important;font-weight:700!important;font-size:.9rem!important;color:#0F172A!important;flex:1!important;text-align:center!important}
  #screen-app .day-nav-arrow{width:32px!important;height:32px!important;border-radius:50%!important;border:1.5px solid #E2E8F0!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:.9rem!important;cursor:pointer!important;color:#334155!important;transition:all .15s!important;flex-shrink:0!important}
  #screen-app .day-nav-arrow:disabled{opacity:.3!important;cursor:default!important}
  #screen-app .day-nav-arrow:not(:disabled):active{background:#E9EDFF!important;border-color:#2D4BFF!important}
  #screen-app .day-chips-row{display:flex!important;gap:6px!important;overflow-x:auto!important;padding:0 14px 10px!important;scrollbar-width:none!important}
  #screen-app .day-chips-row::-webkit-scrollbar{display:none!important}
  #screen-app .day-chip{flex-shrink:0!important;padding:5px 13px!important;border-radius:99px!important;border:1.5px solid #E2E8F0!important;background:#fff!important;font-size:.74rem!important;font-weight:600!important;color:#64748B!important;cursor:pointer!important;transition:all .15s!important;font-family:'DM Sans',sans-serif!important;white-space:nowrap!important}
  #screen-app .day-chip.active{background:#2D4BFF!important;border-color:#2D4BFF!important;color:#fff!important}
  #screen-app .txn-day-hdr{padding:5px 16px!important;font-size:.7rem!important;font-weight:700!important;color:#94A3B8!important;background:#F8FAFC!important;text-transform:uppercase!important;letter-spacing:.5px!important;display:flex!important;justify-content:space-between!important;align-items:center!important;border-bottom:1px solid #F1F5F9!important}
  #screen-app .txn-day-hdr-amt{color:#DC2626!important;font-weight:700!important}
}
`;

/* ─── DATA & HELPERS ─── */
// USER data loaded dynamically from sessionStorage (mira_user + mira_txns)
const CATS = ['Makanan','Transport','Belanja','Tagihan','Kesehatan','Hiburan','Pemasukan'];
const C_EMJ: Record<string,string> = {Makanan:'🍜',Transport:'🚗',Belanja:'🛍️',Tagihan:'💡',Kesehatan:'💊',Hiburan:'🎮',Pemasukan:'💰'};
const C_CLS: Record<string,string> = {Makanan:'tag-food',Transport:'tag-transport',Belanja:'tag-shopping',Tagihan:'tag-bills',Kesehatan:'tag-health',Hiburan:'tag-entertainment',Pemasukan:'tag-income'};
const MRCHTS = ['GrabFood','Indomaret','Shopee','PLN','Apotek K24','Netflix','Gojek','Alfamart','GoFood','Tokopedia','DANA','Traveloka','McD','KFC','Uniqlo','Spotify','Guardian'];
const METHODS = ['GoPay','OVO','DANA','BCA','Mandiri','Tunai','ShopeePay','Kartu Kredit','Debit'];
const ITEMS: Record<string,string[]> = {Makanan:['Makan Siang','Kopi Pagi','Makan Malam','Cemilan','Minuman'],Transport:['Grab Car','GoJek','Bensin','Parkir','Busway'],Belanja:['Baju','Sepatu','Skincare','Kebutuhan Rumah','Buku'],Tagihan:['Listrik','Air','Internet','BPJS','Pulsa'],Kesehatan:['Obat','Konsultasi Dokter','Vitamin','Gym','Dental'],Hiburan:['Bioskop','Game','Nongkrong','Karaoke','Streaming'],Pemasukan:['Gaji Bulanan','Freelance','Bonus','Transfer Masuk']};
const SUBS: Record<string,string[]> = {Makanan:['Nasi Padang','Kopi Latte','Mie Ayam','Boba','Martabak'],Transport:['GRAB Car','GoRide','Pertamax','Mall','TransJakarta'],Belanja:['Baju Kerja','Sneakers','Moisturizer','Sabun','Novel'],Tagihan:['Token 100k','PDAM','IndiHome','Kesehatan','XL'],Kesehatan:['Paracetamol','dr. Budi','Vitamin C','Membership','Scaling'],Hiburan:['CGV Senayan','Mobile Legends','Starbucks','Inul Vista','Netflix'],Pemasukan:['Gaji','Project UI/UX','THR','Transfer Masuk']};
const COLORS = ['#2D4BFF','#22D3EE','#8B5CF6','#16A34A','#F59E0B','#EF4444'];
const BANK_O=['BRI','BCA','Mandiri','BNI','BTN','CIMB Niaga','Danamon','Permata','OCBC NISP','Panin','Maybank','Mega','Sinarmas','BSI','CIMB Syariah','Bank Jago','Jenius (BTPN)','SeaBank','Blu by BCA','Neo Bank'];
const BANK_V=['bri','bca','mandiri','bni','btn','cimb','danamon','permata','ocbc','panin','maybank','mega','sinarmas','bsi','cimb-syariah','jago','jenius','seabank','blu','neo'];
const EW_O=['GoPay','OVO','DANA','ShopeePay','LinkAja','AstraPay','Lainnya'];
const EW_V=['gopay','ovo','dana','shopeepay','linkaja','astrapay','lainnya'];
const PL_O=['Kartu Kredit Bank','Kredivo','Akulaku','SPayLater','GoPayLater','Traveloka PayLater'];
const PL_V=['cc-bank','kredivo','akulaku','spaylater','gopaylater','traveloka'];
const PAGE_SIZE = 25;
const ri = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const fmt = (n: number) => 'Rp' + n.toLocaleString('id-ID');

// ─── HELPERS UNTUK DATA REAL ───────────────────────────────────────
function formatDateID(iso: string): string {
  try { return new Date(iso).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}); }
  catch { return iso; }
}
function parseCsv(s: string): string[] {
  if (!s || s === '-') return [];
  return s.split(',').map(x => x.trim().toLowerCase().replace(/\s+/g,''));
}
// tryParseJSON — helper untuk field JSON dari Supabase (banks_used, ewallets_used, dll)
function tryParseJSON<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (Array.isArray(val)) return val as unknown as T;
  try { return JSON.parse(val); } catch { return fallback; }
}
function mapCategory(cat: string): string {
  const m: Record<string,string> = {
    food:'Makanan',Food:'Makanan',makanan:'Makanan',Makanan:'Makanan',
    transport:'Transport',Transport:'Transport',
    shopping:'Belanja',Shopping:'Belanja',Belanja:'Belanja',
    bills:'Tagihan',Bills:'Tagihan',Tagihan:'Tagihan',utilities:'Tagihan',
    health:'Kesehatan',Health:'Kesehatan',Kesehatan:'Kesehatan',
    entertainment:'Hiburan',Entertainment:'Hiburan',Hiburan:'Hiburan',
    income:'Pemasukan',Income:'Pemasukan',Pemasukan:'Pemasukan',salary:'Pemasukan',
  };
  return m[cat] || 'Makanan';
}

// ─── mapUserRow — petakan raw Supabase user row ke LiveUser ──────────────────
// Dipanggil dari sessionStorage (awal) DAN dari fresh Supabase fetch.
// Wajib gunakan ini supaya account_status selalu terbaca dengan benar.
function mapUserRow(u: Record<string, any>, ph: string): LiveUser {
  const nameRaw = u.name || 'Pengguna';
  return {
    name          : nameRaw,
    avatar        : nameRaw[0]?.toUpperCase() || '?',
    affCode       : u.affiliate_code || ('MIRA' + ph.slice(-4)).toUpperCase(),
    plan_name     : u.plan_name     || 'Personal',
    // PENTING: pakai ?? bukan || — biar 'pending_assessment' tidak di-override jadi 'active'
    account_status: u.account_status ?? 'active',
    registered_by : u.registered_by  ?? null,
    expiry        : formatDateID(u.valid_to || ''),
    valid_from    : u.valid_from    || null,
    valid_to      : u.valid_to      || null,
    score_total   : Number(u.score_total)               || 0,
    scoreIncome   : Number(u.score_income_stability)    || 0,
    scoreExpense  : Number(u.score_expense_pressure)    || 0,
    scoreControl  : Number(u.score_spending_control)    || 0,
    scoreSaving   : Number(u.score_saving_discipline)   || 0,
    scoreEmergency: Number(u.score_emergency_fund)      || 0,
    scoreInvest   : Number(u.score_investment)          || 0,
    scoreDebt     : Number(u.score_debt)                || 0,
    scoreBehavior : Number(u.score_behavior)            || 0,
    income_range      : u.income_range            || '-',
    income_type       : u.income_type             || '-',
    income_estimated  : Number(u.income_estimated_idr) || 0,
    saving_goals      : u.saving_goals            || '-',
    saving_allocation_pct: Number(u.saving_allocation_pct) || 0,
    emergency_fund    : u.emergency_fund_duration || '-',
    invest_status     : u.investment_status       || '-',
    invest_instruments: u.investment_instruments  || '-',
    debt_status       : u.debt_status             || '-',
    paylater_habit    : u.paylater_habit           || '-',
    impulse           : u.impulse_buy_frequency   || '-',
    biggest_cat       : u.biggest_spend_category  || '-',
    expense_alloc_pct : Number(u.expense_allocation_pct) || 0,
    mandatory_exp     : u.mandatory_expenses       || '-',
    payday_pattern    : u.payday_pattern           || '-',
    payment_ranking   : u.payment_method_ranking  || '',
    banks   : tryParseJSON(u.banks_used,      []),
    ewallets: tryParseJSON(u.ewallets_used,   []),
    paylater: tryParseJSON(u.paylater_active, []),
  };
}

interface LiveUser {
  name: string; plan_name: string; score_total: number; expiry: string;
  affCode: string; avatar: string; account_status: string;
  registered_by?: string | null;
  // Scores per-kategori
  scoreIncome: number; scoreExpense: number; scoreControl: number;
  scoreSaving: number; scoreEmergency: number; scoreInvest: number;
  scoreDebt: number; scoreBehavior: number;
  // Profil keuangan
  income_range: string; income_type: string; income_estimated: number;
  saving_goals: string; emergency_fund: string;
  invest_status: string; invest_instruments: string;
  debt_status: string; paylater_habit: string;
  impulse: string; biggest_cat: string;
  expense_alloc_pct: number; mandatory_exp: string;
  payday_pattern: string; payment_ranking: string;
  saving_allocation_pct: number;
  valid_from: string | null; valid_to: string | null;
  banks: string[]; ewallets: string[]; paylater: string[];
}

interface Txn {
  id?: string;
  phone_number?: string;
  date: Date; item: string; sub: string; merchant: string;
  cat: string; amount: number; method: string;
  currency: string; quantity: number; isIn: boolean;
  source_msg_id?: string | null;
  created_at?: string | null;
}

/* ─── TOAST HOOK ─── */
function useToast() {
  const [msg, setMsg] = useState('');
  const [type, setType] = useState('');
  const [show, setShow] = useState(false);
  const tmr = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useCallback((m: string, t = '') => {
    setMsg(m); setType(t); setShow(true);
    if (tmr.current) clearTimeout(tmr.current);
    tmr.current = setTimeout(() => setShow(false), 3200);
  }, []);
  return {msg, type, show, toast};
}

/* ─── PAGE: DASHBOARD ─── */
function PageDashboard({txns, period}: {txns: Txn[]; period: string}) {
  const income = txns.filter(t => t.isIn).reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => !t.isIn).reduce((s, t) => s + t.amount, 0);
  const saving = income - expense;
  const savePct = income > 0 ? Math.round(saving / income * 100) : 0;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const skip = days > 30 ? 7 : days > 14 ? 2 : 1;
  const trendData: {label:string;exp:number;inc:number}[] = [];
  // Agregasi per WINDOW (bukan per hari persis) agar income yang hanya muncul
  // sekali/bulan tidak hilang di antara titik plot yang di-skip
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    if (i % skip !== 0) continue;
    const d = new Date(); d.setDate(d.getDate() - i);
    // Window: [i+skip hari lalu, i hari lalu] — tangkap semua transaksi di antara dua titik plot
    const winEnd   = d.getTime() + 86400000;                   // hari ini + 1 hari (eksklusif atas)
    const winStart = winEnd - skip * 86400000;                  // mundur sejauh 1 skip window
    const dt = txns.filter(t => {
      const ms = t.date.getTime();
      return ms >= winStart && ms < winEnd;
    });
    // Juga tangkap income yang mungkin tersebar lebih jauh ke belakang untuk titik pertama
    trendData.push({
      label: d.toLocaleDateString('id-ID', {day:'2-digit', month:'short'}),
      exp: Math.round(dt.filter(t => !t.isIn).reduce((s, t) => s + t.amount, 0) / 1000),
      inc: Math.round(dt.filter(t =>  t.isIn).reduce((s, t) => s + t.amount, 0) / 1000),
    });
  }
  const catT: Record<string,number> = {};
  CATS.filter(c => c !== 'Pemasukan').forEach(c => catT[c] = 0);
  txns.filter(t => !t.isIn).forEach(t => catT[t.cat] = (catT[t.cat] || 0) + t.amount);
  const pieData = Object.entries(catT).filter(([,v]) => v > 0).map(([name, value], i) => ({name, value, color: COLORS[i % COLORS.length]}));
  const barData = Object.entries(catT).map(([name, value]) => ({name: C_EMJ[name] + ' ' + name, value: Math.round(value / 1000)}));
  const top = Object.entries(catT).sort((a, b) => b[1] - a[1])[0] || ['—', 0];
  const ins = [
    {icon:'📊', bg:'#EFF6FF', title:'Kategori Terbesar', desc:`${C_EMJ[top[0]]||''} ${top[0]} — ${fmt(top[1] as number)} (${income>0?Math.round((top[1] as number)/income*100):0}% dari pemasukan)`},
    {icon:'💰', bg:'#F0FDF4', title:'Saving Rate', desc: savePct>=20?`Hebat! ${savePct}% penghasilan berhasil ditabung.`:savePct>=10?`${savePct}% saving rate. Target minimal 20%.`:`⚠️ Hanya ${savePct}% tersisa. Perlu evaluasi pengeluaran.`},
    {icon:'📈', bg:'#FFF7ED', title:'Tren Pengeluaran', desc:'Pengeluaran naik 8% vs period lalu. Kategori F&B meningkat paling signifikan.'},
    {icon:'⚡', bg:'#FDF4FF', title:'Rekomendasi MIRA', desc: savePct<10?'Kurangi pengeluaran F&B & belanja online untuk mencapai target tabungan.':'Kamu on-track! Pertahankan kebiasaan finansialmu.'},
  ];
  return (
    <div className="page">
      <div className="g4" style={{marginBottom:16}}>
        {[
          {ico:'💰',bg:'#EFF6FF',lbl:'Total Pemasukan',val:fmt(income),tr:'▲ +12% vs period lalu',tc:'t-dn'},
          {ico:'💸',bg:'#FFF7ED',lbl:'Total Pengeluaran',val:fmt(expense),tr:'▲ +8% vs period lalu',tc:'t-up'},
          {ico:'🏦',bg:'#F0FDF4',lbl:'Tabungan Bersih',val:fmt(Math.max(0,saving)),tr:savePct+'% saving rate',tc:savePct>=20?'t-dn':'t-up'},
          {ico:'📈',bg:'#E9EDFF',lbl:'Jumlah Transaksi',val:String(txns.length),tr:'period ini',tc:'t-neu'},
        ].map((s, i) => (
          <div key={i} className="stat-c">
            <div className="stat-ico" style={{background:s.bg}}>{s.ico}</div>
            <div className="stat-lbl">{s.lbl}</div>
            <div className="stat-val">{s.val}</div>
            <div className={`stat-trend ${s.tc}`}>{s.tr}</div>
          </div>
        ))}
      </div>
      <div className="row" style={{marginBottom:16}}>
        <div style={{flex:2,minWidth:0}} className="chart-c">
          <div className="chart-h">
            <h3>📈 Tren Pengeluaran vs Pemasukan</h3>
            <span style={{fontSize:'.74rem',color:'#64748B'}}>Rp000</span>
          </div>
          <ResponsiveContainer width="100%" height={175}>
            <LineChart data={trendData} margin={{top:4,right:4,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
              <XAxis dataKey="label" tick={{fontSize:9}} stroke="#E2E8F0"/>
              <YAxis tick={{fontSize:9}} tickFormatter={v => 'Rp'+v+'k'} stroke="#E2E8F0" width={46}/>
              <Tooltip
                formatter={(v: number, name: string) => [`Rp${v.toLocaleString('id-ID')}k`, name]}
                labelStyle={{fontSize:'.78rem',fontWeight:700}}
                contentStyle={{borderRadius:10,border:'1px solid #E2E8F0',fontSize:'.78rem'}}
              />
              <Legend wrapperStyle={{fontSize:9}}/>
              <Line type="monotone" dataKey="exp" stroke="#EF4444" strokeWidth={2.5} dot={(p) => p.payload.exp > 0 ? <circle key={p.key} cx={p.cx} cy={p.cy} r={3} fill="#EF4444"/> : <g key={p.key}/>} name="Pengeluaran" connectNulls/>
              <Line type="monotone" dataKey="inc" stroke="#16A34A" strokeWidth={2.5} dot={(p) => p.payload.inc > 0 ? <circle key={p.key} cx={p.cx} cy={p.cy} r={4} fill="#16A34A"/> : <g key={p.key}/>} name="Pemasukan" connectNulls/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{flex:1,minWidth:0}} className="chart-c">
          <div className="chart-h"><h3>🍕 Per Kategori</h3></div>
          <ResponsiveContainer width="100%" height={175}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius="50%" outerRadius="75%" dataKey="value">
                {pieData.map((e, i) => <Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)}/>
              <Legend wrapperStyle={{fontSize:9}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="row">
        <div style={{flex:3,minWidth:0}} className="chart-c">
          <div className="chart-h"><h3>📊 Pengeluaran per Kategori</h3></div>
          <ResponsiveContainer width="100%" height={195}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
              <XAxis dataKey="name" tick={{fontSize:9}} stroke="#E2E8F0"/>
              <YAxis tick={{fontSize:9}} tickFormatter={v => 'Rp'+v+'k'} stroke="#E2E8F0"/>
              <Tooltip formatter={(v: number) => 'Rp'+v+'k'}/>
              <Bar dataKey="value" radius={[5,5,0,0]}>
                {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]+'CC'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{flex:2,minWidth:0}} className="card">
          <div className="card-ttl">💡 Insights MIRA</div>
          <div className="ins-list">
            {ins.map((x, i) => (
              <div key={i} className="ins-item">
                <div className="ins-ico" style={{background:x.bg}}>{x.icon}</div>
                <div>
                  <div className="ins-title">{x.title}</div>
                  <div className="ins-desc">{x.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── TXNS CRUD MODAL ─── */
const EMPTY_FORM = {item:'',merchant:'',category:'Makanan',amount:'',wallet:'',date:new Date().toISOString().split('T')[0],currency:'IDR',quantity:'1'};

interface TxnCrudProps {
  allTxns: Txn[];
  sessionPhone: string;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, fields: Record<string,any>) => Promise<void>;
  onAdd: (fields: Record<string,any>) => Promise<void>;
}

/* ─── PAGE: TRANSACTIONS ─── */
type SortBy = 'newest'|'oldest'|'highest'|'lowest';

function PageTxns({allTxns, onDelete, onUpdate, onAdd}: TxnCrudProps) {
  const [search, setSearch]         = useState('');
  const [cat, setCat]               = useState('all');
  const [methodFilter, setMethod]   = useState('all');
  const [sortBy, setSortBy]         = useState<SortBy>('newest');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [pg, setPg]                 = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  /* ── Modal state ── */
  const [modal, setModal] = useState<{open:boolean; mode:'add'|'edit'; txn:Txn|null}>({open:false, mode:'add', txn:null});
  const [form, setForm] = useState<Record<string,string>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  /* ── Click-through guard for txn modal ── */
  const txnModalOpenedAt = useRef(0);
  const tryCloseTxnOverlay = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && Date.now() - txnModalOpenedAt.current > 400) closeModal();
  };

  const openAdd = () => {
    txnModalOpenedAt.current = Date.now();
    setForm({...EMPTY_FORM, date: new Date().toISOString().split('T')[0]});
    setModal({open:true, mode:'add', txn:null});
  };
  const openEdit = (t: Txn) => {
    setForm({
      item    : t.item     || '',
      merchant: t.merchant || '',
      category: t.cat      || 'Makanan',
      amount  : String(t.amount),
      wallet  : t.method   || '',
      date    : t.date instanceof Date ? t.date.toISOString().split('T')[0] : '',
      currency: t.currency || 'IDR',
      quantity: String(t.quantity || 1),
    });
    setModal({open:true, mode:'edit', txn:t});
  };
  const closeModal = () => { setModal({open:false, mode:'add', txn:null}); setSaving(false); };
  const setField = (k: string, v: string) => setForm(f => ({...f, [k]: v}));

  const handleSave = async () => {
    if (!form.item.trim()) return;
    setSaving(true);
    const payload = {
      item    : form.item.trim(),
      merchant: form.merchant.trim(),
      category: form.category,
      amount  : Number(form.amount) || 0,
      wallet  : form.wallet.trim(),
      date    : form.date,
      currency: form.currency,
      quantity: Number(form.quantity) || 1,
    };
    try {
      if (modal.mode === 'edit' && modal.txn?.id) {
        await onUpdate(modal.txn.id, payload);
      } else {
        await onAdd(payload);
      }
      closeModal();
    } catch {
      setSaving(false);
    }
  };

  // Extract unique methods dari semua transaksi
  const uniqueMethods = Array.from(new Set(allTxns.map(t => t.method).filter(m => m && m !== '-'))).sort();

  const filt = allTxns.filter(t => {
    const mc = cat === 'all' || t.cat === cat;
    const mf = methodFilter === 'all' || t.method === methodFilter;
    const q = search.toLowerCase();
    const textOk = !q || [t.item, t.merchant, t.cat, t.sub, t.method].some(s => (s||'').toLowerCase().includes(q));
    const fromOk = !dateFrom || t.date >= new Date(dateFrom);
    const toOk   = !dateTo   || t.date <= new Date(dateTo + 'T23:59:59');
    return mc && mf && textOk && fromOk && toOk;
  });

  // Sort
  const sorted = [...filt].sort((a, b) => {
    if (sortBy === 'oldest')  return a.date.getTime() - b.date.getTime();
    if (sortBy === 'highest') return b.amount - a.amount;
    if (sortBy === 'lowest')  return a.amount - b.amount;
    return b.date.getTime() - a.date.getTime(); // newest (default)
  });

  const activeFilterCount = [
    cat !== 'all', methodFilter !== 'all', !!dateFrom, !!dateTo, !!search, sortBy !== 'newest'
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearch(''); setCat('all'); setMethod('all');
    setSortBy('newest'); setDateFrom(''); setDateTo(''); setPg(1);
  };

  const total = Math.ceil(sorted.length / PAGE_SIZE);
  const start = (pg - 1) * PAGE_SIZE;
  const visible = sorted.slice(start, start + PAGE_SIZE);
  const pages = Array.from({length:total}, (_, i) => i+1).filter(i => i===1||i===total||Math.abs(i-pg)<=1);

  // ── Day navigation helpers ──
  const toDateStr = (d: Date) => d.toISOString().split('T')[0];
  const availableDays = useMemo(() => {
    const days = new Set<string>();
    sorted.forEach(t => { if (t.date instanceof Date) days.add(toDateStr(t.date)); });
    return Array.from(days).sort((a,b) => b.localeCompare(a)).slice(0, 14);
  }, [sorted]);

  const getDayLabel = (ds: string): string => {
    if (ds === 'all') return 'Semua Hari';
    const todayStr = toDateStr(new Date());
    const yesterStr = toDateStr(new Date(Date.now() - 86400000));
    if (ds === todayStr) return 'Hari ini';
    if (ds === yesterStr) return 'Kemarin';
    return new Date(ds + 'T00:00:00').toLocaleDateString('id-ID', {weekday:'short', day:'numeric', month:'short'});
  };

  const dayIdx = selectedDay === 'all' ? -1 : availableDays.indexOf(selectedDay);
  const canPrev = dayIdx !== -1 && dayIdx < availableDays.length - 1;
  const canNext = dayIdx > 0;
  const goPrev = () => { if (canPrev) setSelectedDay(availableDays[dayIdx + 1]); };
  const goNext = () => { if (canNext) setSelectedDay(availableDays[dayIdx - 1]); };

  // Transactions for selected day (mobile: bypasses pagination)
  const mobDayItems = selectedDay === 'all' ? visible : sorted.filter(t =>
    t.date instanceof Date && toDateStr(t.date) === selectedDay
  );
  // Day total (outflow)
  const mobDayTotal = selectedDay !== 'all'
    ? mobDayItems.filter(t => !t.isIn).reduce((s,t) => s + t.amount, 0)
    : 0;

  const exportCSV = () => {
    const h = ['Tanggal','Item','Merchant','Kategori','Biaya','Metode'];
    const r = sorted.map(t => [t.date.toLocaleDateString('id-ID'),t.item,t.merchant,t.cat,(t.isIn?'+':'-')+t.amount,t.method]);
    const csv = [h,...r].map(row => row.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download = 'MIRA_Transaksi.csv'; a.click();
  };

  /* ── Form field renderer ── */
  const fgStyle: React.CSSProperties = {marginBottom:14};
  const lblStyle: React.CSSProperties = {display:'block',fontSize:'.82rem',fontWeight:600,color:'#0F172A',marginBottom:5,fontFamily:"'DM Sans',sans-serif"};
  const inpStyle: React.CSSProperties = {width:'100%',padding:'9px 12px',border:'1.5px solid #E2E8F0',borderRadius:9,fontSize:'.87rem',fontFamily:"'DM Sans',sans-serif",color:'#0F172A',outline:'none',boxSizing:'border-box',background:'#fff'};
  const selStyle: React.CSSProperties = {...inpStyle};

  return (
    <div className="page">
      {/* ── CRUD Modal ── */}
      {modal.open && (
        <div className="crud-overlay" onClick={tryCloseTxnOverlay}>
          <div className="crud-modal" onClick={e => e.stopPropagation()}>
            <div className="crud-modal-head">
              <h3>{modal.mode === 'add' ? '➕ Tambah Transaksi' : '✏️ Edit Transaksi'}</h3>
              <button className="crud-close" onClick={closeModal}>✕</button>
            </div>
            <div className="crud-modal-body">
              <div style={fgStyle}>
                <label style={lblStyle}>Item / Deskripsi *</label>
                <input style={inpStyle} type="text" placeholder="cth: Makan Siang" value={form.item} onChange={e => setField('item', e.target.value)}/>
              </div>
              <div className="crud-2col" style={fgStyle}>
                <div>
                  <label style={lblStyle}>Merchant</label>
                  <input style={inpStyle} type="text" placeholder="cth: GoFood" value={form.merchant} onChange={e => setField('merchant', e.target.value)}/>
                </div>
                <div>
                  <label style={lblStyle}>Kategori</label>
                  <select style={selStyle} value={form.category} onChange={e => setField('category', e.target.value)}>
                    {CATS.map(c => <option key={c} value={c}>{C_EMJ[c]} {c}</option>)}
                  </select>
                </div>
              </div>
              <div className="crud-2col" style={fgStyle}>
                <div>
                  <label style={lblStyle}>Amount (Rp)</label>
                  <input style={inpStyle} type="number" min="0" placeholder="0" value={form.amount} onChange={e => setField('amount', e.target.value)}/>
                </div>
                <div>
                  <label style={lblStyle}>Qty</label>
                  <input style={inpStyle} type="number" min="1" placeholder="1" value={form.quantity} onChange={e => setField('quantity', e.target.value)}/>
                </div>
              </div>
              <div className="crud-2col" style={fgStyle}>
                <div>
                  <label style={lblStyle}>Wallet / Metode</label>
                  <input style={inpStyle} type="text" placeholder="cth: GoPay" value={form.wallet} onChange={e => setField('wallet', e.target.value)}/>
                </div>
                <div>
                  <label style={lblStyle}>Tanggal</label>
                  <input style={inpStyle} type="date" value={form.date} onChange={e => setField('date', e.target.value)}/>
                </div>
              </div>
            </div>
            <div className="crud-modal-foot">
              <button className="btn btn-ghost btn-sm" style={{width:'auto'}} onClick={closeModal}>Batal</button>
              <button
                className="btn btn-sm"
                style={{width:'auto', opacity: saving || !form.item.trim() ? 0.5 : 1, cursor: saving || !form.item.trim() ? 'not-allowed' : 'pointer'}}
                onClick={handleSave}
                disabled={saving || !form.item.trim()}
              >
                {saving ? '⏳ Menyimpan...' : modal.mode === 'add' ? '➕ Tambah' : '💾 Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DESKTOP FILTERS ══ */}
      <div className="txn-filters txn-desktop">
        <button className="btn btn-sm" style={{width:'auto',flexShrink:0}} onClick={openAdd}>➕ Tambah</button>
        <div className="search-bar">
          <span>🔍</span>
          <input type="text" placeholder="Cari item, merchant..." value={search} onChange={e => {setSearch(e.target.value); setPg(1);}}/>
        </div>
        <select className="f-chip" value={cat} onChange={e => {setCat(e.target.value); setPg(1);}}>
          <option value="all">Semua Kategori</option>
          {CATS.map(c => <option key={c} value={c}>{C_EMJ[c]} {c}</option>)}
        </select>
        <select className="f-chip" value={methodFilter} onChange={e => {setMethod(e.target.value); setPg(1);}}>
          <option value="all">Semua Metode</option>
          {uniqueMethods.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="f-chip" value={sortBy} onChange={e => {setSortBy(e.target.value as SortBy); setPg(1);}}>
          <option value="newest">⬇ Terbaru</option>
          <option value="oldest">⬆ Terlama</option>
          <option value="highest">💰 Terbesar</option>
          <option value="lowest">💸 Terkecil</option>
        </select>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <input type="date" className="f-chip" value={dateFrom} style={{padding:'6px 10px',cursor:'pointer'}} onChange={e => {setDateFrom(e.target.value); setPg(1);}}/>
          <span style={{fontSize:'.78rem',color:'#64748B'}}>–</span>
          <input type="date" className="f-chip" value={dateTo} style={{padding:'6px 10px',cursor:'pointer'}} onChange={e => {setDateTo(e.target.value); setPg(1);}}/>
        </div>
        {activeFilterCount > 0 && <button className="f-chip" style={{color:'#DC2626',borderColor:'#FECACA',background:'#FEF2F2',flexShrink:0}} onClick={resetFilters}>✕ Reset</button>}
        <button className="f-chip" style={{background:'#DCFCE7',color:'#16A34A',borderColor:'#86EFAC',flexShrink:0}} onClick={exportCSV}>⬇️ CSV</button>
      </div>

      {/* ══ MOBILE FILTERS ══ */}
      <div className="mob-filter-bar">
        {/* Tambah btn */}
        <button className="mob-filter-open-btn" style={{background:'linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%)'}} onPointerDown={e => { e.preventDefault(); openAdd(); }}>➕</button>
        {/* Search */}
        <div className="mob-filter-chip" style={{flex:1,minWidth:120,padding:'7px 10px',border:'1.5px solid #E2E8F0',borderRadius:10,display:'flex',alignItems:'center',gap:6,background:'#fff',cursor:'text'}}
          onClick={() => { const el = document.getElementById('mob-search-inp'); el?.focus(); }}>
          <span style={{fontSize:'.85rem'}}>🔍</span>
          <input
            id="mob-search-inp"
            type="text"
            placeholder="Cari..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPg(1); }}
            style={{border:'none',outline:'none',fontSize:'.82rem',flex:1,background:'transparent',color:'#0F172A',fontFamily:"'DM Sans',sans-serif",minWidth:0}}
          />
        </div>
        {/* Filter button */}
        <button className={`mob-filter-open-btn${activeFilterCount > 0 ? '' : ''}`}
          style={{background: activeFilterCount > 0 ? 'linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%)' : '#fff', color: activeFilterCount > 0 ? '#fff' : '#334155', border: activeFilterCount > 0 ? 'none' : '1.5px solid #E2E8F0', padding:'7px 14px', borderRadius:99, fontSize:'.82rem', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5, flexShrink:0, fontFamily:"'Sora',sans-serif"}}
          onClick={() => setFilterOpen(true)}
        >
          ⚙️ Filter{activeFilterCount > 0 && <span className="active-filter-badge">{activeFilterCount}</span>}
        </button>
      </div>

      {/* ══ MOBILE FILTER DRAWER ══ */}
      <div className={`filter-drawer-overlay${filterOpen ? ' open' : ''}`} onClick={() => setFilterOpen(false)}/>
      <div className={`filter-drawer${filterOpen ? ' open' : ''}`}>
        <div className="filter-drawer-handle"/>
        <div className="filter-drawer-head">
          <span style={{fontSize:'.95rem',fontWeight:700,color:'#0F172A',fontFamily:"'Sora',sans-serif"}}>⚙️ Filter & Urutkan</span>
          <button onClick={() => setFilterOpen(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#64748B',fontSize:'1.1rem',padding:'4px 8px'}}>✕</button>
        </div>
        <div className="filter-drawer-body">
          {/* Urutkan */}
          <div className="filter-sect">
            <span className="filter-sect-lbl">Urutkan</span>
            <div className="filter-opts">
              {([['newest','⬇ Terbaru'],['oldest','⬆ Terlama'],['highest','💰 Terbesar'],['lowest','💸 Terkecil']] as [SortBy,string][]).map(([v,l]) => (
                <button key={v} className={`fopt${sortBy===v?' on':''}`} onClick={() => {setSortBy(v); setPg(1);}}>{l}</button>
              ))}
            </div>
          </div>
          {/* Kategori */}
          <div className="filter-sect">
            <span className="filter-sect-lbl">Kategori</span>
            <div className="filter-opts">
              <button className={`fopt${cat==='all'?' on':''}`} onClick={() => {setCat('all'); setPg(1);}}>Semua</button>
              {CATS.map(c => (
                <button key={c} className={`fopt${cat===c?' on':''}`} onClick={() => {setCat(c); setPg(1);}}>{C_EMJ[c]} {c}</button>
              ))}
            </div>
          </div>
          {/* Metode Bayar */}
          {uniqueMethods.length > 0 && (
            <div className="filter-sect">
              <span className="filter-sect-lbl">Metode Bayar</span>
              <div className="filter-opts">
                <button className={`fopt${methodFilter==='all'?' on':''}`} onClick={() => {setMethod('all'); setPg(1);}}>Semua</button>
                {uniqueMethods.map(m => (
                  <button key={m} className={`fopt${methodFilter===m?' on':''}`} onClick={() => {setMethod(m); setPg(1);}}>{m}</button>
                ))}
              </div>
            </div>
          )}
          {/* Tanggal */}
          <div className="filter-sect">
            <span className="filter-sect-lbl">Rentang Tanggal</span>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:'.74rem',color:'#94A3B8',marginBottom:4}}>Dari</div>
                <input type="date" value={dateFrom} onChange={e => {setDateFrom(e.target.value); setPg(1);}} style={{width:'100%',padding:'9px 11px',border:'1.5px solid #E2E8F0',borderRadius:9,fontSize:'.84rem',fontFamily:"'DM Sans',sans-serif",color:'#0F172A',outline:'none',boxSizing:'border-box'}}/>
              </div>
              <div style={{color:'#CBD5E1',marginTop:18}}>—</div>
              <div style={{flex:1}}>
                <div style={{fontSize:'.74rem',color:'#94A3B8',marginBottom:4}}>Sampai</div>
                <input type="date" value={dateTo} onChange={e => {setDateTo(e.target.value); setPg(1);}} style={{width:'100%',padding:'9px 11px',border:'1.5px solid #E2E8F0',borderRadius:9,fontSize:'.84rem',fontFamily:"'DM Sans',sans-serif",color:'#0F172A',outline:'none',boxSizing:'border-box'}}/>
              </div>
            </div>
          </div>
        </div>
        <div className="filter-drawer-foot">
          <button className="btn btn-ghost btn-sm" style={{flex:1,justifyContent:'center'}} onClick={() => {resetFilters(); setFilterOpen(false);}}>🗑 Reset Semua</button>
          <button className="btn btn-sm" style={{flex:1,justifyContent:'center'}} onClick={() => setFilterOpen(false)}>✓ Terapkan ({sorted.length})</button>
        </div>
      </div>

      {/* ── Day Navigation Bar (mobile only) ── */}
      <div className="day-nav-wrap">
        <div className="day-nav-row">
          <button className="day-nav-arrow" onClick={goPrev} disabled={!canPrev}>◀</button>
          <span className="day-nav-lbl">
            {getDayLabel(selectedDay)}
            {selectedDay !== 'all' && mobDayTotal > 0 && (
              <span style={{fontSize:'.75rem',color:'#DC2626',marginLeft:8}}>−{fmt(mobDayTotal)}</span>
            )}
          </span>
          <button className="day-nav-arrow" onClick={goNext} disabled={!canNext}>▶</button>
        </div>
        <div className="day-chips-row">
          <button className={`day-chip${selectedDay==='all'?' active':''}`} onClick={() => setSelectedDay('all')}>📋 Semua</button>
          {availableDays.map(ds => (
            <button key={ds} className={`day-chip${selectedDay===ds?' active':''}`} onClick={() => setSelectedDay(ds)}>
              {getDayLabel(ds)}
            </button>
          ))}
        </div>
      </div>

      <div className="txn-wrap">
        {/* ── Desktop table ── */}
        <div className="txn-desktop" style={{overflowX:'auto'}}>
          <table className="txn-table">
            <thead>
              <tr><th>Tanggal</th><th>Item</th><th>Merchant</th><th>Kategori</th><th>Biaya</th><th>Metode</th><th style={{width:68,textAlign:'center'}}>Aksi</th></tr>
            </thead>
            <tbody>
              {visible.map((t, i) => (
                <tr key={t.id || i}>
                  <td style={{whiteSpace:'nowrap',color:'#64748B',fontSize:'.8rem'}}>{t.date.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'2-digit'})}</td>
                  <td style={{fontWeight:600,color:'#0F172A'}}>{t.item}</td>
                  <td style={{fontSize:'.83rem'}}>{t.merchant}</td>
                  <td><span className={`t-cat ${C_CLS[t.cat]||''}`}>{C_EMJ[t.cat]||''} {t.cat}</span></td>
                  <td className={`t-amt ${t.isIn?'in':'out'}`}>{t.isIn?'+':'-'}{fmt(t.amount)}</td>
                  <td style={{fontSize:'.8rem',color:'#64748B'}}>{t.method}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-act btn-edit-act" title="Edit" onClick={() => openEdit(t)}>✏️</button>
                      {t.id && <button className="btn-act btn-del-act" title="Hapus" onClick={() => onDelete(t.id!)}>🗑️</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={7} style={{textAlign:'center',padding:32,color:'#94A3B8',fontSize:'.86rem'}}>Tidak ada transaksi ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* ── Mobile cards ── */}
        <div className="txn-mobile">
          {/* Group by date if viewing "all", or show date header for selected day */}
          {selectedDay !== 'all' && mobDayItems.length > 0 && (
            <div className="txn-day-hdr">
              <span>{getDayLabel(selectedDay)} · {mobDayItems.length} transaksi</span>
              {mobDayTotal > 0 && <span className="txn-day-hdr-amt">−{fmt(mobDayTotal)}</span>}
            </div>
          )}
          {(() => {
            if (mobDayItems.length === 0) return (
              <div style={{textAlign:'center',padding:32,color:'#94A3B8',fontSize:'.86rem'}}>Tidak ada transaksi</div>
            );
            // When showing all: group by date
            if (selectedDay === 'all') {
              let lastDate = '';
              return mobDayItems.map((t, i) => {
                const ds = t.date instanceof Date ? toDateStr(t.date) : '';
                const showHdr = ds !== lastDate;
                if (showHdr) lastDate = ds;
                const dayItems = showHdr && ds
                  ? visible.filter(x => x.date instanceof Date && toDateStr(x.date) === ds)
                  : [];
                const dayOut = dayItems.filter(x => !x.isIn).reduce((s,x) => s+x.amount, 0);
                return (
                  <span key={t.id || i} style={{display:'contents'}}>
                    {showHdr && ds && (
                      <div className="txn-day-hdr">
                        <span>{getDayLabel(ds)} · {dayItems.length} transaksi</span>
                        {dayOut > 0 && <span className="txn-day-hdr-amt">−{fmt(dayOut)}</span>}
                      </div>
                    )}
                    <div className="txn-card">
                      <div className={`txn-card-ico ${C_CLS[t.cat]||''}`}>{C_EMJ[t.cat]||'💸'}</div>
                      <div className="txn-card-info">
                        <div className="txn-card-name">{t.item}</div>
                        <div className="txn-card-meta">{t.merchant} · {t.method}</div>
                      </div>
                      <div className="txn-card-right">
                        <div className={`txn-card-amt ${t.isIn?'in':'out'}`}>{t.isIn?'+':'-'}{fmt(t.amount)}</div>
                        <div className="txn-card-date">{t.date.toLocaleDateString('id-ID',{day:'2-digit',month:'short'})}</div>
                        <div className="action-btns" style={{marginTop:4}}>
                          <button className="btn-act btn-edit-act" title="Edit" onClick={() => openEdit(t)}>✏️</button>
                          {t.id && <button className="btn-act btn-del-act" title="Hapus" onClick={() => onDelete(t.id!)}>🗑️</button>}
                        </div>
                      </div>
                    </div>
                  </span>
                );
              });
            }
            // Single day view
            return mobDayItems.map((t, i) => (
              <div key={t.id || i} className="txn-card">
                <div className={`txn-card-ico ${C_CLS[t.cat]||''}`}>{C_EMJ[t.cat]||'💸'}</div>
                <div className="txn-card-info">
                  <div className="txn-card-name">{t.item}</div>
                  <div className="txn-card-meta">{t.merchant} · {t.method}</div>
                </div>
                <div className="txn-card-right">
                  <div className={`txn-card-amt ${t.isIn?'in':'out'}`}>{t.isIn?'+':'-'}{fmt(t.amount)}</div>
                  <div className="action-btns" style={{marginTop:2}}>
                    <button className="btn-act btn-edit-act" title="Edit" onClick={() => openEdit(t)}>✏️</button>
                    {t.id && <button className="btn-act btn-del-act" title="Hapus" onClick={() => onDelete(t.id!)}>🗑️</button>}
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
        <div className="pag-row">
          <span>Menampilkan {sorted.length===0?0:start+1}–{Math.min(start+PAGE_SIZE,sorted.length)} dari {sorted.length} transaksi</span>
          <div className="pag-btns-wrap">
            <button className="pb" onClick={() => setPg(p => Math.max(1,p-1))} disabled={pg<=1}>‹</button>
            {pages.map((i, idx) => (
              <span key={i} style={{display:'contents'}}>
                {idx > 0 && pages[idx-1] !== i-1 && <span style={{padding:'0 3px',color:'#64748B',lineHeight:'30px'}}>…</span>}
                <button className={`pb${i===pg?' active':''}`} onClick={() => setPg(i)}>{i}</button>
              </span>
            ))}
            <button className="pb" onClick={() => setPg(p => Math.min(total,p+1))} disabled={pg>=total}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PAGE: SETTINGS ─── */
const INCOME_MAP: Record<string,string> = {
  '<3jt':'< Rp3 juta','3-5jt':'Rp3–5 juta','5-10jt':'Rp5–10 juta',
  '10-20jt':'Rp10–20 juta','20-30jt':'Rp20–30 juta','30-50jt':'Rp30–50 juta','>50jt':'Rp50 juta+'
};
const EXPENSE_MAP: Record<string,string> = {
  '<30':'< 30% penghasilan','30-50':'30–50%','50-70':'50–70%','>70':'> 70%'
};
const GOAL_MAP: Record<string,string> = {
  darurat:'🚨 Dana Darurat',rumah:'🏠 Beli Rumah',mobil:'🚗 Beli Kendaraan',
  menikah:'💍 Menikah',pendidikan:'🎓 Pendidikan',liburan:'✈️ Liburan',
  pensiun:'👴 Pensiun',bisnis:'💼 Usaha/Bisnis',gadget:'📱 Gadget',
};

function getAssessment() {
  try { return JSON.parse(localStorage.getItem('mira_assessment') || '{}'); } catch { return {}; }
}

function PageSettings({toast, user, phone}: {toast:(m:string,t?:string)=>void; user: LiveUser|null; phone: string}) {
  const assessment = getAssessment();

  const [banks,       setBanks]       = useState<string[]>([]);
  const [wallets,     setWallets]     = useState<string[]>([]);
  const [pl,          setPl]          = useState<string[]>([]);
  const [ratio,       setRatio]       = useState(65);
  const [limitHarian, setLimitHarian] = useState('150000');
  const [notifs,      setNotifs]      = useState({daily:true,saving:true,excel:true,pl:false});
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [syncStatus,  setSyncStatus]  = useState<'idle'|'saved'|'error'>('idle');

  const parseArr = (v: any): string[] => {
    if (Array.isArray(v)) return v.map((x: any) => String(x).trim()).filter(Boolean);
    if (typeof v === 'string' && v.trim()) {
      // Coba JSON parse dulu (format ["bri","bca"])
      try { const p = JSON.parse(v); if (Array.isArray(p)) return p.map((x: any) => String(x).trim()).filter(Boolean); } catch {}
      // Fallback: format bracket tanpa quotes → [BRI, BCA] atau BRI,BCA
      const stripped = v.trim().replace(/^\[|\]$/g, '');
      if (stripped) return stripped.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  // ── Primary phone: selalu gunakan prop `phone` (= primary_phone dari Supabase)
  // JANGAN baca dari sessionStorage.mira_phone — formatnya bisa beda (tanpa prefix 62)
  // Normalkan nilai dari Supabase → canonical BANK_V/EW_V/PL_V
  // Supabase bisa menyimpan label ("BRI") atau value ("bri") — handle keduanya
  const normalizeVals = (stored: string[], opts: string[], vals: string[]): string[] => {
    const result: string[] = [];
    for (const s of stored) {
      if (vals.includes(s)) { result.push(s); continue; }
      const byVal = vals.find(v => v.toLowerCase() === s.toLowerCase());
      if (byVal) { result.push(byVal); continue; }
      const idx = opts.findIndex(o => o.toLowerCase() === s.toLowerCase());
      if (idx >= 0) result.push(vals[idx]);
    }
    return result;
  };

  const loadSettings = useCallback(async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${SUPA_URL}/rest/v1/users?primary_phone=eq.${phone}&select=*`,
        { headers: { 'apikey': SUPA_ANON, 'Authorization': 'Bearer ' + SUPA_ANON } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: any[] = await res.json();
      const row = Array.isArray(data) && data.length > 0 ? data[0] : null;

      if (row) {
        if (row.banks_used      != null) setBanks(normalizeVals(parseArr(row.banks_used),    BANK_O, BANK_V));
        if (row.ewallets_used   != null) setWallets(normalizeVals(parseArr(row.ewallets_used), EW_O, EW_V));
        if (row.paylater_active != null) setPl(normalizeVals(parseArr(row.paylater_active),   PL_O,  PL_V));
        if (row.expense_allocation_pct != null) setRatio(Number(row.expense_allocation_pct));
        if (row.limit_nominal          != null) setLimitHarian(String(row.limit_nominal));
        setNotifs({
          daily : row.notif_daily    ?? true,
          saving: row.notif_saving   ?? true,
          excel : row.notif_excel    ?? true,
          pl    : row.notif_paylater ?? false,
        });
      } else {
        const b = parseArr(user?.banks)   .length ? parseArr(user?.banks)    : (assessment.q19_bank     || []);
        const w = parseArr(user?.ewallets).length ? parseArr(user?.ewallets) : (assessment.q20_ewallet  || []);
        const p = parseArr(user?.paylater).length ? parseArr(user?.paylater) : (assessment.q21_paylater || []);
        setBanks(normalizeVals(b, BANK_O, BANK_V));
        setWallets(normalizeVals(w.filter((v:string) => v !== 'lainnya'), EW_O, EW_V));
        setPl(normalizeVals(p.filter((v:string) => v !== 'tidak-ada'),    PL_O, PL_V));
        setRatio(typeof assessment.q10_ratio === 'number' ? assessment.q10_ratio : (user?.expense_alloc_pct || 65));
      }
    } catch {
      setBanks(normalizeVals(parseArr(user?.banks),    BANK_O, BANK_V));
      setWallets(normalizeVals(parseArr(user?.ewallets), EW_O, EW_V));
      setPl(normalizeVals(parseArr(user?.paylater),      PL_O, PL_V));
      setRatio(user?.expense_alloc_pct || 65);
      toast('Gagal memuat dari server, menampilkan data lokal', 'red');
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // ── Save ke Supabase ──
  const saveSettings = async () => {
    if (!phone) { toast('Sesi tidak valid, silakan login ulang', 'red'); return; }
    setSaving(true);
    setSyncStatus('idle');
    try {
      const limitNum = parseInt(limitHarian.replace(/\D/g, '')) || 0;

      // Hanya kirim kolom yang PASTI ada di tabel users
      // Jangan include notif_* supaya tidak error kalau kolom belum ada
      // Kolom banks_used/ewallets_used/paylater_active tipe text → kirim sebagai
      // JSON string (bukan array mentah) supaya PostgREST tidak error
      const body: Record<string,any> = {
        banks_used            : JSON.stringify(banks),
        ewallets_used         : JSON.stringify(wallets),
        paylater_active       : JSON.stringify(pl),
        expense_allocation_pct: ratio,
      };
      if (limitNum > 0) body.limit_nominal = limitNum;



      const res = await fetch(`${SUPA_URL}/rest/v1/users?primary_phone=eq.${phone}`, {
        method : 'PATCH',
        headers: {
          'apikey'       : SUPA_ANON,
          'Authorization': 'Bearer ' + SUPA_ANON,
          'Content-Type' : 'application/json',
          'Prefer'       : 'return=minimal',
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSyncStatus('saved');
        toast('Pengaturan berhasil disimpan ✓', 'green');
        // Update sessionStorage cache
        try {
          const raw = sessionStorage.getItem('mira_user');
          if (raw) {
            const u = JSON.parse(raw);
            Object.assign(u, { banks_used: banks, ewallets_used: wallets, paylater_active: pl, expense_allocation_pct: ratio });
            sessionStorage.setItem('mira_user', JSON.stringify(u));
          }
        } catch {}
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        const errTxt = await res.text().catch(() => '');
        setSyncStatus('error');
        toast(`Gagal simpan (HTTP ${res.status}): ${errTxt.slice(0, 80)}`, 'red');
      }
    } catch {
      setSyncStatus('error');
      toast('Tidak dapat terhubung ke server', 'red');
    }
    setSaving(false);
  };
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const sv = 100 - ratio;
  const hint = ratio<=40?'🏆 Luar biasa! Tabunganmu sangat tinggi':ratio<=55?'✅ Proporsi tabungan sehat':ratio<=70?'🟡 Coba naikkan tabungan':ratio<=85?'🟠 Tabungan terlalu kecil':'🔴 Hampir semua habis untuk pengeluaran';
  const fromX = useCallback((x: number) => {
    if (!trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    setRatio(Math.max(10, Math.min(90, Math.round(((x-r.left)/r.width)*100))));
  }, []);
  useEffect(() => {
    const mv = (e: MouseEvent) => {if (drag.current) fromX(e.clientX);};
    const tm = (e: TouchEvent) => {if (drag.current) fromX(e.touches[0].clientX);};
    const up = () => {drag.current = false;};
    document.addEventListener('mousemove', mv);
    document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', tm, {passive:true});
    document.addEventListener('touchend', up);
    return () => {
      document.removeEventListener('mousemove', mv);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('touchmove', tm);
      document.removeEventListener('touchend', up);
    };
  }, [fromX]);
  const tog = (arr: string[], set: (a:string[])=>void, v: string) => set(arr.includes(v) ? arr.filter(x=>x!==v) : [...arr,v]);

  return (
    <div className="page" style={{padding:'0 0 24px'}}>

      {/* ── Status bar ── */}
      {loading && (
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:11,marginBottom:14,fontSize:'.84rem',color:'#1E40AF'}}>
          <span style={{animation:'dbSpin 1s linear infinite',display:'inline-block'}}>⏳</span>
          Memuat data pengaturan dari Supabase…
        </div>
      )}
      {syncStatus==='saved' && (
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:11,marginBottom:12,fontSize:'.84rem',color:'#16A34A'}}>
          ✅ Pengaturan berhasil disimpan ke Supabase
        </div>
      )}
      {syncStatus==='error' && (
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,padding:'11px 16px',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:11,marginBottom:12,fontSize:'.84rem',color:'#DC2626',flexWrap:'wrap'}}>
          <span>❌ Gagal menyimpan pengaturan</span>
          <button onClick={saveSettings} style={{background:'#DC2626',color:'#fff',border:'none',borderRadius:7,padding:'5px 12px',fontSize:'.78rem',cursor:'pointer',fontWeight:700,flexShrink:0,whiteSpace:'nowrap'}}>Coba lagi</button>
        </div>
      )}

      <div className="row">
        <div className="card" style={{flex:1,minWidth:0}}>
          {/* ── Info dari asesmen ── */}
          {assessment.q1 && (
            <div style={{background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:11,padding:'12px 14px',marginBottom:18}}>
              <div style={{fontSize:'.71rem',fontWeight:700,color:'#16A34A',marginBottom:7,letterSpacing:.5}}>✅ DATA DARI ASESMEN KEUANGANMU</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 12px',fontSize:'.82rem',color:'#334155'}}>
                {assessment.q1 && <div>💵 Penghasilan: <strong>{INCOME_MAP[assessment.q1]||assessment.q1}</strong></div>}
                {assessment.q4 && <div>💸 Beban wajib: <strong>{EXPENSE_MAP[assessment.q4]||assessment.q4}</strong></div>}
                {assessment.q2 && <div>📅 Tipe: <strong>{{tetap:'Tetap',freelance:'Freelance',campuran:'Campuran'}[assessment.q2]||assessment.q2}</strong></div>}
                {assessment.q9 && <div>🏦 Nabung: <strong>{{otomatis:'Otomatis',tidak_konsisten:'Tdk konsisten',jarang:'Jarang',tidak:'Belum'}[assessment.q9]||assessment.q9}</strong></div>}
              </div>
              {assessment.q11 && assessment.q11.filter((v:string)=>v!=='tidak-ada').length > 0 && (
                <div style={{marginTop:8,fontSize:'.78rem',color:'#64748B'}}>
                  🎯 Tujuan: {assessment.q11.filter((v:string)=>v!=='tidak-ada').map((v:string)=>GOAL_MAP[v]||v).join(' · ')}
                </div>
              )}
            </div>
          )}
          <div className="set-section">
            <div className="set-section-ttl">⚖️ Rasio Tabungan vs Pengeluaran</div>
            <div className="ratio-wrap">
              <div className="ratio-vals">
                <div className="ratio-val-item"><div className="rv-num" style={{color:'#EF4444'}}>{ratio}%</div><div className="rv-lbl" style={{color:'#EF4444'}}>🔴 Pengeluaran</div></div>
                <div className="ratio-val-item" style={{textAlign:'right'}}><div className="rv-num" style={{color:'#16A34A'}}>{sv}%</div><div className="rv-lbl" style={{color:'#16A34A'}}>🟢 Tabungan</div></div>
              </div>
              <div ref={trackRef} className="ratio-track"
                onMouseDown={e => {drag.current=true; fromX(e.clientX);}}
                onTouchStart={e => {drag.current=true; fromX(e.touches[0].clientX);}}>
                <div className="rf-l" style={{width:ratio+'%'}}/>
                <div className="rf-r" style={{width:sv+'%'}}/>
                <div className="r-handle" style={{left:ratio+'%'}} onMouseDown={e => {e.stopPropagation(); drag.current=true;}}/>
              </div>
              <div className="ratio-hint-txt">{hint}</div>
            </div>
          </div>
          {[
            {ttl:'🏦 Bank Aktif',opts:BANK_O,vals:BANK_V,state:banks,set:setBanks},
            {ttl:'📱 E-Wallet Aktif',opts:EW_O,vals:EW_V,state:wallets,set:setWallets},
            {ttl:'💳 PayLater / Kartu Kredit',opts:PL_O,vals:PL_V,state:pl,set:setPl},
          ].map(g => (
            <div key={g.ttl} className="set-section">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,paddingBottom:7,borderBottom:'1px solid #E2E8F0'}}>
                <div className="set-section-ttl" style={{marginBottom:0,paddingBottom:0,border:'none'}}>{g.ttl}</div>
                <span style={{fontSize:'.74rem',fontWeight:700,color:g.state.length>0?'#2D4BFF':'#94A3B8',background:g.state.length>0?'#E9EDFF':'#F1F5F9',borderRadius:99,padding:'2px 9px'}}>
                  {g.state.length} aktif
                </span>
              </div>
              <div className="chip-grp">
                {g.opts.map((l, i) => (
                  <div
                    key={i}
                    className={`chip${g.state.includes(g.vals[i])?' on':''}`}
                    onClick={() => tog(g.state, g.set, g.vals[i])}
                    style={{cursor:'pointer'}}
                  >{l}</div>
                ))}
              </div>
              {g.state.length > 0 && (
                <div style={{marginTop:8,fontSize:'.75rem',color:'#64748B'}}>
                  Aktif: {g.state.map(v => g.opts[g.vals.indexOf(v)] || v).join(' · ')}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="card" style={{flex:1,minWidth:0}}>
          <div className="set-section">
            <div className="set-section-ttl">🔔 Notifikasi & Alert</div>
            {([
              {k:'daily' as const,lbl:'Spending Alert Harian',desc:'Notifikasi saat mendekati batas harian'},
              {k:'saving' as const,lbl:'Saving Nudge Bulanan',desc:'Pengingat menyisihkan tabungan tiap gajian'},
              {k:'excel' as const,lbl:'Laporan Excel Otomatis',desc:'Kirim laporan bulanan tiap tanggal 1'},
              {k:'pl' as const,lbl:'PayLater Monitor',desc:'Alert saat penggunaan PayLater meningkat'},
            ]).map(n => (
              <div key={n.k} className="set-row">
                <div><div className="set-lbl">{n.lbl}</div><div className="set-desc">{n.desc}</div></div>
                <label className="toggle"><input type="checkbox" checked={notifs[n.k]} onChange={() => setNotifs(p => ({...p,[n.k]:!p[n.k]}))}/><span className="tog-sl"/></label>
              </div>
            ))}
          </div>
          <div className="set-section">
            <div className="set-section-ttl">🎯 Batas Pengeluaran Harian</div>
            <div className="set-row">
              <div><div className="set-lbl">Batas Harian</div><div className="set-desc">Notifikasi saat melewati batas ini</div></div>
              <input
                type="text"
                value={'Rp' + Number(limitHarian || 0).toLocaleString('id-ID')}
                onChange={e => setLimitHarian(e.target.value.replace(/\D/g,''))}
                style={{width:120,padding:'7px 10px',border:'1.5px solid #E2E8F0',borderRadius:8,fontSize:'.86rem',textAlign:'right',fontFamily:"'Sora',sans-serif",fontWeight:700,outline:'none',color:'#0F172A'}}
              />
            </div>
          </div>
          <div style={{display:'flex',gap:9,marginTop:16}}>
            <button
              className="btn"
              style={{flex:1, opacity:(saving||loading)?0.65:1}}
              onClick={saveSettings}
              disabled={saving||loading}
            >
              {saving ? '⏳ Menyimpan...' : '💾 Simpan Semua Pengaturan'}
            </button>
            <button
              onClick={loadSettings}
              disabled={loading}
              title="Muat ulang dari Supabase"
              style={{padding:'0 16px',border:'1.5px solid #E2E8F0',borderRadius:100,background:'#fff',cursor:'pointer',fontSize:'1rem',flexShrink:0,opacity:loading?0.5:1,transition:'all .15s'}}
            >
              🔄
            </button>
          </div>
          {phone && (
            <div style={{marginTop:8,fontSize:'.72rem',color:'#94A3B8',textAlign:'center'}}>
              Akun: <strong style={{color:'#64748B'}}>+{phone}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── PAGE: AFFILIATE ─── */
interface AffRef {
  id?: string;
  created_at: string;
  referee_name?: string;
  plan_name?: string;
  transaction_value?: number;
  commission_amount?: number;
  status: string;
}

function PageAffiliate({toast, user, phone}: {toast:(m:string,t?:string)=>void; user: LiveUser|null; phone: string}) {
  const [affCode, setAffCode] = useState(user?.affCode || '');
  const [refs, setRefs]       = useState<AffRef[]>([]);
  const [affLoading, setAffLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  const loadAffData = useCallback(async () => {
    // Root cause fix: strip tanda '+' di depan agar cocok dengan Supabase
    // Di DB: referrer_phone = "6281210503345" (tanpa +)
    // Di session: phone = "+6281210503345" (dengan +)
    const cleanPhone = (phone || '').replace(/^\+/, '');

    console.log('[Affiliate] affiliate page opened, fetching...');
    console.log('[Affiliate] querying with phone:', cleanPhone);

    setAffLoading(true);
    try {
      // 1. Ambil/generate affiliate_code dari users
      let code = user?.affCode || '';
      if (!code || code === 'MIRA0000') {
        const uRes = await supaReq(`/rest/v1/users?primary_phone=eq.${cleanPhone}&select=affiliate_code`);
        if (uRes.ok) {
          const uData = await uRes.json();
          code = uData?.[0]?.affiliate_code || '';
        }
        if (!code) {
          code = ('MIRA' + cleanPhone.slice(-4)).toUpperCase();
          await supaReq(`/rest/v1/users?primary_phone=eq.${cleanPhone}`, 'PATCH', { affiliate_code: code });
        }
      }
      setAffCode(code);

      // 2. Fetch riwayat referral — pakai cleanPhone (tanpa +) agar match Supabase
      const rRes = await supaReq(
        `/rest/v1/affiliate_referrals?referrer_phone=eq.${cleanPhone}&order=created_at.desc`
      );
      console.log('[Affiliate] response status:', rRes.status, rRes.ok);
      if (rRes.ok) {
        const data = await rRes.json();
        console.log('[Affiliate] result:', data);
        setRefs(Array.isArray(data) ? data : []);
      } else {
        const errBody = await rRes.text().catch(() => '');
        console.error('[Affiliate] fetch error:', rRes.status, errBody);
      }
    } catch (err) {
      console.error('[Affiliate] exception:', err);
    }
    setAffLoading(false);
  }, [phone, user?.affCode]);

  useEffect(() => { loadAffData(); }, [loadAffData]);

  const totalReferral = refs.length;
  const totalKomisi   = refs.reduce((s, r) => s + Number(r.commission_amount || 0), 0);
  const belumCair     = refs
    .filter(r => r.status === 'pending')
    .reduce((s, r) => s + Number(r.commission_amount || 0), 0);

  const withdrawAff = async () => {
    // Fetch pending referrals dulu untuk dapat IDs dan total terkini
    let pendingData: AffRef[] = [];
    try {
      const cleanPhone = (phone || '').replace(/^\+/, '');
      const r = await supaReq(`/rest/v1/affiliate_referrals?referrer_phone=eq.${cleanPhone}&status=eq.pending&select=id,commission_amount`);
      if (r.ok) pendingData = await r.json();
    } catch {}

    const total = pendingData.reduce((s, r) => s + (r.commission_amount || 0), 0);

    if (total < 50000) {
      toast(`Minimal pencairan Rp50.000. Saat ini: ${fmt(total)}`, 'red');
      return;
    }

    if (!window.confirm(`Cairkan ${fmt(total)}?`)) return;

    setWithdrawing(true);
    try {
      const ids = pendingData.map(r => r.id).filter(Boolean);
      // Update by IDs spesifik
      const res = await fetch(
        `${SUPA_URL}/rest/v1/affiliate_referrals?id=in.(${ids.join(',')})`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPA_ANON,
            'Authorization': 'Bearer ' + SUPA_ANON,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ status: 'withdrawal_requested' }),
        }
      );
      if (res.ok) {
        toast(`Pencairan ${fmt(total)} sedang diproses 💸`, 'green');
        loadAffData();
      } else {
        toast('Gagal memproses pencairan', 'red');
      }
    } catch {
      toast('Gagal terhubung ke server', 'red');
    }
    setWithdrawing(false);
  };

  return (
    <div className="page">
      <div className="aff-hero">
        <div>
          <h2>🤝 Program Affiliate MIRA</h2>
          <p>Bagikan kode unikmu dan dapatkan komisi 10% setiap kali temanmu berlangganan. Temanmu juga otomatis hemat 10%!</p>
          <div className="aff-stats">
            <div>
              <div className="aff-sn">{affLoading ? '…' : totalReferral}</div>
              <div className="aff-sl">Referral</div>
            </div>
            <div>
              <div className="aff-sn">{affLoading ? '…' : fmt(totalKomisi)}</div>
              <div className="aff-sl">Total Komisi</div>
            </div>
            <div>
              <div className="aff-sn">{affLoading ? '…' : fmt(belumCair)}</div>
              <div className="aff-sl">Belum Dicairkan</div>
            </div>
          </div>
        </div>
        <button
          className="btn btn-white btn-sm"
          onClick={withdrawAff}
          disabled={withdrawing || belumCair < 50000}
          style={{opacity: belumCair < 50000 ? 0.5 : 1}}
        >
          {withdrawing ? '⏳ Memproses...' : `💸 Cairkan ${fmt(belumCair)}`}
        </button>
      </div>

      <div className="aff-code-box">
        <div className="aff-code-lbl">Kode Affiliate Unikmu</div>
        <div className="aff-code-val">{affLoading ? '…' : (affCode || 'MIRA' + phone.slice(-4))}</div>
        <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
          <button className="btn btn-outline btn-sm" onClick={() => { const c = affCode || 'MIRA'+phone.slice(-4); navigator.clipboard?.writeText(c).catch(()=>{}); toast('Kode disalin: '+c+' 📋','green'); }}>📋 Salin Kode</button>
          <button className="btn btn-sm" onClick={() => { const c = affCode || 'MIRA'+phone.slice(-4); const link = 'https://getmira.id/?ref='+c; navigator.clipboard?.writeText(link).catch(()=>{}); toast('Link disalin: '+link+' 📤'); }}>📤 Bagikan Link</button>
        </div>
      </div>

      <div className="aff-steps-grid">
        {[
          {n:1,h:'Bagikan Kode',p:'Share kode atau link unikmu ke teman & followers'},
          {n:2,h:'Teman Daftar',p:'Temanmu hemat 10% saat pakai kodemu untuk berlangganan'},
          {n:3,h:'Dapat Komisi',p:'Kamu otomatis dapat komisi 10% dari nilai transaksi mereka'},
          {n:4,h:'Cairkan Kapanpun',p:'Min. Rp50.000 — ke rekening atau e-wallet pilihanmu'},
        ].map(s => (
          <div key={s.n} className="aff-step">
            <div className="aff-step-num">{s.n}</div>
            <h4>{s.h}</h4><p>{s.p}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-ttl">📜 Riwayat Referral</div>
        <div style={{overflowX:'auto',marginTop:8}}>
          <table className="txn-table">
            <thead>
              <tr><th>Tanggal</th><th>Pengguna</th><th>Paket</th><th>Nilai</th><th>Komisi (10%)</th><th>Status</th></tr>
            </thead>
            <tbody>
              {affLoading ? (
                <tr><td colSpan={6} style={{textAlign:'center',padding:24,color:'#94A3B8'}}>Memuat data...</td></tr>
              ) : refs.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center',padding:24,color:'#94A3B8'}}>Belum ada referral</td></tr>
              ) : refs.map((r, i) => (
                <tr key={i}>
                  <td style={{color:'#64748B',fontSize:'.8rem'}}>{new Date(r.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</td>
                  <td style={{fontWeight:600}}>{r.referee_name || 'User***'}</td>
                  <td style={{fontSize:'.82rem'}}>{r.plan_name || '-'}</td>
                  <td style={{fontWeight:600}}>{fmt(Number(r.transaction_value || 0))}</td>
                  <td style={{color:'#16A34A',fontWeight:700}}>{fmt(Number(r.commission_amount || 0))}</td>
                  <td>
                    {r.status === 'settled' ? (
                      <span className="ref-chip" style={{background:'#DCFCE7',color:'#16A34A'}}>✅ Lunas</span>
                    ) : r.status === 'pending' ? (
                      <span className="ref-chip" style={{background:'#FEF3C7',color:'#F59E0B'}}>⏳ Menunggu</span>
                    ) : r.status === 'withdrawal_requested' ? (
                      <span className="ref-chip" style={{background:'#EFF6FF',color:'#1D4ED8'}}>🏦 Proses Cairkan</span>
                    ) : (
                      <span className="ref-chip" style={{background:'#F1F5F9',color:'#64748B'}}>{r.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── PAGE: PROFILE ─── */
function PageProfile({toast, phone, user, onUpdate, onDelAccount, onLogout}: {
  toast:(m:string,t?:string)=>void;
  phone: string;
  user: LiveUser|null;
  onUpdate: (u: Partial<LiveUser>) => void;
  onDelAccount: () => Promise<void>;
  onLogout: () => void;
}) {
  const [name, setName]   = useState(user?.name || '');
  const [email, setEmail] = useState('');
  const [dob, setDob]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveProfile = async () => {
    if (!name.trim()) { toast('Nama tidak boleh kosong', 'red'); return; }
    setSaving(true);
    try {
      const res = await supaReq(
        `/rest/v1/users?primary_phone=eq.${phone}`,
        'PATCH',
        { name: name.trim(), updated_at: new Date().toISOString() }
      );
      if (res.ok) {
        onUpdate({ name: name.trim(), avatar: name.trim()[0].toUpperCase() });
        toast('Profil berhasil disimpan ✓', 'green');
      } else {
        toast('Gagal menyimpan profil', 'red');
      }
    } catch {
      toast('Gagal terhubung ke server', 'red');
    }
    setSaving(false);
  };

  const delAllTxns = async () => {
    if (!confirm('Hapus SEMUA transaksi? Tindakan ini tidak dapat dibatalkan.')) return;
    setDeleting(true);
    try {
      const res = await supaReq(`/rest/v1/expenses?phone_number=eq.${phone}`, 'DELETE');
      if (res.ok) {
        toast('Semua transaksi dihapus', 'red');
      } else {
        toast('Gagal menghapus transaksi', 'red');
      }
    } catch {
      toast('Gagal terhubung ke server', 'red');
    }
    setDeleting(false);
  };

  return (
    <div className="page">
      <div className="prof-header">
        <div className="prof-avatar" onClick={() => toast('Fitur ganti foto segera hadir 📸')}>{name[0]?.toUpperCase()||'?'}</div>
        <div>
          <div style={{fontSize:'1.05rem',fontWeight:700,color:'#0F172A',fontFamily:"'Sora',sans-serif"}}>{name}</div>
          <div className="prof-plan-badge">⭐ {user?.plan_name || 'Personal'}</div>
          <div style={{fontSize:'.77rem',color:'#64748B',marginTop:4}}>Aktif hingga {user?.expiry || '-'}</div>
        </div>
        <div style={{marginLeft:'auto',textAlign:'right'}}>
          {user?.score_total ? (
            <>
              <div style={{fontSize:'.76rem',color:'#64748B'}}>Skor Finansial</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:'1.3rem',fontWeight:800,color:'#2D4BFF',marginTop:2}}>
                {user.score_total}<span style={{fontSize:'.72rem',color:'#94A3B8',fontWeight:400}}>/100</span>
              </div>
            </>
          ) : (
            <>
              <div style={{fontSize:'.76rem',color:'#64748B'}}>Status WA</div>
              <div style={{fontSize:'.86rem',fontWeight:700,color:'#16A34A',marginTop:3}}>● Terhubung</div>
            </>
          )}
        </div>
      </div>
      <div className="row">
        <div className="card" style={{flex:1,minWidth:0}}>
          <div className="card-ttl">👤 Data Pribadi</div>
          <div className="fg"><label>Nama Lengkap</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nama lengkap kamu"/></div>
          <div className="fg"><label>Nomor WhatsApp</label><input type="tel" value={'+'+phone} disabled/><div className="hint">Nomor WA tidak bisa diubah. Hubungi support untuk perubahan.</div></div>
          <div className="fg"><label>Email (opsional)</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@kamu.com"/></div>
          <div className="fg"><label>Tanggal Lahir (opsional)</label><input type="date" value={dob} onChange={e => setDob(e.target.value)}/></div>
          <button className="btn" style={{opacity:saving?0.6:1}} onClick={saveProfile} disabled={saving}>
            {saving ? '⏳ Menyimpan...' : '💾 Simpan Profil'}
          </button>
        </div>
        <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:14}}>
          <div className="card">
            <div className="card-ttl">📦 Info Langganan</div>
            <div className="set-row"><div className="set-lbl">Paket</div><span style={{fontWeight:700,color:'#2D4BFF'}}>{user?.plan_name || 'Personal'}</span></div>
            <div className="set-row"><div className="set-lbl">Masa Aktif</div><span style={{fontWeight:700,color:'#0F172A'}}>{user?.expiry || '-'}</span></div>
            {/* BAGIAN 5: Sembunyikan billing jika user adalah additional user (registered_by terisi) */}
            {user?.registered_by ? (
              <div style={{marginTop:12,fontSize:'.82rem',color:'#64748B',background:'#F8FAFC',border:'1px solid #E2E8F0',borderRadius:10,padding:'10px 14px'}}>
                🔒 Plan kamu dikelola oleh pendaftar utama.
              </div>
            ) : (
              <>
                <div className="set-row"><div><div className="set-lbl">Auto-renew</div></div><label className="toggle"><input type="checkbox" defaultChecked/><span className="tog-sl"/></label></div>
                <button className="btn btn-outline" style={{marginTop:12}} onClick={() => toast('Hubungi kami via WA untuk upgrade paket 📱')}>⬆️ Upgrade Paket</button>
              </>
            )}
          </div>
          {/* Logout button — terlihat jelas di mobile */}
          <button
            className="btn btn-ghost"
            style={{width:'100%',justifyContent:'center',gap:8}}
            onClick={onLogout}
          >
            ⎋ Keluar / Logout
          </button>
          <div className="danger-zone">
            <h3>⚠️ Zona Berbahaya</h3>
            <p>Tindakan berikut bersifat permanen dan tidak dapat dibatalkan.</p>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <button
                className="btn btn-danger btn-sm"
                style={{width:'100%',justifyContent:'center',opacity:deleting?0.6:1}}
                onClick={delAllTxns}
                disabled={deleting}
              >
                {deleting ? '⏳ Menghapus...' : '🗑️ Hapus Semua Transaksi'}
              </button>
              <button
                className="btn btn-danger btn-sm"
                style={{width:'100%',justifyContent:'center'}}
                onClick={onDelAccount}
              >
                ❌ Hapus Akun
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN EXPORT ─── */
/* ─── ASET & GOALS TYPES ─── */
type AsetCat = 'cash'|'piutang'|'investasi'|'bergerak'|'property';
interface AsetItem { id?: string; name: string; subtype: string; value: number; date: string; }
type AsetData = Record<AsetCat, AsetItem[]>;
interface GoalItem { id?: string; name: string; cat: string; icon: string; color: string; target: number; achieved: number; deadline: string; monthly: number; sources: {name:string;value:number;dot:string}[]; }
interface NWPoint { m: string; nw: number; }

const CAT_CONF: Record<AsetCat,{icon:string;label:string;color:string;bg:string}> = {
  cash:      {icon:'💰',label:'Uang & Setara Uang',        color:'#2D4BFF',bg:'#E9EDFF'},
  piutang:   {icon:'🧾',label:'Piutang',                   color:'#F59E0B',bg:'#FEF3C7'},
  investasi: {icon:'📈',label:'Surat Berharga / Investasi', color:'#16A34A',bg:'#DCFCE7'},
  bergerak:  {icon:'🚗',label:'Aset Bergerak',              color:'#7C3AED',bg:'#EDE9FE'},
  property:  {icon:'🏠',label:'Aset Tidak Bergerak',        color:'#DC2626',bg:'#FEE2E2'},
};
const ASET_CATS: AsetCat[] = ['cash','piutang','investasi','bergerak','property'];
const ASET_SUBTYPES: Record<AsetCat,string[]> = {
  cash:      ['Tabungan Bank','Deposito','Kas Tunai','E-Wallet','Dana Darurat'],
  piutang:   ['Piutang Dagang','Piutang Pribadi','Cicilan Diterima'],
  investasi: ['Saham','Reksa Dana','Obligasi / SBN','Emas','Crypto'],
  bergerak:  ['Mobil','Motor','Elektronik','Lainnya'],
  property:  ['Rumah','Apartemen','Tanah','Ruko'],
};
const GOAL_COLORS = ['gc-blue','gc-green','gc-yellow','gc-purple','gc-red','gc-cyan','gc-pink'];
const GC_HEX: Record<string,string> = {'gc-blue':'#2D4BFF','gc-green':'#16A34A','gc-yellow':'#F59E0B','gc-purple':'#7C3AED','gc-red':'#DC2626','gc-cyan':'#0891B2','gc-pink':'#EC4899'};

/* ─── PAGE: ASET & NET WORTH ─── */
function PageAset({phone, toast}: {phone:string; toast:(m:string,t?:string)=>void}) {
  const emptyData: AsetData = {cash:[],piutang:[],investasi:[],bergerak:[],property:[]};
  const [data, setData]         = useState<AsetData>(emptyData);
  const [utang, setUtang]       = useState(0);
  const [history, setHistory]   = useState<NWPoint[]>([]);
  const [openCats, setOpenCats] = useState<Set<AsetCat>>(new Set(['cash'] as AsetCat[]));
  const [showModal, setShowModal]   = useState(false);
  const [editState, setEditState]   = useState<{key:AsetCat;idx:number}|null>(null);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [mCat, setMCat]   = useState<AsetCat>('cash');
  const [mSub, setMSub]   = useState(ASET_SUBTYPES.cash[0]);
  const [mName, setMName] = useState('');
  const [mVal, setMVal]   = useState('');
  const [mDate, setMDate] = useState(new Date().toISOString().split('T')[0]);
  const [editVals, setEditVals] = useState<Record<string,string>>({});
  /* ── Click-through guard: prevents synthetic mobile click (~300ms) from closing modal ── */
  const asetModalOpenedAt = useRef(0);

  const load = useCallback(async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const [aRes, lRes, hRes] = await Promise.all([
        supaReq(`/rest/v1/user_assets?phone_number=eq.${phone}&order=created_at.desc&select=*`),
        supaReq(`/rest/v1/user_liabilities?phone_number=eq.${phone}&select=amount`),
        supaReq(`/rest/v1/user_nw_history?phone_number=eq.${phone}&order=snapshot_date.asc&limit=6&select=month_label,net_worth`),
      ]);
      const [assets, liabs, hist] = await Promise.all([aRes.json(), lRes.json(), hRes.json()]);
      const nd: AsetData = {cash:[],piutang:[],investasi:[],bergerak:[],property:[]};
      if (Array.isArray(assets)) {
        assets.forEach((r: any) => {
          const c = r.category as AsetCat;
          if (nd[c]) nd[c].push({id:r.id, name:r.name, subtype:r.subtype, value:Number(r.value), date:r.updated_date||new Date().toISOString().split('T')[0]});
        });
      }
      setData(nd);
      setUtang(Array.isArray(liabs) ? liabs.reduce((s:number,l:any)=>s+Number(l.amount||0),0) : 0);
      setHistory(Array.isArray(hist) ? hist.map((r:any)=>({m:r.month_label,nw:Number(r.net_worth)})) : []);
    } catch {}
    setLoading(false);
  }, [phone]);

  useEffect(() => { load(); }, [load]);

  const totalAset = ASET_CATS.reduce((s,k)=>s+data[k].reduce((ss,i)=>ss+i.value,0),0);
  const netWorth  = totalAset - utang;
  const likuid    = data.cash.reduce((s,i)=>s+i.value,0);
  const nwMax     = history.length ? Math.max(...history.map(h=>Math.abs(h.nw)),1) : 1;

  const toggleCat = (k: AsetCat) => setOpenCats(prev => { const n=new Set(prev); n.has(k)?n.delete(k):n.add(k); return n; });

  const openAddModal = (cat: AsetCat) => {
    asetModalOpenedAt.current = Date.now();
    setMCat(cat); setMSub(ASET_SUBTYPES[cat][0]); setMName(''); setMVal('');
    setMDate(new Date().toISOString().split('T')[0]); setShowModal(true);
  };
  const closeAsetModal = () => { setShowModal(false); };
  const tryCloseAsetOverlay = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && Date.now() - asetModalOpenedAt.current > 400) closeAsetModal();
  };

  const saveAset = async () => {
    setSaving(true);
    try {
      const res = await supaReq('/rest/v1/user_assets','POST',{
        phone_number:phone, category:mCat, subtype:mSub,
        name:mName||mSub, value:parseFloat(mVal)||0, updated_date:mDate,
      });
      const result = await res.json();
      const created = Array.isArray(result)?result[0]:result;
      if (!created?.id){toast('Gagal menyimpan aset','red');setSaving(false);return;}
      setData(prev=>({...prev,[mCat]:[...prev[mCat],{id:created.id,name:mName||mSub,subtype:mSub,value:parseFloat(mVal)||0,date:mDate}]}));
      setShowModal(false); toast('Aset berhasil ditambahkan ✓','green');
    } catch { toast('Gagal menyimpan aset','red'); }
    setSaving(false);
  };

  const startEdit = (key:AsetCat, idx:number) => {
    const it = data[key][idx];
    const k  = `${key}_${idx}`;
    setEditVals({[`n_${k}`]:it.name,[`v_${k}`]:String(it.value),[`s_${k}`]:it.subtype,[`d_${k}`]:it.date});
    setEditState({key,idx});
  };

  const saveEdit = async (key:AsetCat, idx:number) => {
    const it  = data[key][idx];
    const k   = `${key}_${idx}`;
    const name    = editVals[`n_${k}`]?.trim()||it.name;
    const value   = parseFloat(editVals[`v_${k}`])||0;
    const subtype = editVals[`s_${k}`]||it.subtype;
    const date    = editVals[`d_${k}`]||it.date;
    if (!name){toast('Nama tidak boleh kosong','red');return;}
    if (it.id) {
      const res = await supaReq(`/rest/v1/user_assets?id=eq.${it.id}`,'PATCH',{name,value,subtype,updated_date:date});
      if (!res.ok){toast('Gagal update aset','red');return;}
    }
    setData(prev=>{const arr=[...prev[key]];arr[idx]={...it,name,value,subtype,date};return{...prev,[key]:arr};});
    setEditState(null); toast('Aset berhasil diperbarui ✓','green');
  };

  const deleteAset = async (key:AsetCat, idx:number) => {
    const it = data[key][idx];
    if (!confirm(`Hapus "${it.name}" (${fmt(it.value)})?`)) return;
    if (it.id){
      const res = await supaReq(`/rest/v1/user_assets?id=eq.${it.id}`,'DELETE');
      if (!res.ok){toast('Gagal hapus aset','red');return;}
    }
    setData(prev=>{const arr=[...prev[key]];arr.splice(idx,1);return{...prev,[key]:arr};});
    toast('Aset dihapus','');
  };

  const pieData = ASET_CATS.map(k=>({name:CAT_CONF[k].label,value:data[k].reduce((s,i)=>s+i.value,0),color:CAT_CONF[k].color})).filter(d=>d.value>0);

  return (
    <div className="pg-main">
      {/* FAB mobile — onPointerDown + preventDefault prevents 300ms synthetic click */}
      <button className="mob-add-fab" onPointerDown={e => { e.preventDefault(); openAddModal('cash'); }} title="Tambah Aset">＋</button>
      {loading && <div style={{textAlign:'center',padding:'40px 0',color:'#64748B'}}>⏳ Memuat data aset...</div>}

      {/* NW Hero */}
      <div className="nw-hero">
        <div className="nw-lbl">Total Kekayaan Bersih (Net Worth)</div>
        <div className="nw-val">{fmt(netWorth)}</div>
        <div className="nw-trend">💎 {history.length} bulan data tersedia</div>
        <div className="nw-meta">
          <div className="nw-meta-item"><div className="nwml">Total Aset</div><div className="nwmv">{fmt(totalAset)}</div></div>
          <div className="nw-meta-item"><div className="nwml">Total Utang</div><div className="nwmv" style={{color:'#FCA5A5'}}>{fmt(utang)}</div></div>
          <div className="nw-meta-item"><div className="nwml">Dana Likuid</div><div className="nwmv">{fmt(likuid)}</div></div>
        </div>
      </div>

      {/* Charts row */}
      <div className="row" style={{marginBottom:18}}>
        <div className="chart-c" style={{flex:1,minWidth:220}}>
          <div className="chart-h"><h3>📊 Tren Net Worth MoM</h3></div>
          {history.length===0
            ? <div style={{textAlign:'center',color:'#64748B',fontSize:'.83rem',padding:'24px 0'}}>Belum ada data historis net worth</div>
            : history.map((h,i)=>(
              <div key={i} className="trend-row">
                <div className="trend-mo">{h.m}</div>
                <div className="trend-bar-wrap">
                  <div className="trend-bar-fill" style={{width:`${Math.round(Math.abs(h.nw)/nwMax*100)}%`,background:'linear-gradient(90deg,#2D4BFF,#22D3EE)'}}/>
                </div>
                <div className="trend-rpval">{fmt(Math.round(h.nw/1e6))}M</div>
              </div>
            ))
          }
        </div>
        <div className="chart-c" style={{flex:1,minWidth:200}}>
          <div className="chart-h"><h3>🍕 Alokasi Aset</h3></div>
          {pieData.length===0
            ? <div style={{textAlign:'center',color:'#64748B',fontSize:'.83rem',padding:'24px 0'}}>Tambahkan aset untuk melihat alokasi</div>
            : <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((_,i)=><Cell key={i} fill={pieData[i].color}/>)}
                  </Pie>
                  <Tooltip formatter={(v:any)=>fmt(v)}/>
                  <Legend formatter={(v:any)=><span style={{fontSize:'.73rem'}}>{v}</span>}/>
                </PieChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* Category list header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <div style={{fontFamily:"'Sora',sans-serif",fontSize:'.95rem',fontWeight:700,color:'#0F172A'}}>📂 Kategori Aset</div>
        <button className="btn btn-sm" onPointerDown={e => { e.preventDefault(); openAddModal('cash'); }}>＋ Tambah Aset</button>
      </div>

      {/* Accordion */}
      {ASET_CATS.map(key=>{
        const cfg   = CAT_CONF[key];
        const items = data[key];
        const total = items.reduce((s,i)=>s+i.value,0);
        const pct   = totalAset>0?Math.round(total/totalAset*100):0;
        const isOpen= openCats.has(key);
        return (
          <div key={key} className="cat-card">
            <div className="cat-hdr" onClick={()=>toggleCat(key)}>
              <div style={{display:'flex',alignItems:'center',gap:12,flex:1,minWidth:0}}>
                <div className="cat-icon-box" style={{background:cfg.bg}}>{cfg.icon}</div>
                <div><div className="cat-name">{cfg.label}</div><div className="cat-sub">{items.length} item</div></div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div className="cat-total" style={{color:cfg.color}}>{fmt(total)}</div>
                <div className="cat-pct">{pct}% dari total aset</div>
              </div>
              <span className={`cat-chev${isOpen?' open':''}`}>▶</span>
            </div>
            {isOpen && (
              <div className="cat-items">
                {items.length===0 && <div style={{textAlign:'center',color:'#64748B',fontSize:'.82rem',padding:'10px 0'}}>Belum ada aset di kategori ini</div>}
                {items.map((item,idx)=>{
                  const isEditing = editState?.key===key&&editState?.idx===idx;
                  const k = `${key}_${idx}`;
                  return (
                    <div key={idx}>
                      <div className="aset-item">
                        <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:0}}>
                          <div className="aset-dot" style={{background:cfg.color}}/>
                          <div style={{minWidth:0}}>
                            <div className="aset-iname">{item.name}</div>
                            <div className="aset-itype">{item.subtype}</div>
                          </div>
                        </div>
                        <div style={{textAlign:'right',flexShrink:0}}>
                          <div className="aset-ival">{fmt(item.value)}</div>
                          <div className="aset-idate">{item.date}</div>
                        </div>
                        <div className="aset-edit-btns">
                          <button className="aset-edit-btn" onClick={()=>isEditing?setEditState(null):startEdit(key,idx)} title="Edit">✏️</button>
                          <button className="aset-edit-btn del" onClick={()=>deleteAset(key,idx)} title="Hapus">🗑️</button>
                        </div>
                      </div>
                      {isEditing && (
                        <div style={{background:'#E9EDFF',borderRadius:10,padding:'12px 14px',margin:'4px 0',border:'1.5px solid #2D4BFF'}}>
                          <div className="aif-grid">
                            <div><label className="aif-lbl">Nama</label><input className="aif-inp" value={editVals[`n_${k}`]||''} onChange={e=>setEditVals(p=>({...p,[`n_${k}`]:e.target.value}))}/></div>
                            <div><label className="aif-lbl">Nilai (Rp)</label><input className="aif-inp" type="number" value={editVals[`v_${k}`]||''} onChange={e=>setEditVals(p=>({...p,[`v_${k}`]:e.target.value}))}/></div>
                            <div><label className="aif-lbl">Sub-tipe</label><input className="aif-inp" value={editVals[`s_${k}`]||''} onChange={e=>setEditVals(p=>({...p,[`s_${k}`]:e.target.value}))}/></div>
                            <div><label className="aif-lbl">Tgl Update</label><input className="aif-inp" type="date" value={editVals[`d_${k}`]||''} onChange={e=>setEditVals(p=>({...p,[`d_${k}`]:e.target.value}))}/></div>
                          </div>
                          <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                            <button className="btn btn-ghost btn-sm" onClick={()=>setEditState(null)}>Batal</button>
                            <button className="btn btn-sm" onClick={()=>saveEdit(key,idx)}>💾 Simpan</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button className="add-aset-btn" onPointerDown={e => { e.preventDefault(); openAddModal(key); }}>＋ Tambah {cfg.label}</button>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="card" style={{marginTop:6}}>
        <div className="card-ttl">📋 Ringkasan Kekayaan</div>
        {ASET_CATS.map(key=>{
          const total=data[key].reduce((s,i)=>s+i.value,0);
          if(total===0) return null;
          return <div key={key} className="smry-row"><div className="smry-lbl">{CAT_CONF[key].icon} {CAT_CONF[key].label}</div><div className="smry-val" style={{color:CAT_CONF[key].color}}>{fmt(total)}</div></div>;
        })}
        <div className="smry-row" style={{borderTop:'1.5px solid #E2E8F0',marginTop:4,paddingTop:14}}>
          <div className="smry-lbl" style={{fontWeight:700}}>Total Aset</div>
          <div className="smry-val" style={{color:'#16A34A'}}>{fmt(totalAset)}</div>
        </div>
        {utang>0 && <div className="smry-row"><div className="smry-lbl" style={{fontWeight:700}}>Total Utang</div><div className="smry-val" style={{color:'#DC2626'}}>- {fmt(utang)}</div></div>}
        <div className="smry-row">
          <div className="smry-lbl" style={{fontWeight:800,color:'#0F172A'}}>🏆 Net Worth</div>
          <div className="smry-val" style={{color:netWorth>=0?'#2D4BFF':'#DC2626',fontSize:'1.05rem'}}>{fmt(netWorth)}</div>
        </div>
      </div>

      {/* Modal Tambah Aset */}
      {showModal && (
        <div className="crud-overlay" onClick={tryCloseAsetOverlay}>
          <div className="crud-modal" onClick={e => e.stopPropagation()}>
            <div className="crud-modal-head">
              <h3>➕ Tambah Aset Baru</h3>
              <button className="crud-close" onClick={closeAsetModal}>✕</button>
            </div>
            <div className="crud-modal-body">
              <div className="mfg">
                <label>Kategori Aset</label>
                <select value={mCat} onChange={e=>{const c=e.target.value as AsetCat;setMCat(c);setMSub(ASET_SUBTYPES[c][0]);}}>
                  {ASET_CATS.map(k=><option key={k} value={k}>{CAT_CONF[k].icon} {CAT_CONF[k].label}</option>)}
                </select>
              </div>
              <div className="mfg">
                <label>Jenis / Sub-kategori</label>
                <select value={mSub} onChange={e=>setMSub(e.target.value)}>
                  {ASET_SUBTYPES[mCat].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="mfg">
                <label>Nama / Keterangan</label>
                <input type="text" value={mName} onChange={e=>setMName(e.target.value)} placeholder="Contoh: Rekening BCA, Saham TLKM, Honda Jazz..."/>
              </div>
              <div className="mf-row">
                <div className="mfg"><label>Nilai (Rp)</label><input type="number" value={mVal} onChange={e=>setMVal(e.target.value)} placeholder="0"/></div>
                <div className="mfg"><label>Terakhir Diperbarui</label><input type="date" value={mDate} onChange={e=>setMDate(e.target.value)}/></div>
              </div>
              <div className="crud-modal-foot">
                <button className="btn btn-ghost btn-sm" onClick={closeAsetModal}>Batal</button>
                <button className="btn btn-sm" onClick={saveAset} disabled={saving}>{saving?'Menyimpan...':'💾 Simpan Aset'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── PAGE: GOALS ─── */
function PageGoals({phone, toast}: {phone:string; toast:(m:string,t?:string)=>void}) {
  const [goals, setGoals]       = useState<GoalItem[]>([]);
  const [asetLikuid, setAsetLikuid] = useState(0);
  /* ── Click-through guard ── */
  const goalModalOpenedAt = useRef(0);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mName, setMName]   = useState('');
  const [mCat, setMCat]     = useState('Dana Darurat');
  const [mIcon, setMIcon]   = useState('🛡️');
  const [mTarget, setMTarget] = useState('');
  const [mDeadline, setMDeadline] = useState('');
  const [mAlloc, setMAlloc]   = useState('');
  const [mSrc, setMSrc]       = useState('Rekening Bank');

  const openGoalModal = () => { goalModalOpenedAt.current = Date.now(); setShowModal(true); };
  const closeGoalModal = () => setShowModal(false);
  const tryCloseGoalOverlay = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && Date.now() - goalModalOpenedAt.current > 400) closeGoalModal();
  };

  const load = useCallback(async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const [gRes, cRes] = await Promise.all([
        supaReq(`/rest/v1/user_goals?phone_number=eq.${phone}&order=created_at.asc&select=*`),
        supaReq(`/rest/v1/user_assets?phone_number=eq.${phone}&category=eq.cash&select=value`),
      ]);
      const [gData, cData] = await Promise.all([gRes.json(), cRes.json()]);
      if (Array.isArray(gData)) {
        setGoals(gData.map((r:any)=>({
          id:r.id, name:r.name, cat:r.category, icon:r.icon||'🎯', color:r.color||'gc-blue',
          target:Number(r.target_amount), achieved:Number(r.achieved_amount),
          deadline:r.deadline, monthly:Number(r.monthly_target||0),
          sources:r.sources?(typeof r.sources==='string'?JSON.parse(r.sources):r.sources):[],
        })));
      }
      if (Array.isArray(cData)) setAsetLikuid(cData.reduce((s:number,r:any)=>s+Number(r.value||0),0));
    } catch {}
    setLoading(false);
  }, [phone]);

  useEffect(()=>{load();},[load]);

  const totalAllocated = goals.reduce((s,g)=>s+g.achieved,0);
  const avgCompletion  = goals.length>0?Math.round(goals.reduce((s,g)=>s+Math.min(g.achieved/Math.max(g.target,1)*100,100),0)/goals.length):0;
  const sisaLikuid     = asetLikuid - totalAllocated;
  const liqPct         = asetLikuid>0?Math.min(Math.round(totalAllocated/asetLikuid*100),100):0;

  const saveGoal = async () => {
    if (!mName.trim()){toast('Nama goal tidak boleh kosong','red');return;}
    setSaving(true);
    try {
      const target  = parseFloat(mTarget)||0;
      const alloc   = parseFloat(mAlloc)||0;
      const color   = GOAL_COLORS[goals.length%GOAL_COLORS.length];
      const sources = alloc>0?[{name:mSrc,value:alloc,dot:'#2D4BFF'}]:[];
      const res = await supaReq('/rest/v1/user_goals','POST',{
        phone_number:phone, name:mName, category:mCat, icon:mIcon, color,
        target_amount:target, achieved_amount:alloc,
        deadline:mDeadline||'2027-12-31',
        monthly_target:target>0?Math.round(target/12):0,
        sources:JSON.stringify(sources),
      });
      const result  = await res.json();
      const created = Array.isArray(result)?result[0]:result;
      if (!created?.id){toast('Gagal menyimpan goal','red');setSaving(false);return;}
      setGoals(prev=>[...prev,{id:created.id,name:mName,cat:mCat,icon:mIcon,color,target,achieved:alloc,deadline:mDeadline||'2027-12-31',monthly:Math.round(target/12),sources}]);
      setShowModal(false); setMName(''); setMTarget(''); setMAlloc('');
      toast('Goal berhasil dibuat 🎯','green');
    } catch {toast('Gagal menyimpan goal','red');}
    setSaving(false);
  };

  const deleteGoal = async (id?:string) => {
    if (!id||!confirm('Hapus goal ini?')) return;
    const res = await supaReq(`/rest/v1/user_goals?id=eq.${id}`,'DELETE');
    if (!res.ok){toast('Gagal hapus goal','red');return;}
    setGoals(prev=>prev.filter(g=>g.id!==id));
    toast('Goal dihapus','');
  };

  return (
    <div className="pg-main">
      {/* FAB mobile — onPointerDown + preventDefault prevents 300ms synthetic click */}
      <button className="mob-add-fab" onPointerDown={e => { e.preventDefault(); openGoalModal(); }} title="Buat Goal Baru">＋</button>
      {loading && <div style={{textAlign:'center',padding:'40px 0',color:'#64748B'}}>⏳ Memuat goals...</div>}

      {/* Hero */}
      <div className="goals-hero">
        <div>
          <h2>🎯 Goals & Portofolio</h2>
          <p>Alokasikan aset likuid ke tujuan finansial spesifik kamu</p>
          <div className="gh-stats">
            <div className="gh-stat"><div className="gsl">Total Goals</div><div className="gsv">{goals.length}</div></div>
            <div className="gh-stat"><div className="gsl">Likuid Tersedia</div><div className="gsv">{fmt(asetLikuid)}</div></div>
            <div className="gh-stat"><div className="gsl">Sudah Dialokasikan</div><div className="gsv">{fmt(totalAllocated)}</div></div>
            <div className="gh-stat"><div className="gsl">Avg Completion</div><div className="gsv">{avgCompletion}%</div></div>
          </div>
        </div>
        <div className="goals-hero-icon">🎯</div>
      </div>

      {/* Liquid bar */}
      <div className="liq-bar-card">
        <div className="card-ttl">💧 Alokasi Aset Likuid</div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}>
          <div style={{fontSize:'.84rem',color:'#64748B'}}>Digunakan: <strong style={{color:'#0F172A'}}>{fmt(totalAllocated)}</strong> dari <span>{fmt(asetLikuid)}</span></div>
          <div style={{fontSize:'.84rem',fontWeight:700,color:'#2D4BFF'}}>{liqPct}%</div>
        </div>
        <div style={{height:12,background:'#E2E8F0',borderRadius:99,overflow:'hidden'}}>
          <div style={{height:'100%',borderRadius:99,background:'linear-gradient(90deg,#2D4BFF,#22D3EE)',width:`${liqPct}%`,transition:'width .6s ease'}}/>
        </div>
        <div style={{fontSize:'.76rem',color:sisaLikuid>=0?'#16A34A':'#DC2626',marginTop:6}}>
          {sisaLikuid>=0?`✅ Sisa likuid: ${fmt(sisaLikuid)}`:`⚠️ Over-alokasi: ${fmt(Math.abs(sisaLikuid))}`}
        </div>
      </div>

      {/* Goals list header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <div style={{fontFamily:"'Sora',sans-serif",fontSize:'.95rem',fontWeight:700,color:'#0F172A'}}>📁 Daftar Goals</div>
        <button className="btn btn-sm" onPointerDown={e => { e.preventDefault(); openGoalModal(); }}>＋ Buat Goal Baru</button>
      </div>

      {goals.length===0&&!loading&&(
        <div style={{textAlign:'center',padding:'40px',color:'#64748B',fontSize:'.88rem',background:'#fff',borderRadius:16,border:'1px solid #E2E8F0'}}>
          🎯 Belum ada goal. Klik "＋ Buat Goal Baru" untuk mulai!
        </div>
      )}

      {goals.map(g=>{
        const pct      = g.target>0?Math.min(Math.round(g.achieved/g.target*100),100):0;
        const colorHex = GC_HEX[g.color]||'#2D4BFF';
        return (
          <div key={g.id} className={`goal-card ${g.color}`}>
            <div className="gcard-hdr">
              <div style={{display:'flex',alignItems:'flex-start',gap:12,flex:1,minWidth:0}}>
                <div className="gcard-icon">{g.icon}</div>
                <div><div className="gcard-title">{g.name}</div><div className="gcard-cat">{g.cat}</div></div>
              </div>
              <div className="gcard-acts">
                <button className="aset-edit-btn del" onClick={()=>deleteGoal(g.id)} title="Hapus">🗑️</button>
              </div>
            </div>
            <div className="gcard-amts">
              <div><div className="gcard-achieved">{fmt(g.achieved)}</div><div className="gcard-target">dari {fmt(g.target)}</div></div>
              <div className="gcard-pct" style={{color:colorHex}}>{pct}%</div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{width:`${pct}%`,background:colorHex}}/>
            </div>
            <div className="gcard-meta">
              <div className="gcard-meta-i">📅 <span>{g.deadline||'-'}</span></div>
              <div className="gcard-meta-i">💰 <span>Est. {fmt(g.monthly)}/bln</span></div>
              {g.sources.length>0&&<div className="gcard-meta-i">🏦 <span>{g.sources[0].name}</span></div>}
            </div>
            {g.sources.length>0&&(
              <div className="gcard-sources">
                <div className="gsrc-ttl">Sumber Dana</div>
                {g.sources.map((src,i)=>(
                  <div key={i} className="gsrc-item">
                    <div style={{display:'flex',alignItems:'center',gap:7}}><div className="gsrc-dot" style={{background:src.dot||'#2D4BFF'}}/><span className="gsrc-name">{src.name}</span></div>
                    <span className="gsrc-val">{fmt(src.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal */}
      {showModal&&(
        <div className="crud-overlay" onClick={tryCloseGoalOverlay}>
          <div className="crud-modal" onClick={e => e.stopPropagation()}>
            <div className="crud-modal-head">
              <h3>🎯 Buat Goal Baru</h3>
              <button className="crud-close" onClick={closeGoalModal}>✕</button>
            </div>
            <div className="crud-modal-body">
              <div className="mfg"><label>Nama Goal</label><input type="text" value={mName} onChange={e=>setMName(e.target.value)} placeholder="Contoh: Dana Darurat, DP Rumah, Liburan Jepang..."/></div>
              <div className="mf-row">
                <div className="mfg">
                  <label>Kategori</label>
                  <select value={mCat} onChange={e=>setMCat(e.target.value)}>
                    {['Dana Darurat','Properti','Pendidikan','Liburan','Kendaraan','Pernikahan','Investasi','Lainnya'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="mfg">
                  <label>Ikon</label>
                  <select value={mIcon} onChange={e=>setMIcon(e.target.value)}>
                    {['🛡️','🏠','✈️','🎓','🚗','💍','📈','🎯'].map(ic=><option key={ic}>{ic}</option>)}
                  </select>
                </div>
              </div>
              <div className="mf-row">
                <div className="mfg"><label>Target (Rp)</label><input type="number" value={mTarget} onChange={e=>setMTarget(e.target.value)} placeholder="0"/></div>
                <div className="mfg"><label>Deadline</label><input type="date" value={mDeadline} onChange={e=>setMDeadline(e.target.value)}/></div>
              </div>
              <div className="mfg">
                <label>Alokasi dari Aset Likuid (Rp)</label>
                <input type="number" value={mAlloc} onChange={e=>setMAlloc(e.target.value)} placeholder="0"/>
                <div className="mfg-hint">Sisa likuid belum teralokasi: {fmt(Math.max(sisaLikuid,0))}</div>
              </div>
              <div className="mfg"><label>Sumber Dana Utama</label><input type="text" value={mSrc} onChange={e=>setMSrc(e.target.value)} placeholder="Rekening BCA, GoPay, dll"/></div>
              <div className="crud-modal-foot">
                <button className="btn btn-ghost btn-sm" onClick={closeGoalModal}>Batal</button>
                <button className="btn btn-sm" onClick={saveGoal} disabled={saving}>{saving?'Menyimpan...':'🎯 Buat Goal'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type PageName = 'dashboard'|'transactions'|'aset'|'goals'|'settings'|'affiliate'|'profile';
const TITLES: Record<PageName,string> = {dashboard:'Dasbor Utama',transactions:'Transaksi',aset:'🏦 Aset & Net Worth',goals:'🎯 Goals & Portofolio',settings:'Pengaturan',affiliate:'Affiliate',profile:'Profil'};

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';

/* ── Supabase REST helper ── */
const supaReq = (path: string, method = 'GET', body?: any) =>
  fetch(SUPA_URL + path, {
    method,
    headers: {
      'apikey'       : SUPA_ANON,
      'Authorization': 'Bearer ' + SUPA_ANON,
      'Content-Type' : 'application/json',
      'Prefer'       : 'return=representation',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

export function MiraDashboard() {
  const navigate = useNavigate();
  const [phone, setPhone]     = useState('');
  const [ready, setReady]     = useState(false);
  const [curPage, setCurPage] = useState<PageName>('dashboard');
  const [period, setPeriod]   = useState<'7d'|'30d'|'3m'>('30d');
  const [sbOpen, setSbOpen]   = useState(false);
  const {msg, type, show, toast} = useToast();
  const [allTxns, setAllTxns]   = useState<Txn[]>([]);
  const [liveUser, setLiveUser] = useState<LiveUser | null>(null);

  /* ── CSS injection: useLayoutEffect = synchronous pre-paint, no FOUC ── */
  useLayoutEffect(() => {
    const el = document.createElement('style');
    el.id = 'mira-db-css';
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => { document.getElementById('mira-db-css')?.remove(); };
  }, []);

  /* ── helpers ── */
  const mapTxns = (expenses: any[]): Txn[] =>
    Array.isArray(expenses) ? expenses.map((e: any) => ({
      id           : e.id,
      phone_number : e.phone_number,
      date         : e.date ? new Date(e.date) : new Date(),
      item         : e.item     || '-',
      merchant     : e.merchant || '-',
      sub          : e.merchant || '-',
      cat          : mapCategory(e.category || 'Others'),
      amount       : Number(e.amount   || 0),
      method       : e.wallet   || '-',
      currency     : e.currency || 'IDR',
      quantity     : Number(e.quantity || 1),
      source_msg_id: e.source_message_id || null,
      created_at   : e.created_at || null,
      isIn         : e.transaction_type?.toLowerCase() === 'income'
                     || mapCategory(e.category || '') === 'Pemasukan',
    })) : [];

  const loadDashboardData = async (ph: string) => {
    const from90 = new Date();
    from90.setDate(from90.getDate() - 90);
    const fromStr = from90.toISOString().split('T')[0];
    try {
      const res = await fetch(
        `${SUPA_URL}/rest/v1/expenses?phone_number=eq.${ph}&date=gte.${fromStr}&order=date.desc,created_at.desc&limit=500`,
        { headers: {
          'apikey'       : SUPA_ANON,
          'Authorization': 'Bearer ' + SUPA_ANON,
          'Accept'       : 'application/json',
        }}
      );
      const expenses = await res.json();
      if (Array.isArray(expenses)) setAllTxns(mapTxns(expenses));
    } catch {}
  };

  /* Auth check + load data dari Supabase */
  useEffect(() => {
    const stored = sessionStorage.getItem('mira_phone');
    if (!stored) { navigate('/', {replace:true}); return; }
    setPhone(stored);

    // ── Baca dari sessionStorage sebagai CACHE AWAL (bisa stale) ──
    let canonicalPhone = stored;
    const rawUser = sessionStorage.getItem('mira_user');
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        canonicalPhone = u.primary_phone || stored;
        setPhone(canonicalPhone);
        // Set liveUser sementara dari cache — akan di-overwrite oleh fresh fetch di bawah
        setLiveUser(mapUserRow(u, canonicalPhone));
        if (canonicalPhone !== stored) sessionStorage.setItem('mira_phone', canonicalPhone);
      } catch {}
    }

    // ── STEP 4 & 6: Fresh fetch user dari Supabase pakai select=* ──
    // Ini yang MENENTUKAN apakah user masuk dashboard atau pending_assessment.
    // Tidak boleh rely hanya pada sessionStorage cache.
    const initDashboard = async (ph: string) => {
      try {
        const uRes = await fetch(
          `${SUPA_URL}/rest/v1/users?primary_phone=eq.${ph}&select=*`,
          {
            headers: {
              'apikey'       : SUPA_ANON,
              'Authorization': 'Bearer ' + SUPA_ANON,
              'Accept'       : 'application/json',
            },
          }
        );
        if (uRes.ok) {
          const uData = await uRes.json();
          if (Array.isArray(uData) && uData.length > 0) {
            const u = uData[0];
            // STEP 3: Log untuk debug (bisa dihapus setelah fix terverifikasi)
            console.log('[MIRA] account_status (fresh Supabase):', u.account_status);
            console.log('[MIRA] registered_by:', u.registered_by);
            // Update sessionStorage dengan data terbaru (bukan cache)
            sessionStorage.setItem('mira_user', JSON.stringify(u));
            // Override liveUser dengan data fresh — ini yang dipakai untuk cek pending_assessment
            setLiveUser(mapUserRow(u, ph));
          }
        }
      } catch (e) {
        console.warn('[MIRA] Gagal fresh fetch user, pakai cache sessionStorage:', e);
      }

      // Setelah user fresh ter-set, baru load expenses
      await loadDashboardData(ph);

      // STEP 2: setReady(true) hanya SETELAH semua fetch selesai
      // → saat ini liveUser sudah berisi account_status yang akurat dari DB
      setReady(true);
    };

    initDashboard(canonicalPhone);

    // Polling setiap 30 detik — hanya expenses, bukan user profile
    const interval = setInterval(async () => {
      await loadDashboardData(canonicalPhone);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { if (ready) toast('Selamat datang kembali, ' + (liveUser?.name || 'kamu') + ' 👋', 'green'); }, [ready]);

  /* ── CRUD FUNCTIONS ── */
  const deleteTransaction = useCallback(async (id: string) => {
    if (!confirm('Hapus transaksi ini?')) return;
    const res = await fetch(`${SUPA_URL}/rest/v1/expenses?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey'       : SUPA_ANON,
        'Authorization': 'Bearer ' + SUPA_ANON,
        'Content-Type' : 'application/json',
      },
    });
    if (res.ok) {
      setAllTxns(prev => prev.filter(t => t.id !== id));
      toast('Transaksi dihapus', 'green');
    } else {
      toast('Gagal menghapus transaksi', 'red');
    }
  }, [toast]);

  const updateTransaction = useCallback(async (id: string, fields: Record<string,any>) => {
    const res = await fetch(`${SUPA_URL}/rest/v1/expenses?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey'       : SUPA_ANON,
        'Authorization': 'Bearer ' + SUPA_ANON,
        'Content-Type' : 'application/json',
        'Prefer'       : 'return=representation',
      },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      const canonicalPhone = sessionStorage.getItem('mira_phone') || phone;
      await loadDashboardData(canonicalPhone);
      toast('Transaksi diperbarui', 'green');
    } else {
      toast('Gagal memperbarui transaksi', 'red');
    }
  }, [toast, phone]);

  const addTransaction = useCallback(async (fields: Record<string,any>) => {
    const sessionPhone = sessionStorage.getItem('mira_phone') || phone;
    const res = await fetch(`${SUPA_URL}/rest/v1/expenses`, {
      method: 'POST',
      headers: {
        'apikey'       : SUPA_ANON,
        'Authorization': 'Bearer ' + SUPA_ANON,
        'Content-Type' : 'application/json',
        'Prefer'       : 'return=representation',
      },
      body: JSON.stringify({
        phone_number: sessionPhone,
        item    : fields.item     || '-',
        merchant: fields.merchant || '',
        category: fields.category || 'Others',
        amount  : Number(fields.amount || 0),
        wallet  : fields.wallet   || '',
        date    : fields.date     || new Date().toISOString().split('T')[0],
        currency: fields.currency || 'IDR',
        quantity: Number(fields.quantity || 1),
      }),
    });
    if (res.ok) {
      await loadDashboardData(sessionPhone);
      toast('Transaksi ditambahkan', 'green');
    } else {
      toast('Gagal menambah transaksi', 'red');
    }
  }, [toast, phone]);

  /* ── Update liveUser setelah profile save ── */
  const updateLiveUser = useCallback((partial: Partial<LiveUser>) => {
    setLiveUser(prev => prev ? { ...prev, ...partial } : prev);
  }, []);

  /* ── Delete Account ── */
  const delAccount = useCallback(async () => {
    if (!confirm('PERHATIAN: Akun dan semua data akan dihapus permanen. Yakin?')) return;
    const ph = sessionStorage.getItem('mira_phone') || phone;
    try {
      await supaReq(`/rest/v1/expenses?phone_number=eq.${ph}`, 'DELETE');
      await supaReq(`/rest/v1/user_states?phone_number=eq.${ph}`, 'DELETE');
      await supaReq(`/rest/v1/users?primary_phone=eq.${ph}`, 'DELETE');
    } catch {}
    sessionStorage.removeItem('mira_phone');
    sessionStorage.removeItem('mira_user');
    toast('Akun berhasil dihapus', 'red');
    setTimeout(() => navigate('/', { replace: true }), 1500);
  }, [phone, toast, navigate]);

  const handleLogout = () => {
    if (!confirm('Yakin ingin keluar?')) return;
    sessionStorage.removeItem('mira_phone');
    sessionStorage.removeItem('mira_user');
    navigate('/', {replace:true});
  };

  if (!ready) return null;

  /* ── BAGIAN 1 & 2: Deteksi pending_assessment ── */
  if (liveUser?.account_status === 'pending_assessment') {
    return (
      <PendingAssessmentGate
        phone={phone}
        user={liveUser ? { plan_name: liveUser.plan_name, expiry: liveUser.expiry } : null}
        onComplete={() => {
          // STEP 6: Hapus cache sessionStorage mira_user dulu supaya
          // saat reload, initDashboard langsung fetch fresh dari Supabase.
          // Tidak ada cache lama yang bisa mem-block cek account_status.
          try {
            const raw = sessionStorage.getItem('mira_user');
            if (raw) {
              const cached = JSON.parse(raw);
              // Pastikan account_status di cache sudah 'active' sebelum reload
              cached.account_status = 'active';
              sessionStorage.setItem('mira_user', JSON.stringify(cached));
            }
          } catch {}
          window.location.reload();
        }}
      />
    );
  }

  const dayN = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const cut = new Date(); cut.setDate(cut.getDate() - dayN);
  const periodTxns = allTxns.filter(t => t.date >= cut);
  const thisMonth = allTxns.filter(t => {const n = new Date(); return t.date.getMonth()===n.getMonth()&&t.date.getFullYear()===n.getFullYear();}).length;
  const showPeriod = curPage === 'dashboard' || curPage === 'transactions';
  const go = (p: PageName) => {setCurPage(p); setSbOpen(false);};

  return (
    <div id="screen-app" style={{display:'flex',flexDirection:'row',height:'100vh',width:'100vw',overflow:'hidden',background:'#F8FAFC',position:'relative'}}>
      {/* Toast */}
      <div className={`mira-db-toast${show?' show':''}${type?' '+type:''}`}>{msg}</div>

      {/* ── SIDEBAR — inline styles = guarantee berlapis ── */}
      <div
        className={`sidebar${sbOpen?' open':''}`}
        style={{
          width:'240px', minWidth:'240px', maxWidth:'240px',
          flexShrink:0, flexGrow:0, flexBasis:'240px',
          height:'100vh', display:'flex', flexDirection:'column',
          background:'#fff', borderRight:'1px solid #E2E8F0',
          overflow:'hidden', boxSizing:'border-box', position:'relative',
          zIndex:50,
        }}
      >
        {/* sb-logo */}
        <div className="sb-logo" style={{padding:'22px 20px 18px',borderBottom:'1px solid #E2E8F0',flexShrink:0}}>
          <div className="logo-t" style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:'1.45rem',background:'linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',display:'block',lineHeight:1.3}}>MIRA</div>
          <div className="logo-s" style={{fontSize:'.72rem',color:'#64748B',marginTop:1,display:'block'}}>#SemuaMudah</div>
        </div>
        {/* nav-menu: pakai <div> bukan <nav> — eliminates Navigation.css nav{position:fixed} conflict */}
        <div
          className="nav-menu"
          style={{
            flex:'1 1 0%', padding:'14px 10px', display:'flex', flexDirection:'column',
            gap:3, overflowY:'auto', width:'100%', boxSizing:'border-box',
          }}
        >
          {(['dashboard','transactions','aset','goals','settings','affiliate','profile'] as PageName[]).map((pg, i) => {
            const icons = ['📊','📋','🏦','🎯','⚙️','🤝','👤'];
            const labels = ['Dasbor Utama','Transaksi','Aset & Net Worth','Goals','Pengaturan','Affiliate','Profil'];
            const isActive = curPage === pg;
            return (
              <button
                key={pg}
                className={`nav-item${isActive?' active':''}`}
                onClick={() => go(pg)}
                style={{
                  display:'flex', alignItems:'center', gap:11, padding:'11px 13px',
                  borderRadius:11, cursor:'pointer', border:'none',
                  background: isActive ? '#E9EDFF' : 'none',
                  color: isActive ? '#2D4BFF' : '#64748B',
                  fontWeight: isActive ? 700 : 500,
                  fontSize:'.88rem', fontFamily:"'DM Sans',sans-serif",
                  width:'100%', textAlign:'left', lineHeight:1.4, boxSizing:'border-box',
                }}
              >
                <span style={{fontSize:'1.05rem',width:20,textAlign:'center',flexShrink:0}}>{icons[i]}</span>
                {labels[i]}
                {pg==='transactions' && (
                  <span style={{marginLeft:'auto',background:'#2D4BFF',color:'#fff',borderRadius:99,fontSize:'.67rem',fontWeight:700,padding:'2px 7px',minWidth:20,textAlign:'center'}}>{thisMonth}</span>
                )}
              </button>
            );
          })}
        </div>
        {/* sb-footer */}
        <div className="sb-footer" style={{padding:'13px 14px',borderTop:'1px solid #E2E8F0',flexShrink:0}}>
          <div className="sb-user" style={{display:'flex',alignItems:'center',gap:9}}>
            <div style={{width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:'.82rem',color:'#fff',flexShrink:0}}>{liveUser?.avatar || '?'}</div>
            <div style={{minWidth:0,flex:1}}>
              <div style={{fontSize:'.83rem',fontWeight:600,color:'#0F172A',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{liveUser?.name || '-'}</div>
              <div style={{fontSize:'.72rem',color:'#64748B'}}>+{phone}</div>
            </div>
            <button style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'#64748B',fontSize:'1.1rem',padding:'4px 6px',borderRadius:6,flexShrink:0}} title="Keluar" onClick={handleLogout}>⎋</button>
          </div>
        </div>
      </div>
      {/* ── MAIN — inline flex:1 ensures full remaining width ── */}
      <div className="main" style={{flex:'1 1 0%',minWidth:0,minHeight:0,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div className="topbar" style={{height:58,borderBottom:'1px solid #E2E8F0',background:'#fff',display:'flex',alignItems:'center',padding:'0 24px',gap:14,flexShrink:0,boxSizing:'border-box'}}>
          <button className="menu-toggle" onClick={() => setSbOpen(true)}>☰</button>
          <div className="topbar-title" style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:'1.05rem',color:'#0F172A',flex:1}}>{TITLES[curPage]}</div>
          {showPeriod && (
            <div className="period-wrap">
              {(['7d','30d','3m'] as const).map(p => (
                <button key={p} className={`period-btn${period===p?' active':''}`} onClick={() => setPeriod(p)}>
                  {p==='7d'?'7H':p==='30d'?'30H':'3B'}
                </button>
              ))}
            </div>
          )}
          <div className="notif-btn" onClick={() => toast('Tidak ada notifikasi baru 🔔')}>
            🔔<span className="notif-dot"/>
          </div>
          {/* Tombol logout — hanya muncul di mobile */}
          <button className="mob-logout-btn" title="Keluar" onClick={handleLogout}>⎋</button>
        </div>
        <div className="content">
          {curPage==='dashboard'    && <PageDashboard txns={periodTxns} period={period}/>}
          {curPage==='transactions' && <PageTxns allTxns={allTxns} sessionPhone={phone} onDelete={deleteTransaction} onUpdate={updateTransaction} onAdd={addTransaction}/>}
          {curPage==='aset'         && <PageAset phone={phone} toast={toast}/>}
          {curPage==='goals'        && <PageGoals phone={phone} toast={toast}/>}
          {curPage==='settings'     && <PageSettings toast={toast} user={liveUser} phone={phone}/>}
          {curPage==='affiliate'    && <PageAffiliate toast={toast} user={liveUser} phone={phone}/>}
          {curPage==='profile'      && <PageProfile toast={toast} phone={phone} user={liveUser} onUpdate={updateLiveUser} onDelAccount={delAccount} onLogout={handleLogout}/>}
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV — position:fixed, always on top ── */}
      <div className="mob-bottom-nav">
        {([
          {pg:'dashboard'    as PageName, icon:'📊', lbl:'Dasbor'},
          {pg:'transactions' as PageName, icon:'📋', lbl:'Transaksi', dot:true},
          {pg:'aset'         as PageName, icon:'🏦', lbl:'Aset'},
          {pg:'goals'        as PageName, icon:'🎯', lbl:'Goals'},
          {pg:'settings'     as PageName, icon:'⚙️', lbl:'Setting'},
          {pg:'affiliate'    as PageName, icon:'🤝', lbl:'Afiliasi'},
          {pg:'profile'      as PageName, icon:'👤', lbl:'Profil'},
        ]).map(({pg, icon, lbl, dot}) => (
          <button
            key={pg}
            className={`mob-nav-btn${curPage===pg?' active':''}`}
            onClick={() => go(pg)}
          >
            <span className="mob-nav-icon">{icon}</span>
            <span className="mob-nav-lbl">{lbl}</span>
            {dot && pg==='transactions' && <span className="mob-nav-dot"/>}
          </button>
        ))}
      </div>
    </div>
  );
}
