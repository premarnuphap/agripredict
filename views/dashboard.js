function renderDashboardPage(liffId) {
    if (!liffId) {
        return `
            <html>
                <head>
                    <title>Dashboard</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        body {
                            font-family: 'Inter', -apple-system, sans-serif;
                            padding: 40px 24px;
                            background: #F5F2EA;
                            color: #223344;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                        }
                        .box {
                            max-width: 480px;
                            width: 100%;
                            background: #FAFAF8;
                            padding: 32px;
                            border-radius: 24px;
                            box-shadow: 0 8px 32px rgba(47, 111, 87, 0.05);
                            border: 1px solid rgba(111, 143, 114, 0.1);
                            text-align: center;
                        }
                        h1 {
                            font-size: 24px;
                            font-weight: 600;
                            color: #2F6F57;
                            margin-bottom: 8px;
                        }
                        .error {
                            color: #C84B31;
                            font-weight: 600;
                            margin: 20px 0;
                        }
                        p {
                            color: #6F8F72;
                            line-height: 1.5;
                        }
                    </style>
                </head>
                <body>
                    <div class="box">
                        <h1>📊 แดชบอร์ดการเงิน</h1>
                        <p class="error">Missing LIFF ID</p>
                        <p>กรุณาตั้งค่า LIFF_ID ใน server</p>
                    </div>
                </body>
            </html>
        `;
    }

    return `
        <html>
            <head>
                <title>Farm Decision Assistant</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
                <style>
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                        -webkit-tap-highlight-color: transparent;
                    }
                    body {
                        font-family: 'Inter', -apple-system, sans-serif;
                        background: #F5F2EA;
                        color: #223344;
                        line-height: 1.6;
                        padding-bottom: 60px;
                    }
                    
                    /* SECTION 1: Sticky Header */
                    .sticky-header {
                        position: sticky;
                        top: 0;
                        z-index: 100;
                        background: rgba(250, 250, 248, 0.95);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        border-bottom: 1px solid rgba(111, 143, 114, 0.1);
                        padding: 16px 20px;
                        transition: all 0.3s ease;
                    }
                    .header-content {
                        max-width: 600px;
                        margin: 0 auto;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .header-left {
                        display: flex;
                        flex-direction: column;
                    }
                    .farm-title {
                        font-size: 18px;
                        font-weight: 600;
                        color: #2F6F57;
                        letter-spacing: -0.5px;
                    }
                    .header-date {
                        font-size: 12px;
                        color: #6F8F72;
                        font-weight: 500;
                    }
                    .header-right {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    .weather-badge {
                        background: rgba(111, 143, 114, 0.1);
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 500;
                        color: #2F6F57;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }
                    .profile-avatar {
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        background: #2F6F57;
                        color: #FAFAF8;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 600;
                        font-size: 14px;
                        border: 2px solid #FAFAF8;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                    }

                    /* Main Container (Mobile First Optimized) */
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }

                    /* Interactive Greeting & Toolbar Section */
                    .welcome-banner {
                        margin-bottom: 24px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                    }
                    .greeting-title {
                        font-size: 24px;
                        font-weight: 600;
                        color: #223344;
                        letter-spacing: -0.5px;
                        line-height: 1.2;
                    }
                    .greeting-subtitle {
                        font-size: 14px;
                        color: #6F8F72;
                        margin-top: 2px;
                    }

                    /* Toolbar styling */
                    .toolbar {
                        background: #FAFAF8;
                        border-radius: 16px;
                        padding: 12px 16px;
                        margin-bottom: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                        border: 1px solid rgba(111, 143, 114, 0.1);
                    }
                    .select-wrapper {
                        position: relative;
                        flex-grow: 1;
                    }
                    .toolbar select {
                        width: 100%;
                        appearance: none;
                        background: transparent;
                        border: none;
                        outline: none;
                        font-family: 'Inter', sans-serif;
                        font-size: 14px;
                        font-weight: 600;
                        color: #2F6F57;
                        padding-right: 20px;
                        cursor: pointer;
                    }
                    .select-wrapper::after {
                        content: '▾';
                        position: absolute;
                        right: 0;
                        top: 50%;
                        transform: translateY(-50%);
                        font-size: 12px;
                        color: #2F6F57;
                        pointer-events: none;
                    }
                    .toolbar-actions {
                        display: flex;
                        gap: 8px;
                    }
                    .toolbar button {
                        border: none;
                        outline: none;
                        background: rgba(111, 143, 114, 0.1);
                        color: #2F6F57;
                        font-size: 13px;
                        font-weight: 600;
                        padding: 8px 12px;
                        border-radius: 10px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .toolbar button:active {
                        transform: scale(0.97);
                        background: rgba(111, 143, 114, 0.2);
                    }
                    .toolbar button.danger-btn {
                        background: rgba(200, 75, 49, 0.1);
                        color: #C84B31;
                    }
                    .toolbar button.danger-btn:active {
                        background: rgba(200, 75, 49, 0.2);
                    }
                    #actionMessage {
                        display: block;
                        font-size: 12px;
                        text-align: center;
                        margin-top: -16px;
                        margin-bottom: 16px;
                        font-weight: 500;
                        min-height: 18px;
                    }

                    /* Base Premium Card UI */
                    .premium-card {
                        background: #FAFAF8;
                        border-radius: 24px;
                        padding: 24px;
                        margin-bottom: 20px;
                        border: 1px solid rgba(111, 143, 114, 0.08);
                        box-shadow: 0 4px 16px rgba(47, 111, 87, 0.02);
                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                    }
                    .premium-card:active {
                        transform: scale(0.995);
                    }
                    .section-title {
                        font-size: 14px;
                        text-transform: uppercase;
                        letter-spacing: 0.8px;
                        color: #6F8F72;
                        font-weight: 600;
                        margin-bottom: 16px;
                    }

                    /* SECTION 2: AI Insight Card (HERO) */
                    .ai-hero-card {
                        background: #2F6F57;
                        color: #FAFAF8;
                        border: none;
                        position: relative;
                        overflow: hidden;
                    }
                    .ai-hero-card::after {
                        content: '';
                        position: absolute;
                        top: -50%;
                        right: -20%;
                        width: 250px;
                        height: 250px;
                        border-radius: 50%;
                        background: radial-gradient(circle, rgba(111, 143, 114, 0.2) 0%, rgba(255,255,255,0) 70%);
                        pointer-events: none;
                    }
                    .ai-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        background: rgba(250, 250, 248, 0.15);
                        padding: 4px 10px;
                        border-radius: 20px;
                        font-size: 11px;
                        font-weight: 600;
                        color: #FAFAF8;
                        margin-bottom: 16px;
                    }
                    .ai-insight-content {
                        display: flex;
                        align-items: flex-start;
                        gap: 16px;
                    }
                    .ai-emoji {
                        font-size: 28px;
                        line-height: 1;
                    }
                    .ai-text h3 {
                        font-size: 18px;
                        font-weight: 600;
                        line-height: 1.3;
                        color: #FAFAF8;
                    }
                    .ai-text p {
                        font-size: 13px;
                        color: rgba(250, 250, 248, 0.85);
                        margin-top: 4px;
                    }

                    /* SECTION 3: Financial Overview */
                    .financial-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 12px;
                        margin-bottom: 20px;
                    }
                    .kpi-card {
                        background: #FAFAF8;
                        border-radius: 20px;
                        padding: 16px;
                        border: 1px solid rgba(111, 143, 114, 0.08);
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        min-height: 110px;
                    }
                    .kpi-label {
                        font-size: 12px;
                        color: #6F8F72;
                        font-weight: 500;
                    }
                    .kpi-value {
                        font-family: 'Inter', sans-serif;
                        font-size: 18px;
                        font-weight: 700;
                        color: #223344;
                        margin: 6px 0;
                        letter-spacing: -0.5px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .kpi-trend {
                        font-size: 11px;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }
                    .kpi-trend.positive {
                        color: #4B8F5A;
                    }
                    .kpi-trend.negative {
                        color: #C84B31;
                    }

                    /* SECTION 4: Farm Health Score */
                    .health-score-layout {
                        display: flex;
                        align-items: center;
                        gap: 20px;
                    }
                    .health-score-circle {
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        border: 6px solid #4B8F5A;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        background: #FAFAF8;
                    }
                    .health-number {
                        font-size: 20px;
                        font-weight: 700;
                        color: #223344;
                        line-height: 1;
                    }
                    .health-total {
                        font-size: 10px;
                        color: #6F8F72;
                    }
                    .health-info {
                        flex-grow: 1;
                    }
                    .health-status {
                        font-size: 16px;
                        font-weight: 700;
                        color: #4B8F5A;
                    }
                    .health-explain {
                        font-size: 12px;
                        color: #6F8F72;
                        margin-top: 2px;
                    }

                    /* SECTION 5: Season Timeline */
                    .timeline-scroll {
                        overflow-x: auto;
                        scrollbar-width: none; /* Firefox */
                        display: flex;
                        gap: 8px;
                        padding-bottom: 4px;
                    }
                    .timeline-scroll::-webkit-scrollbar {
                        display: none; /* Safari/Chrome */
                    }
                    .timeline-month {
                        flex: 0 0 72px;
                        text-align: center;
                        padding: 10px 4px;
                        border-radius: 12px;
                        background: rgba(111, 143, 114, 0.05);
                        border: 1px solid transparent;
                    }
                    .timeline-month.active {
                        background: #2F6F57;
                        border-color: #2F6F57;
                    }
                    .timeline-month.active .month-name,
                    .timeline-month.active .month-stage {
                        color: #FAFAF8;
                    }
                    .month-name {
                        font-size: 12px;
                        font-weight: 600;
                        color: #223344;
                    }
                    .month-stage {
                        font-size: 9px;
                        font-weight: 500;
                        color: #6F8F72;
                        margin-top: 4px;
                    }

                    /* SECTION 6: Smart Recommendations */
                    .rec-list {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .rec-item {
                        display: flex;
                        gap: 16px;
                        padding: 16px;
                        background: rgba(111, 143, 114, 0.04);
                        border-radius: 16px;
                        border: 1px solid rgba(111, 143, 114, 0.06);
                    }
                    .rec-icon-wrapper {
                        font-size: 24px;
                        line-height: 1;
                    }
                    .rec-body {
                        flex-grow: 1;
                    }
                    .rec-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .rec-title {
                        font-size: 14px;
                        font-weight: 600;
                        color: #223344;
                    }
                    .rec-priority {
                        font-size: 10px;
                        font-weight: 600;
                        padding: 2px 8px;
                        border-radius: 10px;
                    }
                    .rec-priority.high {
                        background: rgba(200, 75, 49, 0.1);
                        color: #C84B31;
                    }
                    .rec-priority.normal {
                        background: rgba(200, 155, 60, 0.1);
                        color: #C89B3C;
                    }
                    .rec-reason {
                        font-size: 12px;
                        color: #6F8F72;
                        margin-top: 4px;
                        margin-bottom: 12px;
                    }
                    .rec-action-btn {
                        background: #2F6F57;
                        color: #FAFAF8;
                        border: none;
                        border-radius: 8px;
                        padding: 6px 12px;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        width: 100%;
                    }

                    /* SECTION 7, 8, 9, 10: Graphs & Expense Drivers */
                    .chart-container {
                        position: relative;
                        width: 100%;
                        margin-top: 12px;
                    }
                    .chart-placeholder {
                        min-height: 240px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 13px;
                        color: #6F8F72;
                        background: rgba(111, 143, 114, 0.04);
                        border-radius: 16px;
                        padding: 20px;
                        text-align: center;
                    }
                    
                    /* Custom Horizontal Bar for Expense Analysis */
                    .horizontal-bar-list {
                        display: flex;
                        flex-direction: column;
                        gap: 14px;
                    }
                    .bar-item {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    .bar-label-row {
                        display: flex;
                        justify-content: space-between;
                        font-size: 12px;
                        font-weight: 500;
                        color: #223344;
                    }
                    .bar-label-row .bar-percentage {
                        font-weight: 600;
                        color: #6F8F72;
                    }
                    .bar-track {
                        height: 8px;
                        background: rgba(111, 143, 114, 0.1);
                        border-radius: 4px;
                        overflow: hidden;
                    }
                    .bar-fill {
                        height: 100%;
                        background: #6F8F72;
                        border-radius: 4px;
                        width: 0%;
                        transition: width 0.8s cubic-bezier(0.1, 0.8, 0.3, 1);
                    }
                    .bar-item.highlight .bar-fill {
                        background: #2F6F57;
                    }
                    .bar-item.highlight .bar-label-row {
                        font-weight: 600;
                    }

                    /* SECTION 9: Top Cost Driver Card */
                    .driver-layout {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 12px;
                    }
                    .driver-name {
                        font-size: 16px;
                        font-weight: 600;
                        color: #223344;
                    }
                    .driver-val-wrap {
                        text-align: right;
                    }
                    .driver-amount {
                        font-size: 18px;
                        font-weight: 700;
                        color: #C84B31;
                    }
                    .driver-percent {
                        font-size: 11px;
                        color: #6F8F72;
                        font-weight: 500;
                    }
                    .driver-suggestion {
                        font-size: 12px;
                        color: #6F8F72;
                        background: rgba(111, 143, 114, 0.05);
                        padding: 10px 12px;
                        border-radius: 12px;
                        border-left: 3px solid #6F8F72;
                    }

                    /* SECTION 11: Recent Transactions */
                    .transaction-list {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }
                    .tx-item {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px;
                        background: #FAFAF8;
                        border-radius: 12px;
                        border: 1px solid rgba(111, 143, 114, 0.06);
                    }
                    .tx-icon {
                        width: 36px;
                        height: 36px;
                        border-radius: 10px;
                        background: rgba(111, 143, 114, 0.1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                    }
                    .tx-icon.income-tx {
                        background: rgba(75, 143, 90, 0.1);
                        color: #4B8F5A;
                    }
                    .tx-icon.expense-tx {
                        background: rgba(200, 75, 49, 0.1);
                        color: #C84B31;
                    }
                    .tx-details {
                        flex-grow: 1;
                        min-width: 0;
                    }
                    .tx-row-top {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .tx-category {
                        font-size: 13px;
                        font-weight: 600;
                        color: #223344;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .tx-amount {
                        font-size: 13px;
                        font-weight: 700;
                    }
                    .tx-amount.income-amt {
                        color: #4B8F5A;
                    }
                    .tx-amount.expense-amt {
                        color: #C84B31;
                    }
                    .tx-row-bottom {
                        display: flex;
                        justify-content: space-between;
                        font-size: 11px;
                        color: #6F8F72;
                        margin-top: 2px;
                    }
                    .tx-note {
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    /* Helper hidden input / layout logic components */
                    .hidden-input-field {
                        display: none;
                    }
                    
                    @media (min-width: 601px) {
                        body {
                            background: #F5F2EA;
                            padding-top: 20px;
                        }
                        .container {
                            background: #FAFAF8;
                            border-radius: 32px;
                            box-shadow: 0 16px 40px rgba(47, 111, 87, 0.05);
                            margin-top: 20px;
                            padding: 32px;
                            border: 1px solid rgba(111, 143, 114, 0.1);
                        }
                        .sticky-header {
                            background: transparent;
                            border: none;
                            position: static;
                            backdrop-filter: none;
                        }
                    }
                </style>
            </head>
            <body>
                <!-- SECTION 1: Sticky Header -->
                <div class="sticky-header">
                    <div class="header-content">
                        <div class="header-left">
                            <span class="farm-title">🌱 Greenacre Valley</span>
                            <span class="header-date" id="currentDateDisplay">July 2026</span>
                        </div>
                        <div class="header-right">
                            <div class="weather-badge">
                                <span>🌧</span> <span>28°C</span>
                            </div>
                            <div class="profile-avatar" id="avatarLetter">G</div>
                        </div>
                    </div>
                </div>

                <div class="container">
                    <!-- Greeting Block -->
                    <div class="welcome-banner">
                        <div>
                            <h2 class="greeting-title">Good Morning,</h2>
                            <p class="greeting-subtitle">Ready to manage your farm?</p>
                        </div>
                        <div class="hidden-input-field" id="userText">กำลังโหลด...</div>
                    </div>

                    <!-- Toolbar -->
                    <div class="toolbar">
                        <div class="select-wrapper">
                            <select id="days">
                                <option value="7">ย้อนหลัง 7 วัน</option>
                                <option value="14">ย้อนหลัง 14 วัน</option>
                                <option value="30" selected>ย้อนหลัง 30 วัน</option>
                            </select>
                        </div>
                        <div class="toolbar-actions">
                            <button type="button" id="reloadBtn">รีโหลด</button>
                            <button type="button" id="resetTodayBtn" class="danger-btn">รีเซ็ตวันนี้</button>
                        </div>
                    </div>
                    
                    <span id="actionMessage"></span>

                    <!-- SECTION 2: AI Insight Card (HERO) -->
                    <div class="premium-card ai-hero-card">
                        <div class="ai-badge">
                            <span>✨ Smart Assistant</span>
                        </div>
                        <div class="ai-insight-content">
                            <div class="ai-emoji">📈</div>
                            <div class="ai-text">
                                <h3 id="heroInsightTitle">Income increased 12%.</h3>
                                <p id="heroInsightDesc">Rainy season starts in 18 days. We suggest optimizing your fertilizer schedule to minimize soil runoff.</p>
                            </div>
                        </div>
                    </div>

                    <!-- SECTION 3: Financial Overview KPI Cards -->
                    <div class="financial-grid">
                        <div class="kpi-card">
                            <span class="kpi-label">รายรับรวม</span>
                            <span class="kpi-value" id="incomeValue">0 บาท</span>
                            <span class="kpi-trend positive">↑ 12%</span>
                        </div>
                        <div class="kpi-card">
                            <span class="kpi-label">รายจ่ายรวม</span>
                            <span class="kpi-value" id="expenseValue">0 บาท</span>
                            <span class="kpi-trend negative">↓ 8%</span>
                        </div>
                        <div class="kpi-card">
                            <span class="kpi-label">คงเหลือ</span>
                            <span class="kpi-value" id="balanceValue">0 บาท</span>
                            <span class="kpi-trend positive">↑ 15%</span>
                        </div>
                        <div class="kpi-card">
                            <span class="kpi-label">กระแสเงินสดหมุนเวียน</span>
                            <span class="kpi-value" style="font-size: 16px;">สม่ำเสมอ</span>
                            <span class="kpi-trend positive" style="color: #6F8F72;">Stable</span>
                        </div>
                    </div>

                    <!-- SECTION 4: Farm Health Score -->
                    <div class="premium-card">
                        <h3 class="section-title">Farm Health Score</h3>
                        <div class="health-score-layout">
                            <div class="health-score-circle">
                                <span class="health-number">82</span>
                                <span class="health-total">/ 100</span>
                            </div>
                            <div class="health-info">
                                <h4 class="health-status">Excellent Condition</h4>
                                <p class="health-explain">Soil moisture and financial ratios are within ideal parameters. Increase composting to further improve next month's score.</p>
                            </div>
                        </div>
                    </div>

                    <!-- SECTION 5: Season Timeline -->
                    <div class="premium-card">
                        <h3 class="section-title">Season Timeline</h3>
                        <div class="timeline-scroll">
                            <div class="timeline-month">
                                <div class="month-name">Jan</div>
                                <div class="month-stage">Prepare</div>
                            </div>
                            <div class="timeline-month">
                                <div class="month-name">Feb</div>
                                <div class="month-stage">Plant</div>
                            </div>
                            <div class="timeline-month">
                                <div class="month-name">Mar</div>
                                <div class="month-stage">Water</div>
                            </div>
                            <div class="timeline-month">
                                <div class="month-name">Apr</div>
                                <div class="month-stage">Fertilize</div>
                            </div>
                            <div class="timeline-month">
                                <div class="month-name">May</div>
                                <div class="month-stage">Water</div>
                            </div>
                            <div class="timeline-month">
                                <div class="month-name">Jun</div>
                                <div class="month-stage">Harvest</div>
                            </div>
                            <div class="timeline-month active">
                                <div class="month-name">Jul</div>
                                <div class="month-stage">Prepare</div>
                            </div>
                            <div class="timeline-month">
                                <div class="month-name">Aug</div>
                                <div class="month-stage">Plant</div>
                            </div>
                            <div class="timeline-month">
                                <div class="month-name">Sep</div>
                                <div class="month-stage">Fertilize</div>
                            </div>
                            <div class="timeline-month">
                                <div class="month-name">Oct</div>
                                <div class="month-stage">Water</div>
                            </div>
                            <div class="timeline-month">
                                <div class="month-name">Nov</div>
                                <div class="month-stage">Harvest</div>
                            </div>
                            <div class="timeline-month">
                                <div class="month-name">Dec</div>
                                <div class="month-stage">Rest</div>
                            </div>
                        </div>
                    </div>

                    <!-- SECTION 6: Smart Recommendations -->
                    <div class="premium-card">
                        <h3 class="section-title">Smart Actions</h3>
                        <div class="rec-list">
                            <div class="rec-item">
                                <div class="rec-icon-wrapper">📦</div>
                                <div class="rec-body">
                                    <div class="rec-header">
                                        <span class="rec-title">Reduce Feed Cost</span>
                                        <span class="rec-priority high">High</span>
                                    </div>
                                    <p class="rec-reason">Feed costs rose 18% this month. Negotiate batch options.</p>
                                    <button class="rec-action-btn">Compare Suppliers</button>
                                </div>
                            </div>
                            <div class="rec-item">
                                <div class="rec-icon-wrapper">💉</div>
                                <div class="rec-body">
                                    <div class="rec-header">
                                        <span class="rec-title">Prepare Livestock Vaccines</span>
                                        <span class="rec-priority high">High</span>
                                    </div>
                                    <p class="rec-reason">Seasonal wet climate coming up raises disease vulnerability.</p>
                                    <button class="rec-action-btn">Schedule Vet Visit</button>
                                </div>
                            </div>
                            <div class="rec-item">
                                <div class="rec-icon-wrapper">🚛</div>
                                <div class="rec-body">
                                    <div class="rec-header">
                                        <span class="rec-title">Expand Distribution Channels</span>
                                        <span class="rec-priority normal">Normal</span>
                                    </div>
                                    <p class="rec-reason">Harvest projections look 15% higher than previous seasons.</p>
                                    <button class="rec-action-btn">Explore B2B Portals</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SECTION 7: Cash Flow -->
                    <div class="premium-card">
                        <h3 class="section-title">Cash Flow & Daily Trends</h3>
                        <div class="chart-container">
                            <canvas id="dailyChart" style="max-height: 160px;"></canvas>
                        </div>
                    </div>

                    <!-- SECTION 8: Expense Analysis -->
                    <div class="premium-card">
                        <h3 class="section-title">Expense Analysis</h3>
                        <div id="categoryChartWrap">
                            <div class="category-canvas-wrap" style="display: none;">
                                <canvas id="categoryChart"></canvas>
                            </div>
                            <!-- Dynamic Horizontal Bar-chart rendering to replace raw doughnut style UI -->
                            <div class="horizontal-bar-list" id="customExpenseBarChart">
                                <div class="chart-placeholder">Calculating expenses...</div>
                            </div>
                        </div>
                    </div>

                    <!-- SECTION 9: Top Cost Driver -->
                    <div class="premium-card">
                        <h3 class="section-title">Top Cost Driver</h3>
                        <div class="driver-layout">
                            <span class="driver-name" id="topDriverLabel">Animal Feed</span>
                            <div class="driver-val-wrap">
                                <div class="driver-amount" id="topDriverAmount">18,400 บาท</div>
                                <div class="driver-percent" id="topDriverPercent">22% of total expenses</div>
                            </div>
                        </div>
                        <p class="driver-suggestion">💡 Feed formulations bought early next week save up to 4,200 บาท based on forecasted feed cost decreases.</p>
                    </div>

                    <!-- SECTION 10: Profit Trend -->
                    <div class="premium-card">
                        <h3 class="section-title">Monthly Comparison</h3>
                        <div class="chart-container">
                            <canvas id="monthlyChart" style="max-height: 180px;"></canvas>
                        </div>
                    </div>

                    <!-- SECTION 11: Recent Transactions -->
                    <div class="premium-card" style="margin-bottom: 0;">
                        <h3 class="section-title">Recent Transactions</h3>
                        <div class="transaction-list" id="recentTableBody">
                            <div class="chart-placeholder">กำลังโหลดข้อมูล...</div>
                        </div>
                    </div>
                </div>

                <script>
                    const LIFF_ID = ${JSON.stringify(liffId)};
                    let currentUserId = null;
                    let dailyChart = null;
                    let categoryChart = null;
                    let monthlyChart = null;

                    // Set present date elegantly
                    document.getElementById('currentDateDisplay').textContent = new Date().toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                    });

                    function formatCurrency(value) {
                        return Number(value || 0).toLocaleString('en-US') + ' บาท';
                    }

                    function formatType(type) {
                        if (type === 'income') return 'รายรับ';
                        if (type === 'expense') return 'รายจ่าย';
                        return type || '-';
                    }

                    function showActionMessage(message, isError) {
                        const el = document.getElementById('actionMessage');
                        if (!el) return;
                    
                        el.textContent = message || '';
                        el.style.color = isError ? '#C84B31' : '#4B8F5A';
                    
                        if (message) {
                            setTimeout(function() {
                                el.textContent = '';
                            }, 4000);
                        }
                    }

                    function setCategoryEmptyState(message) {
                        const barContainer = document.getElementById('customExpenseBarChart');
                        barContainer.innerHTML = \`<div class="chart-placeholder">\${message}</div>\`;
                    }

                    function resetCategoryCanvas() {
                        // Empty out list container. Actual hidden chart component persists for standard API compatibility
                        document.getElementById('customExpenseBarChart').innerHTML = '';
                    }

                    async function fetchJson(url) {
                        const res = await fetch(url);
                        if (!res.ok) {
                            throw new Error('HTTP ' + res.status);
                        }
                        return res.json();
                    }

                    // Redesign: HTML structures transformed into highly functional touch-friendly list components
                    function renderRecentTable(items) {
                        const tbody = document.getElementById('recentTableBody');

                        if (!items || items.length === 0) {
                            tbody.innerHTML = '<div class="chart-placeholder">ยังไม่มีรายการช่วงนี้</div>';
                            return;
                        }

                        tbody.innerHTML = items.map(function(item) {
                            const isIncome = item.type === 'income';
                            const symbol = isIncome ? '🌱' : '🌾';
                            const amtClass = isIncome ? 'income-amt' : 'expense-amt';
                            const typeLabel = isIncome ? '+' : '-';
                            const readableDate = item.createdAt ? item.createdAt.split(' ')[0] : '-';

                            return \`
                                <div class="tx-item">
                                    <div class="tx-icon \${isIncome ? 'income-tx' : 'expense-tx'}">
                                        \${symbol}
                                    </div>
                                    <div class="tx-details">
                                        <div class="tx-row-top">
                                            <span class="tx-category">\${item.category || item.note || '-'}</span>
                                            <span class="tx-amount \${amtClass}">\${typeLabel} \${formatCurrency(item.amount)}</span>
                                        </div>
                                        <div class="tx-row-bottom">
                                            <span class="tx-date">\${readableDate}</span>
                                            <span class="tx-note">\${item.note || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            \`;
                        }).join('');
                    }

                    async function loadRecentTransactions() {
                        const tbody = document.getElementById('recentTableBody');

                        try {
                            tbody.innerHTML = '<div class="chart-placeholder">กำลังโหลด...</div>';

                            const data = await fetchJson(
                                '/api/recent?userId=' + encodeURIComponent(currentUserId) + '&limit=20'
                            );

                            renderRecentTable(data.items || []);
                        } catch (error) {
                            console.error('loadRecentTransactions error:', error);
                            tbody.innerHTML = '<div class="chart-placeholder">โหลดข้อมูลไม่สำเร็จ</div>';
                        }
                    }

                    function renderSummary(items) {
                        const income = items.reduce(function(sum, item) {
                            return sum + Number(item.income || 0);
                        }, 0);

                        const expense = items.reduce(function(sum, item) {
                            return sum + Number(item.expense || 0);
                        }, 0);

                        const balance = income - expense;

                        document.getElementById('incomeValue').textContent = formatCurrency(income);
                        document.getElementById('expenseValue').textContent = formatCurrency(expense);
                        document.getElementById('balanceValue').textContent = formatCurrency(balance);
                    }

                    async function loadSummary() {
                        try {
                            const days = document.getElementById('days').value;

                            const data = await fetchJson(
                                '/api/daily-summary?userId=' + encodeURIComponent(currentUserId) + '&days=' + days
                            );

                            const items = data.items || [];

                            renderSummary(items);
                            renderDailyChart(items);
                        } catch (error) {
                            console.error('loadSummary error:', error);
                        }
                    }

                    async function loadCategorySummary() {
                        try {
                            resetCategoryCanvas();

                            const data = await fetchJson(
                                '/api/category-summary?userId=' + encodeURIComponent(currentUserId)
                            );

                            const items = data.items || [];
                            renderCategoryChart(items);
                        } catch (error) {
                            console.error('loadCategorySummary error:', error);
                            setCategoryEmptyState('โหลดสรุปตามหมวดหมู่ไม่สำเร็จ');
                        }
                    }

                    async function loadMonthlySummary() {
                        try {
                            const data = await fetchJson(
                                '/api/monthly-summary?userId=' + encodeURIComponent(currentUserId) + '&months=6'
                            );
                    
                            renderMonthlyChart(data.items || []);
                        } catch (error) {
                            console.error('loadMonthlySummary error:', error);
                        }
                    }

                    async function resetTodayData() {
                        const confirmed = window.confirm('ต้องการลบข้อมูลของ "วันนี้" ทั้งหมดใช่หรือไม่?');
                        if (!confirmed) {
                            return;
                        }
                    
                        try {
                            const res = await fetch('/api/reset-today', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    userId: currentUserId
                                })
                            });
                    
                            if (!res.ok) {
                                throw new Error('HTTP ' + res.status);
                            }
                    
                            const data = await res.json();
                    
                            showActionMessage(
                                'รีเซ็ตข้อมูลวันนี้สำเร็จ (' + Number(data.deletedCount || 0) + ' รายการ)',
                                false
                            );
                    
                            await loadRecentTransactions();
                            await loadSummary();
                            await loadCategorySummary();
                            await loadMonthlySummary();
                        } catch (error) {
                            console.error('resetTodayData error:', error);
                            showActionMessage('รีเซ็ตข้อมูลวันนี้ไม่สำเร็จ', true);
                        }
                    }

                    // Minimal aesthetic custom line charts
                    function renderMonthlyChart(items) {
                        const canvas = document.getElementById('monthlyChart');
                        if (!canvas) return;
                    
                        const rows = items || [];
                        const labels = rows.map(item => item.month || '-');
                        const incomeData = rows.map(item => Number(item.income || 0));
                        const expenseData = rows.map(item => Number(item.expense || 0));
                    
                        if (monthlyChart) {
                            monthlyChart.destroy();
                        }
                    
                        monthlyChart = new Chart(canvas, {
                            type: 'line',
                            data: {
                                labels: labels,
                                datasets: [
                                    {
                                        label: 'รายรับ',
                                        data: incomeData,
                                        borderColor: '#4B8F5A',
                                        backgroundColor: 'transparent',
                                        borderWidth: 2,
                                        tension: 0.3,
                                        pointRadius: 4,
                                        pointBackgroundColor: '#4B8F5A'
                                    },
                                    {
                                        label: 'รายจ่าย',
                                        data: expenseData,
                                        borderColor: '#C84B31',
                                        backgroundColor: 'transparent',
                                        borderWidth: 2,
                                        tension: 0.3,
                                        pointRadius: 4,
                                        pointBackgroundColor: '#C84B31'
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false }
                                },
                                scales: {
                                    x: { grid: { display: false } },
                                    y: {
                                        grid: { color: 'rgba(111, 143, 114, 0.05)' },
                                        ticks: { font: { size: 10 } }
                                    }
                                }
                            }
                        });
                    }

                    // Render gorgeous Horizontal Bar list + Hidden Pie canvas integration to remain compliant with background code.
                    function renderCategoryChart(items) {
                        if (!items || items.length === 0) {
                            setCategoryEmptyState('ยังไม่มีข้อมูลหมวดหมู่สำหรับวันนี้');
                            return;
                        }

                        const expenseItems = items.filter(item => item.type === 'expense');

                        if (expenseItems.length === 0) {
                            setCategoryEmptyState('ยังไม่มีข้อมูลรายจ่ายสำหรับวันนี้');
                            return;
                        }

                        resetCategoryCanvas();

                        // Update Top Cost Driver UI using real data if available
                        const sortedExpenses = [...expenseItems].sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
                        const mainDriver = sortedExpenses[0];
                        const totalExpenseSum = sortedExpenses.reduce((acc, curr) => acc + Number(curr.total || 0), 0);

                        if (mainDriver) {
                            const pct = Math.round((Number(mainDriver.total) / totalExpenseSum) * 100) || 0;
                            document.getElementById('topDriverLabel').textContent = mainDriver.category || 'อื่นๆ';
                            document.getElementById('topDriverAmount').textContent = formatCurrency(mainDriver.total);
                            document.getElementById('topDriverPercent').textContent = pct + '% ของค่าใช้จ่ายทั้งหมด';
                        }

                        // Generate beautiful production style horizontal progress bar components
                        const barListContainer = document.getElementById('customExpenseBarChart');
                        barListContainer.innerHTML = sortedExpenses.map((exp, idx) => {
                            const calculatedPct = Math.round((Number(exp.total) / totalExpenseSum) * 100) || 0;
                            const isTopCost = idx === 0;
                            return \`
                                <div class="bar-item \${isTopCost ? 'highlight' : ''}">
                                    <div class="bar-label-row">
                                        <span>\${exp.category || 'อื่นๆ'}</span>
                                        <div class="bar-percentage">
                                            <span>\${formatCurrency(exp.total)}</span> • <span>\${calculatedPct}%</span>
                                        </div>
                                    </div>
                                    <div class="bar-track">
                                        <div class="bar-fill" style="width: \${calculatedPct}%"></div>
                                    </div>
                                </div>
                            \`;
                        }).join('');

                        // Dummy instantiation to comply with external Chart variables
                        const canvas = document.getElementById('categoryChart');
                        if (categoryChart) {
                            categoryChart.destroy();
                        }
                        categoryChart = new Chart(canvas, {
                            type: 'doughnut',
                            data: { labels: [], datasets: [{ data: [] }] },
                            options: { responsive: false }
                        });
                    }

                    function renderDailyChart(items) {
                        const canvas = document.getElementById('dailyChart');
                        if (!canvas) return;

                        const sortedItems = (items || []).slice().reverse();
                        const labels = sortedItems.map(item => item.date || '-');
                        const incomeData = sortedItems.map(item => Number(item.income || 0));
                        const expenseData = sortedItems.map(item => Number(item.expense || 0));

                        if (dailyChart) {
                            dailyChart.destroy();
                        }

                        dailyChart = new Chart(canvas, {
                            type: 'line',
                            data: {
                                labels: labels,
                                datasets: [
                                    {
                                        label: 'รายรับ',
                                        data: incomeData,
                                        borderColor: '#4B8F5A',
                                        backgroundColor: 'rgba(75, 143, 90, 0.05)',
                                        fill: true,
                                        tension: 0.4,
                                        borderWidth: 2,
                                        pointRadius: 0
                                    },
                                    {
                                        label: 'รายจ่าย',
                                        data: expenseData,
                                        borderColor: '#C84B31',
                                        backgroundColor: 'rgba(200, 75, 49, 0.05)',
                                        fill: true,
                                        tension: 0.4,
                                        borderWidth: 2,
                                        pointRadius: 0
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false }
                                },
                                scales: {
                                    x: { grid: { display: false } },
                                    y: {
                                        grid: { color: 'rgba(111, 143, 114, 0.05)' },
                                        ticks: { font: { size: 10 } }
                                    }
                                }
                            }
                        });
                    }

                    async function initDashboard() {
                        try {
                            await liff.init({ liffId: LIFF_ID });

                            if (!liff.isLoggedIn()) {
                                liff.login();
                                return;
                            }

                            const context = liff.getContext();
                            currentUserId = context && context.userId ? context.userId : null;

                            if (!currentUserId) {
                                document.getElementById('userText').textContent = 'ไม่พบ userId จาก LIFF';
                                return;
                            }

                            document.getElementById('userText').textContent = 'userId: ' + currentUserId;
                            
                            // Customize user avatar letter based on identity
                            if (currentUserId && currentUserId.length > 0) {
                                document.getElementById('avatarLetter').textContent = currentUserId.substring(0, 1).toUpperCase();
                            }

                            await loadRecentTransactions();
                            await loadSummary();
                            await loadCategorySummary();
                            await loadMonthlySummary();
                        } catch (error) {
                            console.error('initDashboard error:', error);
                            document.getElementById('userText').textContent = 'โหลด LIFF ไม่สำเร็จ';
                        }
                    }

                    document.getElementById('reloadBtn').addEventListener('click', function() {
                        loadRecentTransactions();
                        loadSummary();
                        loadCategorySummary();
                        loadMonthlySummary();
                    });

                    document.getElementById('days').addEventListener('change', function() {
                        loadSummary();
                    });

                    document.getElementById('resetTodayBtn').addEventListener('click', function() {
                        resetTodayData();
                    });

                    initDashboard();
                </script>
            </body>
        </html>
    `;
}

module.exports = {
    renderDashboardPage
};
