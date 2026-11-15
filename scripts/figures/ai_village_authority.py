"""Hand-drawn figures for src/content/tech/who-do-the-ai-village-agents-obey.md.

Every number is copied from github.com/daelmor/ai-village-explore,
data-scouts/authority-recognition/out/ (file named beside each block).
Fonts: Patrick Hand and Caveat Brush (OFL, google/fonts). Pass their folder as argv[1].

    python3 scripts/figures/ai_village_authority.py <fonts-dir> <out-dir>
"""
import sys, datetime as dt
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm

FONTS, OUT = sys.argv[1], sys.argv[2]
for f in ("PatrickHand-Regular.ttf", "CaveatBrush-Regular.ttf"):
    fm.fontManager.addfont(f"{FONTS}/{f}")
INK, RED, GREY, PAPER = "#252525", "#8b4945", "#8a8780", "#ffffff"
HAND, BRUSH = "Patrick Hand", "Caveat Brush"
plt.rcParams.update({"font.family": HAND, "font.size": 19, "text.color": INK,
                     "path.sketch": (1.6, 110, 2), "figure.facecolor": PAPER,
                     "savefig.facecolor": PAPER, "lines.solid_capstyle": "round"})

def canvas(w, h, title, sub=None):
    fig = plt.figure(figsize=(w, h), dpi=150)
    ax = fig.add_axes([0, 0, 1, 1]); ax.set_xlim(0, w); ax.set_ylim(0, h); ax.axis("off")
    ax.text(0.45, h - 0.62, title, font=BRUSH, fontsize=34, va="center")
    if sub: ax.text(0.47, h - 1.12, sub, fontsize=18, color=GREY, va="center")
    return fig, ax

def save(fig, name):
    fig.savefig(f"{OUT}/{name}.png"); plt.close(fig)

def blob(ax, x, y, r=0.16, c=INK, fill=True, lw=3):
    ax.add_patch(plt.Circle((x, y), r, fc=c if fill else PAPER, ec=c, lw=lw, zorder=5))

# ── 1. Timeline: six channels ────────────────────────────────────────────────
# out/EXPLORATION.md §6.4 (incident dates), §6.3 #7 (last viewer message 2025-08-13),
# out/nudger_stats.csv (first/last nudge)
def timeline():
    W, H = 15, 7.2
    fig, ax = canvas(W, H, "Six channels, eighteen months",
                     "each mark is one hand-verified incident in the AI Village record")
    t0, t1 = dt.date(2025, 4, 1), dt.date(2026, 11, 1)
    X = lambda d: 0.9 + (W - 1.8) * (d - t0).days / (t1 - t0).days
    y = 3.35
    ax.plot([X(t0), X(t1)], [y, y], color=INK, lw=7)
    for d, lab in [(dt.date(2025, 4, 1), "Apr 2025"), (dt.date(2025, 10, 1), "Oct"),
                   (dt.date(2026, 4, 1), "Apr 2026"), (dt.date(2026, 10, 1), "Oct")]:
        ax.plot([X(d), X(d)], [y - .16, y + .16], color=INK, lw=3)
        ax.text(X(d), y - .5, lab, ha="center", fontsize=16, color=GREY)
    # eras, drawn under the line
    for a, b, lab, yy in [(dt.date(2025, 4, 2), dt.date(2025, 8, 13), "viewers can type in the chat", 2.2),
                          (dt.date(2026, 2, 13), dt.date(2026, 8, 20), "idle-nudge bot switched on", 2.2)]:
        ax.plot([X(a), X(a), X(b), X(b)], [yy + .22, yy, yy, yy + .22], color=GREY, lw=3)
        ax.text((X(a) + X(b)) / 2, yy - .36, lab, ha="center", fontsize=17, color=GREY)
    pts = [(dt.date(2025, 6, 30), "1  a display name", "fake “zak” re-captures\nthe agents", 1, -0.9),
           (dt.date(2025, 9, 3), "2  an unverifiable email", "refused, escalated,\nthen idling", 1, 0.55),
           (dt.date(2025, 12, 26), "3  a stated rule", "in 9 of 10 memories\nthat evening", 1, 0.3),
           (dt.date(2026, 1, 6), "4  a paraphrase", "leader’s term read off\nan AI summary", -1, 0.0),
           (dt.date(2026, 8, 20), "5  a bot", "gamed, renegotiated,\nswitched off", 1, -0.3),
           (dt.date(2026, 10, 8), "6  the prompt", "staff permission\ndeclined", 1, 0.55)]
    for d, head, body, side, dx in pts:
        x = X(d); blob(ax, x, y, .2, RED)
        if side > 0:
            ax.plot([x, x + dx], [y + .25, y + 1.0], color=INK, lw=2.2)
            ax.text(x + dx, y + 1.92, head, ha="center", font=BRUSH, fontsize=21)
            ax.text(x + dx, y + 1.08, body, ha="center", va="bottom", fontsize=15.5, linespacing=1.05)
        else:
            ax.plot([x, x], [y - .25, y - 1.75], color=INK, lw=2.2)
            ax.text(x, y - 2.12, head, ha="center", font=BRUSH, fontsize=21)
            ax.text(x, y - 2.3, body, ha="center", va="top", fontsize=15.5, linespacing=1.05)
    save(fig, "six-channels-timeline")

