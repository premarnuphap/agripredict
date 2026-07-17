function renderDashboardPage(liffId) {
    if (!liffId) {
        return `
            <html>
                <head>
                    <title>Farm Dashboard</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
                    <style>
                        * { box-sizing: border-box; }
                        body {
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                            padding: 24px;
                            background: #F5F2EA;
                            color: #223344;
                            margin: 0;
                        }
                        .box {
                            max-width: 480px;
                            margin: 48px auto;
                            background: #FAFAF8;
                            padding: 32px 28px;
                            border-radius: 24px;
                            box-shadow: 0 8px 30px rgba(34,51,68,0.08);
                            border: 1px solid rgba(34,51,68,0.06);
                        }
                        h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; }
                        .error {
                            color: #C84B31;
                            font-weight: 600;
                            font-size: 15px;
                        }
                        p { font-size: 15px; line-height: 1.6; color: #223344; }
                        code {
                            background: rgba(140,106,67,0.12);
                            color: #8C6A43;
                            padding: 2px 8px;
                            border-radius: 8px;
                            font-size: 13px;
                        }
                    </style>
                </head>
                <body>
                    <div class="box">
                        <h1>🌾 Farm Dashboard</h1>
                        <p class="error">Missing LIFF ID</p>
                        <p>กรุณาตั้งค่า <code>LIFF_ID</code> ใน server เพื่อเริ่มใช้งานแดชบอร์ด</p>
                    </div>
                </body>
            </html>
        `;
    }

    return `
        <html>
            <head>
                <title>Farm Dashboard</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
                <style>
                    /* ===== Design tokens ===== */
                    :root {
                        --forest: #2F6F57;
                        --forest-dark: #244F41;
                        --moss: #6F8F72;
                        --sand: #F5F2EA;
                        --earth: #8C6A43;
                        --navy: #223344;
                        --white: #FAFAF8;
                        --error: #C84B31;
                        --success: #4B8F5A;
                        --warning: #C89B3C;
                        --border: rgba(34,51,68,0.07);
                        --shadow-sm: 0 1px 2px rgba(34,51,68,0.05);
                        --shadow-md: 0 6px 20px rgba(34,51,68,0.07);
                        --shadow-lg: 0 12px 34px rgba(34,51,68,0.10);
                        --radius-lg: 24px;
                        --radius-md: 18px;
                        --radius-sm: 12px;
                        --header-h: 132px;
                    }

                    * { box-sizing: border-box; }

                    html { -webkit-tap-highlight-color: transparent; }

                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        margin: 0;
                        background: var(--sand);
                        color: var(--navy);
                        font-size: 16px;
                        line-height: 1.5;
                        -webkit-font-smoothing: antialiased;
                    }

                    button, select, input { font-family: inherit; }

                    .app {
                        max-width: 640px;
                        margin: 0 auto;
                        padding-bottom: 48px;
                    }

                    @media (min-width: 900px) {
                        .app { max-width: 1040px; }
                    }

                    /* ===== Section 1: Header ===== */
                    .header {
                        position: sticky;
                        top: 0;
                        z-index: 30;
                        background: var(--sand);
                        padding: 18px 20px 14px;
                        border-bottom: 1px solid var(--border);
                    }

                    .header-top {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                    }

                    .farm-identity { display: flex; flex-direction: column; }

                    .farm-name {
                        font-size: 13px;
                        font-weight: 600;
                        color: var(--moss);
                        text-transform: uppercase;
                        letter-spacing: 0.06em;
                        margin: 0 0 2px;
                    }

                    .greeting {
                        font-size: 21px;
                        font-weight: 700;
                        color: var(--navy);
                        margin: 0;
                    }

                    .header-actions { display: flex; align-items: center; gap: 10px; }

                    .icon-btn {
                        position: relative;
                        width: 42px;
                        height: 42px;
                        border-radius: 50%;
                        border: 1px solid var(--border);
                        background: var(--white);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: transform 0.15s ease, box-shadow 0.15s ease;
                    }

                    .icon-btn:active { transform: scale(0.94); }

                    .icon-btn:hover { box-shadow: var(--shadow-sm); }

                    .notif-dot {
                        position: absolute;
                        top: 8px;
                        right: 9px;
                        width: 7px;
                        height: 7px;
                        border-radius: 50%;
                        background: var(--error);
                        border: 1.5px solid var(--sand);
                    }

                    .avatar {
                        width: 42px;
                        height: 42px;
                        border-radius: 50%;
                        object-fit: cover;
                        border: 1px solid var(--border);
                        background: var(--moss);
                        color: var(--white);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        font-size: 15px;
                    }

                    .header-meta {
                        display: flex;
                        align-items: center;
                        gap: 14px;
                        margin-top: 12px;
                        font-size: 13px;
                        color: rgba(34,51,68,0.62);
                    }

                    .header-meta .dot { opacity: 0.4; }

                    .weather-chip {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                    }

                    /* ===== Section 2: AI Insight hero ===== */
                    .section-pad { padding: 16px 20px 0; }

                    .insight-card {
                        background: var(--forest);
                        border-radius: var(--radius-lg);
                        padding: 24px 22px;
                        color: var(--white);
                        box-shadow: var(--shadow-lg);
                        position: relative;
                        overflow: hidden;
                    }

                    .insight-eyebrow {
                        font-size: 12px;
                        font-weight: 600;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                        opacity: 0.75;
                        margin: 0 0 10px;
                    }

                    .insight-body {
                        display: flex;
                        align-items: flex-start;
                        gap: 14px;
                    }

                    .insight-icon {
                        font-size: 30px;
                        line-height: 1;
                        flex-shrink: 0;
                    }

                    .insight-title {
                        font-size: 19px;
                        font-weight: 700;
                        margin: 0 0 6px;
                        line-height: 1.35;
                    }

                    .insight-subtitle {
                        font-size: 14.5px;
                        font-weight: 400;
                        margin: 0;
                        opacity: 0.92;
                        line-height: 1.5;
                    }

                    /* ===== Shared card / section shell ===== */
                    .card {
                        background: var(--white);
                        border-radius: var(--radius-lg);
                        border: 1px solid var(--border);
                        box-shadow: var(--shadow-md);
                        transition: box-shadow 0.2s ease, transform 0.2s ease;
                    }

                    .section-title-row {
                        display: flex;
                        align-items: baseline;
                        justify-content: space-between;
                        margin-bottom: 14px;
                    }

                    .section-title {
                        font-size: 17px;
                        font-weight: 600;
                        color: var(--navy);
                        margin: 0;
                    }

                    .section-hint {
                        font-size: 12.5px;
                        color: rgba(34,51,68,0.5);
                        margin: 2px 0 0;
                    }

                    /* ===== Section 3: KPI cards ===== */
                    .kpi-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 12px;
                    }

                    @media (min-width: 640px) {
                        .kpi-grid { grid-template-columns: repeat(4, 1fr); }
                    }

                    .kpi-card {
                        padding: 18px 16px;
                        cursor: default;
                    }

                    .kpi-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-1px); }

                    .kpi-label {
                        font-size: 13px;
                        color: rgba(34,51,68,0.58);
                        font-weight: 500;
                        margin: 0 0 8px;
                    }

                    .kpi-value {
                        font-size: 24px;
                        font-weight: 800;
                        color: var(--navy);
                        margin: 0 0 8px;
                        font-variant-numeric: tabular-nums;
                        letter-spacing: -0.01em;
                    }

                    .kpi-trend {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        font-size: 12.5px;
                        font-weight: 600;
                        padding: 3px 8px;
                        border-radius: 20px;
                    }

                    .kpi-trend.up { color: var(--success); background: rgba(75,143,90,0.12); }
                    .kpi-trend.down { color: var(--error); background: rgba(200,75,49,0.12); }
                    .kpi-trend.flat { color: var(--moss); background: rgba(111,143,114,0.12); }

                    .kpi-spark { width: 100%; height: 28px; margin-top: 10px; display: block; }

                    /* ===== Section 4: Health score ===== */
                    .health-card { padding: 22px; display: flex; flex-direction: column; gap: 16px; }

                    .health-top { display: flex; align-items: center; gap: 18px; }

                    .health-ring-wrap { position: relative; width: 84px; height: 84px; flex-shrink: 0; }

                    .health-ring-wrap svg { transform: rotate(-90deg); }

                    .health-score-num {
                        position: absolute;
                        inset: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 22px;
                        font-weight: 800;
                        color: var(--navy);
                    }

                    .health-badge {
                        display: inline-block;
                        font-size: 12px;
                        font-weight: 700;
                        letter-spacing: 0.04em;
                        padding: 4px 10px;
                        border-radius: 20px;
                        margin-bottom: 6px;
                    }

                    .health-reasons {
                        list-style: none;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .health-reasons li {
                        display: flex;
                        align-items: flex-start;
                        gap: 10px;
                        font-size: 14px;
                        color: rgba(34,51,68,0.78);
                        line-height: 1.5;
                    }

                    .health-reasons .dot-icon {
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        margin-top: 7px;
                        flex-shrink: 0;
                    }

                    /* ===== Section 5: Season timeline ===== */
                    .timeline-scroll {
                        display: flex;
                        gap: 10px;
                        overflow-x: auto;
                        padding: 4px 2px 6px;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none;
                    }

                    .timeline-scroll::-webkit-scrollbar { display: none; }

                    .timeline-month {
                        flex: 0 0 auto;
                        width: 76px;
                        border-radius: var(--radius-sm);
                        border: 1px solid var(--border);
                        padding: 12px 8px;
                        text-align: center;
                        background: var(--sand);
                    }

                    .timeline-month.active {
                        background: var(--forest);
                        border-color: var(--forest);
                    }

                    .timeline-month .tm-icon { font-size: 20px; margin-bottom: 6px; }

                    .timeline-month .tm-month {
                        font-size: 12px;
                        font-weight: 700;
                        color: var(--navy);
                        margin-bottom: 2px;
                    }

                    .timeline-month.active .tm-month { color: var(--white); }

                    .timeline-month .tm-stage {
                        font-size: 10.5px;
                        color: rgba(34,51,68,0.55);
                        line-height: 1.3;
                    }

                    .timeline-month.active .tm-stage { color: rgba(250,250,248,0.85); }

                    /* ===== Section 6: Recommendations ===== */
                    .rec-list { display: flex; flex-direction: column; gap: 10px; }

                    .rec-item {
                        display: flex;
                        align-items: center;
                        gap: 14px;
                        padding: 14px;
                        border-radius: var(--radius-sm);
                        border: 1px solid var(--border);
                        background: var(--sand);
                    }

                    .rec-icon {
                        width: 42px;
                        height: 42px;
                        border-radius: 12px;
                        background: var(--white);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 19px;
                        flex-shrink: 0;
                    }

                    .rec-text { flex: 1; min-width: 0; }

                    .rec-priority {
                        display: inline-block;
                        font-size: 10.5px;
                        font-weight: 700;
                        letter-spacing: 0.05em;
                        text-transform: uppercase;
                        padding: 2px 7px;
                        border-radius: 8px;
                        margin-bottom: 4px;
                    }

                    .rec-priority.high { color: var(--error); background: rgba(200,75,49,0.12); }
                    .rec-priority.medium { color: var(--warning); background: rgba(200,155,60,0.14); }
                    .rec-priority.low { color: var(--moss); background: rgba(111,143,114,0.14); }

                    .rec-title { font-size: 14.5px; font-weight: 600; color: var(--navy); margin: 0 0 2px; }

                    .rec-reason { font-size: 13px; color: rgba(34,51,68,0.6); margin: 0; line-height: 1.4; }

                    .rec-action {
                        flex-shrink: 0;
                        width: 34px;
                        height: 34px;
                        border-radius: 50%;
                        border: none;
                        background: var(--forest);
                        color: var(--white);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: transform 0.15s ease;
                    }

                    .rec-action:active { transform: scale(0.9); }

                    /* ===== Charts sections ===== */
                    .chart-canvas-wrap { position: relative; width: 100%; min-height: 220px; }

                    .chart-stat-row {
                        display: flex;
                        gap: 18px;
                        margin-top: 14px;
                        flex-wrap: wrap;
                    }

                    .chart-stat { font-size: 13px; color: rgba(34,51,68,0.6); }

                    .chart-stat b { color: var(--navy); font-weight: 700; }

                    .chart-stat.peak b { color: var(--success); }

                    .chart-stat.low b { color: var(--error); }

                    .empty-state {
                        min-height: 160px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: rgba(34,51,68,0.45);
                        font-size: 14px;
                        text-align: center;
                        padding: 20px;
                    }

                    /* ===== Section 8: Expense bars ===== */
                    .expense-bars { display: flex; flex-direction: column; gap: 12px; }

                    .expense-row-top {
                        display: flex;
                        justify-content: space-between;
                        align-items: baseline;
                        margin-bottom: 6px;
                        font-size: 13.5px;
                    }

                    .expense-row-name { font-weight: 600; color: var(--navy); }

                    .expense-row-value { color: rgba(34,51,68,0.6); font-variant-numeric: tabular-nums; }

                    .expense-bar-track {
                        height: 10px;
                        border-radius: 6px;
                        background: var(--sand);
                        overflow: hidden;
                    }

                    .expense-bar-fill {
                        height: 100%;
                        border-radius: 6px;
                        background: var(--moss);
                        transition: width 0.6s ease;
                    }

                    .expense-bar-fill.top { background: var(--forest); }

                    /* ===== Section 9: Top cost driver ===== */
                    .driver-card { padding: 20px 22px; display: flex; align-items: center; gap: 16px; }

                    .driver-icon {
                        width: 52px;
                        height: 52px;
                        border-radius: 16px;
                        background: rgba(140,106,67,0.14);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        flex-shrink: 0;
                    }

                    .driver-name { font-size: 15px; font-weight: 600; color: var(--navy); margin: 0 0 4px; }

                    .driver-value { font-size: 22px; font-weight: 800; color: var(--navy); margin: 0; }

                    .driver-share {
                        font-size: 12.5px;
                        font-weight: 700;
                        color: var(--earth);
                        background: rgba(140,106,67,0.12);
                        padding: 3px 9px;
                        border-radius: 20px;
                    }

                    .driver-note {
                        margin: 12px 22px 20px;
                        padding-top: 14px;
                        border-top: 1px solid var(--border);
                        font-size: 13.5px;
                        color: rgba(34,51,68,0.65);
                        line-height: 1.5;
                    }

                    /* ===== Section 11: Transactions ===== */
                    .tx-search {
                        width: 100%;
                        padding: 11px 14px;
                        border-radius: 12px;
                        border: 1px solid var(--border);
                        background: var(--sand);
                        font-size: 14px;
                        color: var(--navy);
                        margin-bottom: 12px;
                    }

                    .tx-search:focus { outline: 2px solid var(--forest); outline-offset: 1px; }

                    .tx-list { display: flex; flex-direction: column; }

                    .tx-row {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px 2px;
                        border-bottom: 1px solid var(--border);
                    }

                    .tx-row:last-child { border-bottom: none; }

                    .tx-icon {
                        width: 38px;
                        height: 38px;
                        border-radius: 11px;
                        background: var(--sand);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 17px;
                        flex-shrink: 0;
                    }

                    .tx-mid { flex: 1; min-width: 0; }

                    .tx-cat { font-size: 14px; font-weight: 600; color: var(--navy); margin: 0 0 2px; }

                    .tx-note {
                        font-size: 12.5px;
                        color: rgba(34,51,68,0.5);
                        margin: 0;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .tx-right { text-align: right; flex-shrink: 0; }

                    .tx-amount { font-size: 14.5px; font-weight: 700; font-variant-numeric: tabular-nums; }

                    .tx-amount.income { color: var(--success); }

                    .tx-amount.expense { color: var(--navy); }

                    .tx-date { font-size: 11.5px; color: rgba(34,51,68,0.45); margin-top: 2px; }

                    /* ===== Toolbar (period + reset) ===== */
                    .toolbar {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 10px;
                        margin-bottom: 4px;
                    }

                    .segmented {
                        display: inline-flex;
                        background: var(--sand);
                        border-radius: 12px;
                        padding: 3px;
                        gap: 2px;
                    }

                    .segmented button {
                        border: none;
                        background: transparent;
                        padding: 7px 13px;
                        font-size: 13px;
                        font-weight: 600;
                        color: rgba(34,51,68,0.55);
                        border-radius: 9px;
                        cursor: pointer;
                    }

                    .segmented button.active {
                        background: var(--white);
                        color: var(--navy);
                        box-shadow: var(--shadow-sm);
                    }

                    .ghost-btn {
                        border: 1px solid var(--border);
                        background: var(--white);
                        color: rgba(34,51,68,0.6);
                        font-size: 12.5px;
                        font-weight: 600;
                        padding: 8px 12px;
                        border-radius: 10px;
                        cursor: pointer;
                    }

                    .ghost-btn:hover { color: var(--error); border-color: rgba(200,75,49,0.3); }

                    .action-toast {
                        font-size: 12.5px;
                        font-weight: 600;
                        margin-top: 8px;
                        min-height: 16px;
                    }

                    /* ===== Layout stacks ===== */
                    .stack { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }

                    @media (min-width: 900px) {
                        .two-col { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; align-items: start; }
                        .two-col > .stack { margin-top: 0; }
                    }

                    /* ===== Skeleton ===== */
                    .skel {
                        background: linear-gradient(90deg, rgba(34,51,68,0.06) 25%, rgba(34,51,68,0.10) 37%, rgba(34,51,68,0.06) 63%);
                        background-size: 400% 100%;
                        animation: skel-shine 1.4s ease infinite;
                        border-radius: 8px;
                    }

                    @keyframes skel-shine {
                        0% { background-position: 100% 50%; }
                        100% { background-position: 0 50%; }
                    }

                    /* ===== Fade in ===== */
                    .fade-in { animation: fadeIn 0.45s ease both; }

                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(6px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    @media (prefers-reduced-motion: reduce) {
                        .fade-in, .skel, .icon-btn, .rec-action, .kpi-card, .expense-bar-fill { animation: none !important; transition: none !important; }
                    }
                </style>
            </head>
            <body>
                <div class="app">

                    <!-- ===== Section 1: Header ===== -->
                    <header class="header">
                        <div class="header-top">
                            <div class="farm-identity">
                                <p class="farm-name" id="farmName">ฟาร์มของฉัน</p>
                                <h1 class="greeting" id="greetingText">สวัสดี 👋</h1>
                            </div>
                            <div class="header-actions">
                                <button class="icon-btn" id="notifBtn" type="button" aria-label="การแจ้งเตือน">
                                    🔔
                                    <span class="notif-dot"></span>
                                </button>
                                <div class="avatar" id="avatarBox">🌾</div>
                            </div>
                        </div>
                        <div class="header-meta">
                            <span id="todayDate">–</span>
                            <span class="dot">•</span>
                            <span class="weather-chip" id="weatherChip">🌤️ –</span>
                        </div>
                    </header>

                    <!-- ===== Section 2: AI Insight ===== -->
                    <div class="section-pad">
                        <div class="insight-card fade-in" id="insightCard">
                            <p class="insight-eyebrow">ข้อมูลเชิงลึกวันนี้</p>
                            <div class="insight-body">
                                <div class="insight-icon" id="insightIcon">🌱</div>
                                <div>
                                    <p class="insight-title" id="insightTitle">กำลังวิเคราะห์ข้อมูลฟาร์มของคุณ...</p>
                                    <p class="insight-subtitle" id="insightSubtitle">รอสักครู่นะ</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="section-pad">
                        <div class="toolbar">
                            <div class="segmented" id="daysSegmented" role="group" aria-label="ช่วงเวลา">
                                <button type="button" data-days="7">7 วัน</button>
                                <button type="button" data-days="14">14 วัน</button>
                                <button type="button" data-days="30" class="active">30 วัน</button>
                            </div>
                            <button class="ghost-btn" id="resetTodayBtn" type="button">รีเซ็ตวันนี้</button>
                        </div>
                        <div class="action-toast" id="actionMessage"></div>
                    </div>

                    <div class="two-col">
                    <div class="stack">

                    <!-- ===== Section 3: Financial Overview ===== -->
                    <div class="section-pad" style="padding-top:0;">
                        <div class="kpi-grid" id="kpiGrid">
                            <div class="card kpi-card">
                                <p class="kpi-label">รายรับ</p>
                                <p class="kpi-value" id="kpiIncome">0</p>
                                <span class="kpi-trend flat" id="kpiIncomeTrend">–</span>
                                <canvas class="kpi-spark" id="sparkIncome"></canvas>
                            </div>
                            <div class="card kpi-card">
                                <p class="kpi-label">รายจ่าย</p>
                                <p class="kpi-value" id="kpiExpense">0</p>
                                <span class="kpi-trend flat" id="kpiExpenseTrend">–</span>
                                <canvas class="kpi-spark" id="sparkExpense"></canvas>
                            </div>
                            <div class="card kpi-card">
                                <p class="kpi-label">กำไร</p>
                                <p class="kpi-value" id="kpiProfit">0</p>
                                <span class="kpi-trend flat" id="kpiProfitTrend">–</span>
                                <canvas class="kpi-spark" id="sparkProfit"></canvas>
                            </div>
                            <div class="card kpi-card">
                                <p class="kpi-label">คงเหลือสะสม</p>
                                <p class="kpi-value" id="kpiBalance">0</p>
                                <span class="kpi-trend flat" id="kpiBalanceTrend">ในช่วงที่เลือก</span>
                                <canvas class="kpi-spark" id="sparkBalance"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- ===== Section 7: Cash Flow ===== -->
                    <div class="section-pad">
                        <div class="card" style="padding:20px;">
                            <div class="section-title-row">
                                <div>
                                    <p class="section-title">กระแสเงินสด</p>
                                    <p class="section-hint">รายรับหักรายจ่ายรายวัน</p>
                                </div>
                            </div>
                            <div class="chart-canvas-wrap" id="cashFlowWrap">
                                <canvas id="cashFlowChart"></canvas>
                            </div>
                            <div class="chart-stat-row" id="cashFlowStats"></div>
                        </div>
                    </div>

                    <!-- ===== Section 10: Profit Trend ===== -->
                    <div class="section-pad">
                        <div class="card" style="padding:20px;">
                            <div class="section-title-row">
                                <div>
                                    <p class="section-title">แนวโน้มกำไร</p>
                                    <p class="section-hint">กำไรรายเดือน ย้อนหลัง 6 เดือน</p>
                                </div>
                            </div>
                            <div class="chart-canvas-wrap" id="profitTrendWrap">
                                <canvas id="profitTrendChart"></canvas>
                            </div>
                        </div>
                    </div>

                    </div>
                    <div class="stack">

                    <!-- ===== Section 4: Farm Health Score ===== -->
                    <div class="section-pad" style="padding-top:0;">
                        <div class="card health-card" id="healthCard">
                            <div class="health-top">
                                <div class="health-ring-wrap">
                                    <svg width="84" height="84" viewBox="0 0 84 84">
                                        <circle cx="42" cy="42" r="36" fill="none" stroke="rgba(34,51,68,0.08)" stroke-width="8"></circle>
                                        <circle id="healthRingFg" cx="42" cy="42" r="36" fill="none" stroke="#2F6F57" stroke-width="8" stroke-linecap="round" stroke-dasharray="226" stroke-dashoffset="226"></circle>
                                    </svg>
                                    <div class="health-score-num" id="healthScoreNum">–</div>
                                </div>
                                <div>
                                    <span class="health-badge" id="healthBadge">กำลังประเมิน</span>
                                    <p class="section-hint" id="healthSummary">คะแนนสุขภาพฟาร์มโดยรวม</p>
                                </div>
                            </div>
                            <ul class="health-reasons" id="healthReasons"></ul>
                        </div>
                    </div>

                    <!-- ===== Section 5: Season Timeline ===== -->
                    <div class="section-pad">
                        <div class="card" style="padding:20px;">
                            <div class="section-title-row">
                                <div>
                                    <p class="section-title">ปฏิทินฤดูกาลเพาะปลูก</p>
                                    <p class="section-hint">แนวทางทั่วไปตามช่วงเวลาของปี</p>
                                </div>
                            </div>
                            <div class="timeline-scroll" id="seasonTimeline"></div>
                        </div>
                    </div>

                    <!-- ===== Section 6: Smart Recommendations ===== -->
                    <div class="section-pad">
                        <div class="card" style="padding:20px;">
                            <div class="section-title-row">
                                <div>
                                    <p class="section-title">คำแนะนำสำหรับคุณ</p>
                                    <p class="section-hint">เรียงตามความสำคัญ</p>
                                </div>
                            </div>
                            <div class="rec-list" id="recList"></div>
                        </div>
                    </div>

                    <!-- ===== Section 8: Expense Analysis ===== -->
                    <div class="section-pad">
                        <div class="card" style="padding:20px;">
                            <div class="section-title-row">
                                <div>
                                    <p class="section-title">วิเคราะห์รายจ่าย</p>
                                    <p class="section-hint">แยกตามหมวดหมู่ เรียงจากมากไปน้อย</p>
                                </div>
                            </div>
                            <div class="expense-bars" id="expenseBars"></div>
                        </div>
                    </div>

                    <!-- ===== Section 9: Top Cost Driver ===== -->
                    <div class="section-pad">
                        <div class="card" id="driverCardOuter">
                            <div class="driver-card">
                                <div class="driver-icon" id="driverIcon">💰</div>
                                <div style="flex:1; min-width:0;">
                                    <p class="driver-name" id="driverName">–</p>
                                    <p class="driver-value" id="driverValue">–</p>
                                </div>
                                <span class="driver-share" id="driverShare">–</span>
                            </div>
                            <p class="driver-note" id="driverNote">กำลังวิเคราะห์ต้นทุนหลักของฟาร์ม...</p>
                        </div>
                    </div>

                    </div>
                    </div>

                    <!-- ===== Section 11: Recent Transactions ===== -->
                    <div class="section-pad">
                        <div class="card" style="padding:20px;">
                            <div class="section-title-row">
                                <div>
                                    <p class="section-title">รายการล่าสุด</p>
                                    <p class="section-hint">20 รายการล่าสุด</p>
                                </div>
                            </div>
                            <input class="tx-search" id="txSearch" type="text" placeholder="ค้นหาหมวดหมู่หรือโน้ต..." />
                            <div class="tx-list" id="txList"></div>
                        </div>
                    </div>

                </div>

                <script>
                    var LIFF_ID = ${JSON.stringify(liffId)};
                    var currentUserId = null;
                    var currentDays = 30;
                    var charts = { cashFlow: null, profitTrend: null, sparkIncome: null, sparkExpense: null, sparkProfit: null, sparkBalance: null };
                    var state = { recent: [], daily: [], dailyPrev: [], category: [], monthly: [] };

                    /* ===================== Utilities ===================== */

                    function formatCurrency(value) {
                        var n = Number(value || 0);
                        return n.toLocaleString('th-TH', { maximumFractionDigits: 0 }) + ' บาท';
                    }

                    function formatCompact(value) {
                        var n = Number(value || 0);
                        return n.toLocaleString('th-TH', { maximumFractionDigits: 0 });
                    }

                    function formatType(type) {
                        if (type === 'income') return 'รายรับ';
                        if (type === 'expense') return 'รายจ่าย';
                        return type || '-';
                    }

                    function sumField(items, field) {
                        return (items || []).reduce(function (sum, item) {
                            return sum + Number(item[field] || 0);
                        }, 0);
                    }

                    function computeTrendPct(current, previous) {
                        if (!previous || previous === 0) {
                            if (!current || current === 0) return null;
                            return null;
                        }
                        return ((current - previous) / Math.abs(previous)) * 100;
                    }

                    function trendClass(pct, invert) {
                        if (pct === null || pct === undefined || isNaN(pct)) return 'flat';
                        var positive = invert ? pct < 0 : pct > 0;
                        var negative = invert ? pct > 0 : pct < 0;
                        if (Math.abs(pct) < 1) return 'flat';
                        if (positive) return 'up';
                        if (negative) return 'down';
                        return 'flat';
                    }

                    function trendArrow(cls) {
                        if (cls === 'up') return '▲';
                        if (cls === 'down') return '▼';
                        return '•';
                    }

                    function trendLabel(pct) {
                        if (pct === null || pct === undefined || isNaN(pct)) return 'ไม่มีข้อมูลเทียบ';
                        var abs = Math.abs(pct);
                        return (pct >= 0 ? '+' : '-') + abs.toFixed(1) + '%';
                    }

                    function greetingByHour() {
                        var h = new Date().getHours();
                        if (h < 11) return 'สวัสดีตอนเช้า 👋';
                        if (h < 17) return 'สวัสดีตอนบ่าย 👋';
                        return 'สวัสดีตอนเย็น 👋';
                    }

                    function todayLabel() {
                        try {
                            return new Intl.DateTimeFormat('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
                        } catch (e) {
                            return new Date().toLocaleDateString();
                        }
                    }

                    function weatherPlaceholder() {
                        var m = new Date().getMonth() + 1;
                        if (m >= 6 && m <= 10) return '🌧️ ช่วงฤดูฝน';
                        if (m >= 3 && m <= 5) return '☀️ ช่วงฤดูร้อน';
                        return '🌤️ ช่วงฤดูหนาว';
                    }

                    function daysUntilRainySeason() {
                        var now = new Date();
                        var year = now.getFullYear();
                        var target = new Date(year, 5, 1);
                        if (now > target) target = new Date(year + 1, 5, 1);
                        var diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
                        return diff;
                    }

                    function isRainySeasonNow() {
                        var m = new Date().getMonth() + 1;
                        return m >= 6 && m <= 10;
                    }

                    var CATEGORY_ICON_MAP = [
                        { keys: ['อาหารสัตว์', 'อาหาร', 'feed'], icon: '🌾' },
                        { keys: ['ยา', 'วัคซีน', 'รักษา', 'สัตวแพทย์'], icon: '💊' },
                        { keys: ['แรงงาน', 'ค่าแรง', 'จ้าง'], icon: '👷' },
                        { keys: ['ไฟฟ้า', 'น้ำประปา', 'สาธารณูปโภค', 'ค่าน้ำ', 'ค่าไฟ'], icon: '💡' },
                        { keys: ['ปุ๋ย'], icon: '🌱' },
                        { keys: ['น้ำมัน', 'เชื้อเพลิง'], icon: '⛽' },
                        { keys: ['ขาย', 'จำหน่าย'], icon: '💰' },
                        { keys: ['ขนส่ง', 'ค่าเดินทาง'], icon: '🚚' },
                        { keys: ['ซ่อม', 'อุปกรณ์', 'เครื่องมือ'], icon: '🛠️' }
                    ];

                    function getCategoryIcon(category, type) {
                        var text = (category || '').toString();
                        for (var i = 0; i < CATEGORY_ICON_MAP.length; i++) {
                            var entry = CATEGORY_ICON_MAP[i];
                            for (var j = 0; j < entry.keys.length; j++) {
                                if (text.indexOf(entry.keys[j]) !== -1) return entry.icon;
                            }
                        }
                        return type === 'income' ? '💵' : '📦';
                    }

                    function escapeHtml(str) {
                        return (str === null || str === undefined ? '' : String(str))
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;');
                    }

                    function animateNumber(el, endValue, suffix) {
                        if (!el) return;
                        var startValue = 0;
                        var duration = 700;
                        var startTime = null;
                        function step(ts) {
                            if (!startTime) startTime = ts;
                            var progress = Math.min((ts - startTime) / duration, 1);
                            var eased = 1 - Math.pow(1 - progress, 3);
                            var current = Math.round(startValue + (endValue - startValue) * eased);
                            el.textContent = formatCompact(current) + (suffix || '');
                            if (progress < 1) {
                                window.requestAnimationFrame(step);
                            } else {
                                el.textContent = formatCompact(endValue) + (suffix || '');
                            }
                        }
                        window.requestAnimationFrame(step);
                    }

                    async function fetchJson(url) {
                        var res = await fetch(url);
                        if (!res.ok) {
                            throw new Error('HTTP ' + res.status);
                        }
                        return res.json();
                    }

                    /* ===================== Data loaders (existing APIs, unchanged) ===================== */

                    async function loadRecentTransactions() {
                        try {
                            var data = await fetchJson('/api/recent?userId=' + encodeURIComponent(currentUserId) + '&limit=20');
                            state.recent = data.items || [];
                            renderRecentList(state.recent, document.getElementById('txSearch').value || '');
                        } catch (error) {
                            console.error('loadRecentTransactions error:', error);
                            renderTxEmpty('โหลดรายการล่าสุดไม่สำเร็จ');
                        }
                    }

                    async function loadDailySummary() {
                        try {
                            var data = await fetchJson('/api/daily-summary?userId=' + encodeURIComponent(currentUserId) + '&days=' + currentDays);
                            var items = (data.items || []).slice().reverse();
                            state.daily = items;
                        } catch (error) {
                            console.error('loadDailySummary error:', error);
                            state.daily = [];
                        }

                        try {
                            var data2 = await fetchJson('/api/daily-summary?userId=' + encodeURIComponent(currentUserId) + '&days=' + (currentDays * 2));
                            var all = (data2.items || []).slice().reverse();
                            state.dailyPrev = all.length > currentDays ? all.slice(0, all.length - currentDays) : [];
                        } catch (error) {
                            console.error('loadDailySummary(prev) error:', error);
                            state.dailyPrev = [];
                        }

                        renderKpis();
                        renderCashFlowChart();
                    }

                    async function loadCategorySummary() {
                        try {
                            var data = await fetchJson('/api/category-summary?userId=' + encodeURIComponent(currentUserId));
                            state.category = data.items || [];
                        } catch (error) {
                            console.error('loadCategorySummary error:', error);
                            state.category = [];
                        }
                        renderExpenseBars();
                        renderTopCostDriver();
                        refreshInsightAndHealth();
                    }

                    async function loadMonthlySummary() {
                        try {
                            var data = await fetchJson('/api/monthly-summary?userId=' + encodeURIComponent(currentUserId) + '&months=6');
                            state.monthly = data.items || [];
                        } catch (error) {
                            console.error('loadMonthlySummary error:', error);
                            state.monthly = [];
                        }
                        renderProfitTrendChart();
                        renderSeasonTimeline();
                        refreshInsightAndHealth();
                    }

                    async function resetTodayData() {
                        var confirmed = window.confirm('ต้องการลบข้อมูลของ "วันนี้" ทั้งหมดใช่หรือไม่?');
                        if (!confirmed) return;

                        try {
                            var res = await fetch('/api/reset-today', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: currentUserId })
                            });

                            if (!res.ok) throw new Error('HTTP ' + res.status);

                            var data = await res.json();
                            showActionMessage('รีเซ็ตข้อมูลวันนี้สำเร็จ (' + Number(data.deletedCount || 0) + ' รายการ)', false);

                            await Promise.all([
                                loadRecentTransactions(),
                                loadDailySummary(),
                                loadCategorySummary(),
                                loadMonthlySummary()
                            ]);
                        } catch (error) {
                            console.error('resetTodayData error:', error);
                            showActionMessage('รีเซ็ตข้อมูลวันนี้ไม่สำเร็จ', true);
                        }
                    }

                    function showActionMessage(message, isError) {
                        var el = document.getElementById('actionMessage');
                        if (!el) return;
                        el.textContent = message || '';
                        el.style.color = isError ? '#C84B31' : '#4B8F5A';
                        if (message) {
                            setTimeout(function () { el.textContent = ''; }, 3000);
                        }
                    }

                    /* ===================== Header ===================== */

                    function renderHeader(profileName, pictureUrl) {
                        document.getElementById('greetingText').textContent = greetingByHour();
                        document.getElementById('farmName').textContent = profileName ? (profileName + ' · ฟาร์ม') : 'ฟาร์มของฉัน';
                        document.getElementById('todayDate').textContent = todayLabel();
                        document.getElementById('weatherChip').textContent = weatherPlaceholder();

                        var avatarBox = document.getElementById('avatarBox');
                        if (pictureUrl) {
                            avatarBox.innerHTML = '';
                            var img = document.createElement('img');
                            img.src = pictureUrl;
                            img.alt = profileName || 'profile';
                            img.className = 'avatar';
                            img.style.margin = '0';
                            avatarBox.replaceWith(img);
                            img.id = 'avatarBox';
                        } else if (profileName) {
                            avatarBox.textContent = profileName.charAt(0).toUpperCase();
                        }
                    }

                    /* ===================== KPI cards ===================== */

                    function renderSparkline(canvasId, values, colorVar, chartKey) {
                        var canvas = document.getElementById(canvasId);
                        if (!canvas || typeof Chart === 'undefined') return;
                        if (charts[chartKey]) charts[chartKey].destroy();
                        if (!values || values.length < 2) return;
                        charts[chartKey] = new Chart(canvas, {
                            type: 'line',
                            data: {
                                labels: values.map(function (_, i) { return i; }),
                                datasets: [{
                                    data: values,
                                    borderColor: colorVar,
                                    borderWidth: 2,
                                    tension: 0.4,
                                    fill: false,
                                    pointRadius: 0
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                animation: false,
                                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                                scales: {
                                    x: { display: false },
                                    y: { display: false }
                                }
                            }
                        });
                    }

                    function renderKpis() {
                        var daily = state.daily;
                        var prev = state.dailyPrev;

                        var income = sumField(daily, 'income');
                        var expense = sumField(daily, 'expense');
                        var profit = income - expense;

                        var incomePrev = sumField(prev, 'income');
                        var expensePrev = sumField(prev, 'expense');
                        var profitPrev = incomePrev - expensePrev;

                        var runningBalance = 0;
                        var balanceSeries = daily.map(function (item) {
                            runningBalance += Number(item.income || 0) - Number(item.expense || 0);
                            return runningBalance;
                        });

                        animateNumber(document.getElementById('kpiIncome'), income);
                        animateNumber(document.getElementById('kpiExpense'), expense);
                        animateNumber(document.getElementById('kpiProfit'), profit);
                        animateNumber(document.getElementById('kpiBalance'), runningBalance);

                        var incomePct = computeTrendPct(income, incomePrev);
                        var expensePct = computeTrendPct(expense, expensePrev);
                        var profitPct = computeTrendPct(profit, profitPrev);

                        setTrendChip('kpiIncomeTrend', incomePct, false);
                        setTrendChip('kpiExpenseTrend', expensePct, true);
                        setTrendChip('kpiProfitTrend', profitPct, false);

                        renderSparkline('sparkIncome', daily.map(function (i) { return Number(i.income || 0); }), '#2F6F57', 'sparkIncome');
                        renderSparkline('sparkExpense', daily.map(function (i) { return Number(i.expense || 0); }), '#C84B31', 'sparkExpense');
                        renderSparkline('sparkProfit', daily.map(function (i) { return Number(i.income || 0) - Number(i.expense || 0); }), '#2F6F57', 'sparkProfit');
                        renderSparkline('sparkBalance', balanceSeries, '#8C6A43', 'sparkBalance');
                    }

                    function setTrendChip(elId, pct, invert) {
                        var el = document.getElementById(elId);
                        if (!el) return;
                        var cls = trendClass(pct, invert);
                        el.className = 'kpi-trend ' + cls;
                        el.textContent = trendArrow(cls) + ' ' + trendLabel(pct) + ' เทียบช่วงก่อน';
                    }

                    /* ===================== Recent transactions ===================== */

                    function renderTxEmpty(message) {
                        var wrap = document.getElementById('txList');
                        wrap.innerHTML = '<div class="empty-state">' + escapeHtml(message) + '</div>';
                    }

                    function renderRecentList(items, filterText) {
                        var wrap = document.getElementById('txList');
                        var query = (filterText || '').trim().toLowerCase();

                        var filtered = (items || []).filter(function (item) {
                            if (!query) return true;
                            var haystack = ((item.category || '') + ' ' + (item.note || '') + ' ' + formatType(item.type)).toLowerCase();
                            return haystack.indexOf(query) !== -1;
                        });

                        if (!filtered.length) {
                            renderTxEmpty(query ? 'ไม่พบรายการที่ตรงกับ "' + filterText + '"' : 'ยังไม่มีรายการ');
                            return;
                        }

                        var rows = filtered.map(function (item) {
                            var icon = getCategoryIcon(item.category, item.type);
                            var amountClass = item.type === 'income' ? 'income' : 'expense';
                            var sign = item.type === 'income' ? '+' : '-';
                            return (
                                '<div class="tx-row">' +
                                    '<div class="tx-icon">' + icon + '</div>' +
                                    '<div class="tx-mid">' +
                                        '<p class="tx-cat">' + escapeHtml(item.category || formatType(item.type)) + '</p>' +
                                        '<p class="tx-note">' + escapeHtml(item.note || '-') + '</p>' +
                                    '</div>' +
                                    '<div class="tx-right">' +
                                        '<div class="tx-amount ' + amountClass + '">' + sign + formatCompact(item.amount) + '</div>' +
                                        '<div class="tx-date">' + escapeHtml(item.createdAt || '-') + '</div>' +
                                    '</div>' +
                                '</div>'
                            );
                        });

                        wrap.innerHTML = rows.join('');
                    }

                    /* ===================== Expense analysis (replaces donut) ===================== */

                    function getExpenseItemsSorted() {
                        var items = (state.category || []).filter(function (item) { return item.type === 'expense'; });
                        items = items.map(function (item) {
                            return { category: item.category || 'อื่นๆ', total: Number(item.total || 0) };
                        });
                        items.sort(function (a, b) { return b.total - a.total; });
                        return items;
                    }

                    function renderExpenseBars() {
                        var wrap = document.getElementById('expenseBars');
                        var items = getExpenseItemsSorted();

                        if (!items.length) {
                            wrap.innerHTML = '<div class="empty-state">ยังไม่มีข้อมูลรายจ่ายตามหมวดหมู่</div>';
                            return;
                        }

                        var total = items.reduce(function (sum, item) { return sum + item.total; }, 0) || 1;
                        var max = items[0].total || 1;

                        var rows = items.slice(0, 8).map(function (item, index) {
                            var pct = ((item.total / total) * 100).toFixed(0);
                            var widthPct = ((item.total / max) * 100).toFixed(1);
                            var fillClass = index === 0 ? 'expense-bar-fill top' : 'expense-bar-fill';
                            return (
                                '<div class="expense-row">' +
                                    '<div class="expense-row-top">' +
                                        '<span class="expense-row-name">' + escapeHtml(item.category) + '</span>' +
                                        '<span class="expense-row-value">' + formatCurrency(item.total) + ' · ' + pct + '%</span>' +
                                    '</div>' +
                                    '<div class="expense-bar-track"><div class="' + fillClass + '" style="width:' + widthPct + '%;"></div></div>' +
                                '</div>'
                            );
                        });

                        wrap.innerHTML = rows.join('');
                    }

                    function renderTopCostDriver() {
                        var items = getExpenseItemsSorted();
                        var nameEl = document.getElementById('driverName');
                        var valueEl = document.getElementById('driverValue');
                        var shareEl = document.getElementById('driverShare');
                        var noteEl = document.getElementById('driverNote');
                        var iconEl = document.getElementById('driverIcon');

                        if (!items.length) {
                            nameEl.textContent = 'ยังไม่มีข้อมูล';
                            valueEl.textContent = '-';
                            shareEl.textContent = '-';
                            noteEl.textContent = 'เมื่อมีข้อมูลรายจ่าย ระบบจะช่วยชี้เป้าต้นทุนหลักของฟาร์มให้อัตโนมัติ';
                            return;
                        }

                        var total = items.reduce(function (sum, item) { return sum + item.total; }, 0) || 1;
                        var top = items[0];
                        var pct = ((top.total / total) * 100).toFixed(0);

                        iconEl.textContent = getCategoryIcon(top.category, 'expense');
                        nameEl.textContent = top.category;
                        valueEl.textContent = formatCurrency(top.total);
                        shareEl.textContent = pct + '% ของรายจ่ายทั้งหมด';

                        if (Number(pct) >= 40) {
                            noteEl.textContent = '💡 หมวดนี้กินสัดส่วนรายจ่ายค่อนข้างสูง ลองเทียบราคาจากผู้จำหน่ายหลายราย หรือซื้อรวมล็อตใหญ่เพื่อลดต้นทุนต่อหน่วย';
                        } else if (Number(pct) >= 20) {
                            noteEl.textContent = '💡 เป็นต้นทุนหลักของฟาร์ม ควรติดตามราคาช่วงนี้อย่างใกล้ชิดเพื่อควบคุมรายจ่ายในระยะยาว';
                        } else {
                            noteEl.textContent = '💡 สัดส่วนต้นทุนยังกระจายตัวดี ไม่มีหมวดใดเสี่ยงสูงเป็นพิเศษ';
                        }
                    }

                    /* ===================== Section 7: Cash Flow chart ===================== */

                    function renderCashFlowChart() {
                        var canvas = document.getElementById('cashFlowChart');
                        var wrap = document.getElementById('cashFlowWrap');
                        var statsEl = document.getElementById('cashFlowStats');
                        if (!canvas) return;

                        var daily = state.daily || [];

                        if (!daily.length) {
                            wrap.innerHTML = '<div class="empty-state">ยังไม่มีข้อมูลกระแสเงินสดในช่วงนี้</div>';
                            statsEl.innerHTML = '';
                            return;
                        }

                        if (!document.getElementById('cashFlowChart')) {
                            wrap.innerHTML = '<canvas id="cashFlowChart"></canvas>';
                        }

                        var labels = daily.map(function (item) { return item.date || '-'; });
                        var values = daily.map(function (item) { return Number(item.income || 0) - Number(item.expense || 0); });

                        var maxVal = Math.max.apply(null, values);
                        var minVal = Math.min.apply(null, values);
                        var maxIndex = values.indexOf(maxVal);
                        var minIndex = values.indexOf(minVal);

                        var pointColors = values.map(function (_, i) {
                            if (i === maxIndex) return '#4B8F5A';
                            if (i === minIndex) return '#C84B31';
                            return 'rgba(47,111,87,0)';
                        });
                        var pointRadii = values.map(function (_, i) {
                            return (i === maxIndex || i === minIndex) ? 5 : 0;
                        });

                        if (charts.cashFlow) charts.cashFlow.destroy();

                        charts.cashFlow = new Chart(canvas, {
                            type: 'line',
                            data: {
                                labels: labels,
                                datasets: [{
                                    label: 'กระแสเงินสดรายวัน',
                                    data: values,
                                    borderColor: '#2F6F57',
                                    backgroundColor: 'rgba(47,111,87,0.10)',
                                    borderWidth: 2.5,
                                    tension: 0.4,
                                    fill: true,
                                    pointRadius: pointRadii,
                                    pointBackgroundColor: pointColors,
                                    pointBorderColor: pointColors
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        callbacks: {
                                            label: function (context) { return formatCurrency(context.raw); }
                                        }
                                    }
                                },
                                scales: {
                                    x: { grid: { display: false }, ticks: { maxTicksLimit: 6, font: { size: 11 } } },
                                    y: { grid: { color: 'rgba(34,51,68,0.06)' }, ticks: { font: { size: 11 } } }
                                }
                            }
                        });

                        statsEl.innerHTML =
                            '<span class="chart-stat peak">จุดสูงสุด <b>' + formatCurrency(maxVal) + '</b> (' + escapeHtml(labels[maxIndex]) + ')</span>' +
                            '<span class="chart-stat low">จุดต่ำสุด <b>' + formatCurrency(minVal) + '</b> (' + escapeHtml(labels[minIndex]) + ')</span>' +
                            '<span class="chart-stat">เดือนปัจจุบัน <b>' + escapeHtml(labels[labels.length - 1]) + '</b></span>';
                    }

                    /* ===================== Section 10: Profit trend chart ===================== */

                    function renderProfitTrendChart() {
                        var canvas = document.getElementById('profitTrendChart');
                        var wrap = document.getElementById('profitTrendWrap');
                        if (!canvas) return;

                        var monthly = state.monthly || [];

                        if (!monthly.length) {
                            wrap.innerHTML = '<div class="empty-state">ยังไม่มีข้อมูลรายเดือนเพียงพอสำหรับแสดงแนวโน้ม</div>';
                            return;
                        }

                        if (!document.getElementById('profitTrendChart')) {
                            wrap.innerHTML = '<canvas id="profitTrendChart"></canvas>';
                        }

                        var labels = monthly.map(function (item) { return item.month || '-'; });
                        var values = monthly.map(function (item) { return Number(item.income || 0) - Number(item.expense || 0); });

                        if (charts.profitTrend) charts.profitTrend.destroy();

                        charts.profitTrend = new Chart(canvas, {
                            type: 'line',
                            data: {
                                labels: labels,
                                datasets: [{
                                    label: 'กำไรรายเดือน',
                                    data: values,
                                    borderColor: '#2F6F57',
                                    borderWidth: 2.5,
                                    tension: 0.35,
                                    fill: false,
                                    pointRadius: 4,
                                    pointBackgroundColor: values.map(function (v) { return v >= 0 ? '#4B8F5A' : '#C84B31'; }),
                                    pointBorderColor: values.map(function (v) { return v >= 0 ? '#4B8F5A' : '#C84B31'; }),
                                    segment: {
                                        borderColor: function (ctx) {
                                            var y0 = ctx.p0.parsed.y;
                                            var y1 = ctx.p1.parsed.y;
                                            return (y0 >= 0 && y1 >= 0) ? '#4B8F5A' : ((y0 < 0 && y1 < 0) ? '#C84B31' : '#C89B3C');
                                        }
                                    }
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        callbacks: {
                                            label: function (context) { return formatCurrency(context.raw); }
                                        }
                                    }
                                },
                                scales: {
                                    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                                    y: {
                                        grid: { color: 'rgba(34,51,68,0.06)' },
                                        ticks: { font: { size: 11 } }
                                    }
                                }
                            }
                        });
                    }

                    /* ===================== Section 5: Season timeline ===================== */

                    var SEASON_GUIDE = [
                        { icon: '🧑‍🌾', stage: 'เตรียมดิน' },
                        { icon: '🌱', stage: 'เพาะกล้า' },
                        { icon: '🌾', stage: 'เริ่มปลูก' },
                        { icon: '💧', stage: 'รดน้ำ/ดูแล' },
                        { icon: '🌿', stage: 'ใส่ปุ๋ย' },
                        { icon: '🌧️', stage: 'ระวังฝน' },
                        { icon: '🌦️', stage: 'ดูแลต่อเนื่อง' },
                        { icon: '🌦️', stage: 'ดูแลต่อเนื่อง' },
                        { icon: '🌾', stage: 'เตรียมเก็บเกี่ยว' },
                        { icon: '🌾', stage: 'เก็บเกี่ยว' },
                        { icon: '💰', stage: 'เก็บเกี่ยว/ขาย' },
                        { icon: '📋', stage: 'พักฟาร์ม/วางแผน' }
                    ];

                    var MONTH_LABELS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

                    function renderSeasonTimeline() {
                        var wrap = document.getElementById('seasonTimeline');
                        var currentMonth = new Date().getMonth();

                        var cells = SEASON_GUIDE.map(function (item, index) {
                            var isActive = index === currentMonth;
                            return (
                                '<div class="timeline-month' + (isActive ? ' active' : '') + '">' +
                                    '<div class="tm-icon">' + item.icon + '</div>' +
                                    '<div class="tm-month">' + MONTH_LABELS_TH[index] + '</div>' +
                                    '<div class="tm-stage">' + item.stage + '</div>' +
                                '</div>'
                            );
                        });

                        wrap.innerHTML = cells.join('');

                        setTimeout(function () {
                            var activeEl = wrap.querySelector('.active');
                            if (activeEl && activeEl.scrollIntoView) {
                                activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                            }
                        }, 50);
                    }

                    /* ===================== Section 2 + 4: AI insight & Farm Health Score ===================== */
                    /* Rule-based, computed entirely from data already returned by the existing APIs. */

                    function computeMetrics() {
                        var income = sumField(state.daily, 'income');
                        var expense = sumField(state.daily, 'expense');
                        var profit = income - expense;
                        var incomePrev = sumField(state.dailyPrev, 'income');
                        var expensePrev = sumField(state.dailyPrev, 'expense');
                        var profitPrev = incomePrev - expensePrev;

                        var incomePct = computeTrendPct(income, incomePrev);
                        var expensePct = computeTrendPct(expense, expensePrev);
                        var profitPct = computeTrendPct(profit, profitPrev);

                        var expenseItems = getExpenseItemsSorted();
                        var expenseTotal = expenseItems.reduce(function (s, i) { return s + i.total; }, 0) || 1;
                        var topExpense = expenseItems[0] || null;
                        var topExpenseShare = topExpense ? (topExpense.total / expenseTotal) * 100 : 0;

                        var profitMargin = income > 0 ? (profit / income) * 100 : null;

                        return {
                            income: income, expense: expense, profit: profit,
                            incomePct: incomePct, expensePct: expensePct, profitPct: profitPct,
                            topExpense: topExpense, topExpenseShare: topExpenseShare,
                            profitMargin: profitMargin
                        };
                    }

                    function refreshInsightAndHealth() {
                        if (!state.daily.length && !state.category.length && !state.monthly.length) return;
                        var metrics = computeMetrics();
                        renderInsight(metrics);
                        renderHealthScore(metrics);
                        renderRecommendations(metrics);
                    }

                    function renderInsight(m) {
                        var iconEl = document.getElementById('insightIcon');
                        var titleEl = document.getElementById('insightTitle');
                        var subEl = document.getElementById('insightSubtitle');

                        if (m.expensePct !== null && m.expensePct >= 15) {
                            iconEl.textContent = '🌱';
                            titleEl.textContent = 'รายจ่ายเพิ่มขึ้น ' + m.expensePct.toFixed(0) + '% เทียบช่วงก่อนหน้า';
                            var topName = m.topExpense ? m.topExpense.category : 'บางหมวดหมู่';
                            subEl.textContent = 'ส่วนใหญ่มาจาก ' + topName + ' ลองตรวจสอบราคาผู้จำหน่ายเพื่อควบคุมต้นทุน';
                            return;
                        }

                        if (m.incomePct !== null && m.incomePct >= 10) {
                            iconEl.textContent = '📈';
                            titleEl.textContent = 'รายรับเพิ่มขึ้น ' + m.incomePct.toFixed(0) + '% เทียบช่วงก่อนหน้า';
                            subEl.textContent = 'ผลงานฟาร์มดีขึ้นต่อเนื่อง ลองรักษาจังหวะนี้ไว้';
                            return;
                        }

                        if (m.profitPct !== null && m.profitPct <= -15) {
                            iconEl.textContent = '⚠️';
                            titleEl.textContent = 'กำไรลดลง ' + Math.abs(m.profitPct).toFixed(0) + '% เทียบช่วงก่อนหน้า';
                            subEl.textContent = 'ควรตรวจสอบทั้งฝั่งรายรับและรายจ่ายเพื่อหาสาเหตุ';
                            return;
                        }

                        if (isRainySeasonNow()) {
                            iconEl.textContent = '🌧️';
                            titleEl.textContent = 'อยู่ในช่วงฤดูฝน';
                            subEl.textContent = 'เตรียมระบบระบายน้ำและตรวจสอบสต๊อกปุ๋ยให้พร้อม';
                            return;
                        }

                        var daysLeft = daysUntilRainySeason();
                        if (daysLeft <= 30) {
                            iconEl.textContent = '🌧️';
                            titleEl.textContent = 'ฤดูฝนจะเริ่มในอีก ' + daysLeft + ' วัน';
                            subEl.textContent = 'เตรียมปุ๋ยและวัสดุการเกษตรล่วงหน้าเพื่อไม่ให้ขาดช่วง';
                            return;
                        }

                        iconEl.textContent = '✅';
                        titleEl.textContent = 'สถานะฟาร์มโดยรวมคงที่';
                        subEl.textContent = 'ไม่มีความผิดปกติที่ควรกังวลในช่วงนี้ ดำเนินงานตามปกติได้เลย';
                    }

                    function renderHealthScore(m) {
                        var score = 60;

                        if (m.profitMargin !== null) {
                            score += Math.max(-20, Math.min(20, m.profitMargin / 2));
                        }
                        if (m.profitPct !== null) {
                            score += Math.max(-15, Math.min(15, m.profitPct / 3));
                        }
                        if (m.topExpenseShare) {
                            score -= Math.max(0, Math.min(15, (m.topExpenseShare - 30) / 3));
                        }
                        score = Math.round(Math.max(0, Math.min(100, score)));

                        var badge = 'ต้องปรับปรุง';
                        var badgeColor = '#C84B31';
                        var badgeBg = 'rgba(200,75,49,0.12)';
                        if (score >= 80) { badge = 'ดีเยี่ยม'; badgeColor = '#4B8F5A'; badgeBg = 'rgba(75,143,90,0.12)'; }
                        else if (score >= 60) { badge = 'ดี'; badgeColor = '#2F6F57'; badgeBg = 'rgba(47,111,87,0.12)'; }
                        else if (score >= 40) { badge = 'พอใช้'; badgeColor = '#C89B3C'; badgeBg = 'rgba(200,155,60,0.14)'; }

                        document.getElementById('healthScoreNum').textContent = score;
                        document.getElementById('healthSummary').textContent = 'คะแนนสุขภาพฟาร์มโดยรวม จาก 100 คะแนน';

                        var badgeEl = document.getElementById('healthBadge');
                        badgeEl.textContent = score + '/100 · ' + badge;
                        badgeEl.style.color = badgeColor;
                        badgeEl.style.background = badgeBg;

                        var circumference = 226;
                        var offset = circumference - (circumference * score) / 100;
                        var ring = document.getElementById('healthRingFg');
                        ring.style.transition = 'stroke-dashoffset 0.8s ease';
                        ring.style.stroke = badgeColor;
                        ring.setAttribute('stroke-dashoffset', offset);

                        var reasons = [];
                        if (m.profitMargin !== null) {
                            reasons.push({
                                text: 'อัตรากำไร ' + m.profitMargin.toFixed(0) + '% ของรายรับในช่วงที่เลือก',
                                color: m.profitMargin >= 15 ? '#4B8F5A' : (m.profitMargin >= 0 ? '#C89B3C' : '#C84B31')
                            });
                        }
                        if (m.profitPct !== null) {
                            reasons.push({
                                text: 'กำไรเปลี่ยนแปลง ' + trendLabel(m.profitPct) + ' เทียบช่วงก่อนหน้า',
                                color: m.profitPct >= 0 ? '#4B8F5A' : '#C84B31'
                            });
                        }
                        if (m.topExpense) {
                            reasons.push({
                                text: m.topExpense.category + ' คิดเป็น ' + m.topExpenseShare.toFixed(0) + '% ของรายจ่ายทั้งหมด',
                                color: m.topExpenseShare >= 40 ? '#C84B31' : (m.topExpenseShare >= 25 ? '#C89B3C' : '#4B8F5A')
                            });
                        }
                        if (!reasons.length) {
                            reasons.push({ text: 'ยังมีข้อมูลไม่เพียงพอสำหรับวิเคราะห์แบบละเอียด', color: '#6F8F72' });
                        }

                        var list = document.getElementById('healthReasons');
                        list.innerHTML = reasons.map(function (r) {
                            return '<li><span class="dot-icon" style="background:' + r.color + ';"></span><span>' + escapeHtml(r.text) + '</span></li>';
                        }).join('');
                    }

                    function renderRecommendations(m) {
                        var recs = [];

                        if (m.topExpense && m.topExpenseShare >= 25) {
                            recs.push({
                                icon: '🌾', priority: 'high', title: 'ลดต้นทุน ' + m.topExpense.category,
                                reason: 'คิดเป็น ' + m.topExpenseShare.toFixed(0) + '% ของรายจ่ายทั้งหมด ลองเทียบราคาผู้จำหน่ายหลายราย'
                            });
                        }

                        if (m.incomePct === null || m.incomePct < 5) {
                            recs.push({
                                icon: '📣', priority: 'medium', title: 'เพิ่มช่องทางการขาย',
                                reason: 'รายรับช่วงนี้ค่อนข้างทรงตัว ลองเปิดช่องทางขายใหม่เพื่อกระจายความเสี่ยง'
                            });
                        } else {
                            recs.push({
                                icon: '📈', priority: 'low', title: 'รักษาจังหวะการขายปัจจุบัน',
                                reason: 'รายรับเติบโต ' + trendLabel(m.incomePct) + ' ต่อเนื่อง ควรคงคุณภาพและช่องทางเดิมไว้'
                            });
                        }

                        var daysLeft = daysUntilRainySeason();
                        if (isRainySeasonNow()) {
                            recs.push({
                                icon: '🌧️', priority: 'medium', title: 'ตรวจสอบระบบระบายน้ำ',
                                reason: 'อยู่ในช่วงฤดูฝน ป้องกันน้ำท่วมขังและโรคพืช/สัตว์ที่มากับความชื้น'
                            });
                        } else if (daysLeft <= 30) {
                            recs.push({
                                icon: '🌧️', priority: 'medium', title: 'เตรียมพร้อมก่อนฤดูฝน',
                                reason: 'ฤดูฝนใกล้เริ่มในอีก ' + daysLeft + ' วัน เตรียมปุ๋ยและอุปกรณ์ป้องกันน้ำล่วงหน้า'
                            });
                        } else {
                            recs.push({
                                icon: '📋', priority: 'low', title: 'ทบทวนแผนการเกษตรประจำเดือน',
                                reason: 'ใช้ช่วงเวลานี้วางแผนรอบการผลิตถัดไปให้สอดคล้องกับปฏิทินฤดูกาล'
                            });
                        }

                        var wrap = document.getElementById('recList');
                        wrap.innerHTML = recs.slice(0, 3).map(function (r) {
                            return (
                                '<div class="rec-item">' +
                                    '<div class="rec-icon">' + r.icon + '</div>' +
                                    '<div class="rec-text">' +
                                        '<span class="rec-priority ' + r.priority + '">' + (r.priority === 'high' ? 'สำคัญมาก' : r.priority === 'medium' ? 'สำคัญ' : 'แนะนำ') + '</span>' +
                                        '<p class="rec-title">' + escapeHtml(r.title) + '</p>' +
                                        '<p class="rec-reason">' + escapeHtml(r.reason) + '</p>' +
                                    '</div>' +
                                '</div>'
                            );
                        }).join('');
                    }

                    /* ===================== Events & init ===================== */

                    document.getElementById('daysSegmented').addEventListener('click', function (e) {
                        var btn = e.target.closest('button[data-days]');
                        if (!btn) return;
                        var days = Number(btn.getAttribute('data-days'));
                        if (!days || days === currentDays) return;
                        currentDays = days;

                        var buttons = document.querySelectorAll('#daysSegmented button');
                        buttons.forEach(function (b) { b.classList.remove('active'); });
                        btn.classList.add('active');

                        loadDailySummary().then(refreshInsightAndHealth);
                    });

                    document.getElementById('resetTodayBtn').addEventListener('click', function () {
                        resetTodayData();
                    });

                    document.getElementById('txSearch').addEventListener('input', function () {
                        renderRecentList(state.recent, this.value);
                    });

                    document.getElementById('notifBtn').addEventListener('click', function () {
                        showActionMessage('ยังไม่มีการแจ้งเตือนใหม่', false);
                    });

                    async function initDashboard() {
                        try {
                            await liff.init({ liffId: LIFF_ID });

                            if (!liff.isLoggedIn()) {
                                liff.login();
                                return;
                            }

                            var context = liff.getContext();
                            currentUserId = context && context.userId ? context.userId : null;

                            if (!currentUserId) {
                                document.getElementById('greetingText').textContent = 'ไม่พบผู้ใช้งาน';
                                return;
                            }

                            var profileName = null;
                            var pictureUrl = null;
                            try {
                                var profile = await liff.getProfile();
                                profileName = profile && profile.displayName ? profile.displayName : null;
                                pictureUrl = profile && profile.pictureUrl ? profile.pictureUrl : null;
                            } catch (profileError) {
                                console.error('getProfile error:', profileError);
                            }

                            renderHeader(profileName, pictureUrl);

                            await Promise.all([
                                loadRecentTransactions(),
                                loadDailySummary(),
                                loadCategorySummary(),
                                loadMonthlySummary()
                            ]);

                            refreshInsightAndHealth();
                        } catch (error) {
                            console.error('initDashboard error:', error);
                            document.getElementById('insightTitle').textContent = 'โหลดข้อมูลไม่สำเร็จ';
                            document.getElementById('insightSubtitle').textContent = 'กรุณาลองรีเฟรชหน้านี้อีกครั้ง';
                        }
                    }

                    initDashboard();
                </script>
            </body>
        </html>
    `;
}

module.exports = {
    renderDashboardPage
};