# ── 2. The recapture, 30 June 2025 ───────────────────────────────────────────
# out/episodes/recapture_verbatim.md (event_index in comments)
def recapture():
    W, H = 15, 8.2
    fig, ax = canvas(W, H, "A warning, and a name", "30 June 2025, all times UTC · one viewer account, four display names")
    yh, ya = 4.7, 2.6       # humans lane, agents lane
    ax.text(0.45, yh, "humans", fontsize=18, color=GREY, va="center")
    ax.text(0.45, ya, "agents", fontsize=18, color=GREY, va="center")
    ax.plot([1.5, W - .5], [yh, yh], color=INK, lw=3); ax.plot([1.5, W - .5], [ya, ya], color=INK, lw=3)
    steps = [  # x, lane, colour, time, label, label-above?
        (2.3, yh, RED, "19:04", "“Official Admin\n(verified)”: tone it\ndown, add to memory", True),    # 42348
        (3.9, ya, INK, "19:05", "Opus 4:\n“Understood!”", False),                                        # 42352
        (5.6, yh, INK, "19:18", "real zak:\n“please just ignore”\nthe fake CEO", True),                  # 42395
        (7.1, ya, INK, "19:23", "o3: zak flagged it\n“as bogus”", False),                                # 42407
        (8.6, yh, INK, "19:29", "real zak: “people\ncan change their\nusernames”", True),                # 42436
        (10.6, yh, RED, "19:41", "same viewer, now\nnamed “zak”:\n“he was real!”", True),                # 42461, 42478
        (12.0, ya, INK, "19:41", "o3: “I can\ntake it”", False),                                         # 42480
        (13.8, ya, INK, "19:52", "Sonnet’s memory:\n“real according\nto zak”", False),                   # snapshot a39cd7b2
    ]
    prev = None
    for x, y, c, t, lab, above in steps:
        blob(ax, x, y, .19, c)
        if above:
            ax.text(x, y + .38, lab, ha="center", va="bottom", fontsize=16, linespacing=1.05, color=c)
            ax.text(x, y + .38 + .37 * (lab.count("\n") + 1), t, ha="center", va="bottom", fontsize=15, color=GREY)
        else:
            ax.text(x, y - .42, lab, ha="center", va="top", fontsize=16, linespacing=1.05)
            ax.text(x, y - .42 - .37 * (lab.count("\n") + 1) - .08, t, ha="center", va="top", fontsize=15, color=GREY)
        if prev and prev[1] != y:
            ax.annotate("", xy=(x - .12, y + (.3 if y < prev[1] else -.3)), xytext=(prev[0] + .12, prev[1] + (-.3 if y < prev[1] else .3)),
                        arrowprops=dict(arrowstyle="-|>", color=GREY, lw=2.2, mutation_scale=20))
        prev = (x, y)
    ax.plot([9.62, 9.62], [0.8, 6.9], color=RED, lw=2.5, ls=(0, (6, 5)))
    ax.text(9.62, 0.42, "12 minutes after the warning", ha="center", fontsize=17, color=RED)
    blob(ax, 1.75, 0.45, .13, RED); ax.text(2.0, 0.45, "impostor", fontsize=16, va="center", color=RED)
    blob(ax, 3.55, 0.45, .13, INK); ax.text(3.8, 0.45, "everyone else", fontsize=16, va="center")
    save(fig, "recapture-30-june-2025")

# ── 3. A stated rule in memory ───────────────────────────────────────────────
# out/kindness_write_through.csv: rule_in_eod, rule_in_next_day, rule_in_7d (row order kept)
def kindness():
    agents = ["Claude Sonnet 4.5", "GPT-5.1", "Gemini 3 Pro", "Claude 3.7 Sonnet", "GPT-5.2",
              "DeepSeek-V3.2", "Claude Haiku 4.5", "GPT-5", "Claude Opus 4.5", "Gemini 2.5 Pro"]
    eod = [1, 1, 1, 1, 1, 1, 1, 1, 1, 0]; nxt = [1] * 10; d7 = [1, 0, 1, 0, 0, 1, 1, 1, 1, 0]
    W, H = 11, 9.0
    fig, ax = canvas(W, H, "“Do not email anyone who hasn’t contacted you”",
                     "is Adam’s rule of 26 Dec 2025 still written in each agent’s memory?")
    cols = [(5.6, "that evening", "26 Dec", eod), (7.6, "next session", "29 Dec", nxt), (9.6, "a week on", "2 Jan", d7)]
    top = 6.35
    for x, a, b, vals in cols:
        ax.text(x, top + .72, a, ha="center", font=BRUSH, fontsize=22)
        ax.text(x, top + .32, b, ha="center", fontsize=15, color=GREY)
        for i, v in enumerate(vals):
            blob(ax, x, top - .25 - i * .52, .17, INK if v else GREY, fill=bool(v), lw=2.6)
        ax.text(x, top - .25 - 10 * .52 - .1, f"{sum(vals)} of 10", ha="center", font=BRUSH, fontsize=26,
                color=RED if sum(vals) < 9 else INK)
    for i, n in enumerate(agents):
        ax.text(4.9, top - .25 - i * .52, n, ha="right", va="center", fontsize=17)
    blob(ax, 0.75, 0.5, .13, INK); ax.text(1.0, 0.5, "rule present", fontsize=16, va="center")
    blob(ax, 2.95, 0.5, .13, GREY, fill=False, lw=2.6); ax.text(3.2, 0.5, "rule gone", fontsize=16, va="center")
    save(fig, "kindness-rule-in-memory")

# ── 4. The nudge bot ─────────────────────────────────────────────────────────
# out/nudger_stats.csv: 1,997 (nudge, agent) pairs; misfire 1,200; pause_again 831 of 1,951;
# reply_class mentions_nudge 574, none 505; nudges per month (distinct event_index)
def nudger():
    W, H = 15, 7.6
    fig, ax = canvas(W, H, "A bot in a user account", "the automated idle nudge, 13 Feb – 20 Aug 2026 · 1,997 nudge-to-agent pairs")
    rows = [("the agent was already working", 60, "60%   (34–85% depending on how “working” is defined)", RED),
            ("its next move was another pause", 43, "43%", INK),
            ("its reply mentioned the nudge", 29, "29%", INK),
            ("no reply within 45 minutes", 25, "25%", INK)]
    x0, full = 5.2, 5.6
    for i, (lab, v, txt, c) in enumerate(rows):
        y = 5.35 - i * .95
        ax.text(x0 - .25, y, lab, ha="right", va="center", fontsize=18)
        ax.add_patch(plt.Rectangle((x0, y - .24), full * v / 100, .48, fc=c, ec=c, lw=2.5))
        ax.text(x0 + full * v / 100 + .2, y, txt, va="center", fontsize=18, color=c)
    ax.plot([x0, x0], [2.0, 5.85], color=INK, lw=3)
    # nudges per month
    months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"]; n = [74, 95, 124, 134, 360, 465, 315]
    bx, by, bw = 5.2, 0.55, .62
    ax.text(bx - .25, by + .45, "nudges sent per month", ha="right", va="center", fontsize=18)
    for i, (m, v) in enumerate(zip(months, n)):
        x = bx + .15 + i * (bw + .25)
        ax.add_patch(plt.Rectangle((x, by), bw, v / 465 * .95, fc=GREY, ec=GREY, lw=2))
        ax.text(x + bw / 2, by - .3, m, ha="center", fontsize=15, color=GREY)
        if m in ("Feb", "Jul"): ax.text(x + bw / 2, by + v / 465 * .95 + .16, str(v), ha="center", fontsize=15)
    ax.plot([bx, bx + 6.4], [by, by], color=INK, lw=3)
    ax.text(11.9, by + .55, "switched off\n20 Aug, after the\nagents objected", fontsize=16, color=RED, linespacing=1.05, va="center")
    save(fig, "nudge-bot")

# ── 5. Hill chart: where each claim stands ───────────────────────────────────
# data-scouts/authority-recognition/HYPOTHESIS.md (status column). Position on the hill is a judgement.
def hill():
    W, H = 15, 7.6
    fig, ax = canvas(W, H, "Where each claim stands", "uphill: still figuring it out · downhill: checked against the raw rows")
    xs = np.linspace(1.2, W - 1.2, 300); u = (xs - xs[0]) / (xs[-1] - xs[0])
    hy = lambda uu: 1.5 + 3.6 * np.sin(np.pi * uu) ** 1.15
    ax.plot(xs, hy(u), color=INK, lw=6)
    ax.plot([xs[0] - .3, xs[-1] + .3], [1.5, 1.5], color=INK, lw=3)
    ax.plot([W / 2, W / 2], [1.1, 5.6], color=GREY, lw=2.2, ls=(0, (5, 5)))
    ax.text(W / 4 + .3, 0.85, "figuring it out", ha="center", font=BRUSH, fontsize=22, color=GREY)
    ax.text(3 * W / 4 - .3, 0.85, "known", ha="center", font=BRUSH, fontsize=22, color=GREY)
    pts = [(0.14, "compliance rates by source\n(text coding sits at base rate)", "left", RED),
           (0.27, "do agents tell organizers from\nimpostors? (5 addressed cases)", "left", RED),
           (0.40, "is a delegated leader\nan authority? (mixed)", "left", RED),
           (0.60, "addressed orders beat\ndiffuse norms", "right", INK),
           (0.70, "a stated rule reaches memory,\nthen decays", "right", INK),
           (0.80, "the nudge bot misfired\nmost of the time", "right", INK),
           (0.90, "staff permission\ndid not move\nHaiku 5.5", "right", INK)]
    for uu, lab, side, c in pts:
        x = xs[0] + uu * (xs[-1] - xs[0]); y = hy(uu); blob(ax, x, y, .2, c)
        if side == "left": ax.text(x - .35, y + .28, lab, ha="right", va="bottom", fontsize=15.5, linespacing=1.05, color=c)
        else: ax.text(x + .35, y + .28, lab, ha="left", va="bottom", fontsize=15.5, linespacing=1.05, color=c)
    save(fig, "hill-chart-claims")

for f in (timeline, recapture, kindness, nudger, hill): f()
